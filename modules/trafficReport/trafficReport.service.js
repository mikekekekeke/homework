const Service = require('../../classes/Service');

const TrafficReport = require('./trafficReport.model');
const ScannerTraffic = require('../scannerTraffic/scannerTraffic.model');
const Scanner = require('../scanner/scanner.model');

const { SCANNER: scannerConfig } = require('../../config/model_constants');
const CONFIG = require('../../config/config');

const { mongoose } = require('../../core/database');

const { schemas, validateInput } = require('../../utils/validation');


class TrafficReportService extends Service {

    /**
     * Fetches a paginated list of traffic resorts.
     * @param {Number} [limit] Optional record limit.
     * @param {Number} [offset] Optional record offset,
     * @param {Object} [filters] Optional city and road filters.
     */
    async fetchReports(limit = 100, offset = 0, filters = {}) {

        limit = validateInput(limit, schemas.limit);
        offset = validateInput(offset, schemas.offset);
        filters = validateInput(filters, schemas.scanner.traffic.report.filters);

        if (filters.trafficNumber) filters._id = mongoose.Types.ObjectId(filters.trafficNumber);
        delete filters.trafficNumber;
        if (!filters.date) {
            delete filters.date;
        } else filters.date = filters.date.getTime();
        if (!filters.road) delete filters.road;

        const result = await TrafficReport.aggregate([{
            $match: filters
        }, {
            $sort: { created_at: -1 }
        }, {
            $project: {
                _id: 1,
                road: 1,
                date: 1,
                totalPerWeek: 1
            }
        }, {
            $facet: {
                trafficReport: [{
                    $skip: offset
                }, {
                    $limit: limit
                }],

                count: [{
                    $count: 'count'
                }]
            }
        }]).exec();

        return { trafficReport: _.get(result, '[0].trafficReport', []), count: _.get(result, '[0].count[0].count', 0) };

    }

    /**
     * Fetches traffic report details.
     * @param {(ObjectId|String)} report_id Traffic report ID.
     */
    async fetchReport(report_id) {
        report_id = validateInput(report_id, schemas.objectId);

        const cached = this.cache.get(String(report_id));
        if(cached) return cached;

        let trafficReport = await TrafficReport.findById(report_id).exec();

        if(!trafficReport) throw new NotFoundError(`Traffic report (${report_id})`, ERRORS.SUB_CODE.TRAFFIC_REPORT.NOT_FOUND);

        const scanner = await Scanner.findById(trafficReport.scannerId).exec();

        trafficReport = trafficReport.toWeb();
        delete trafficReport.city;
        delete trafficReport.scannerId;
        delete trafficReport.created_at;
        delete trafficReport.updated_at;
        // Unfortunately, scanners dont have a model.
        trafficReport.scanner = {
            _id: scanner._id,
            imei: scanner.imei,
            coordinates: scanner.coordinates,
        }

        this.cache.set(String(report_id), trafficReport, CONFIG.TRAFFIC_REPORT.CACHE_TTL);

        return trafficReport;
    }

    /**
     * Generates weekly report and saves it.
     */
    async generateReport() {
        const lastScannerTraffic = await TrafficReport.findOne({}).sort({ _id: -1 }).exec();
        let dateFrom;
        if(lastScannerTraffic && lastScannerTraffic.date) {
            dateFrom = new Date(lastScannerTraffic.date);
        } else {
            dateFrom = new Date();
            dateFrom.setUTCDate(dateFrom.getUTCDate() - 7);
        }
        const dateTo = _.clone(dateFrom);
        dateTo.setUTCDate(dateTo.getUTCDate() + 7);

        const scannerTrafficForWeek = await ScannerTraffic.find({ hourTimestamp: { $gte: dateFrom.getTime(), $lt: dateTo.getTime()} });
        if (scannerTrafficForWeek.length === 0) {
            log.warning(`Not found scanner traffic for a week.`);
            return true;
        }
        const groupedScannerTraffic = _.groupBy(scannerTrafficForWeek, 'imei');
        const allImeiFromTraffic = Object.keys(groupedScannerTraffic);
        const scanners = await Scanner.find({ $or: _.map(allImeiFromTraffic, (imei) => ({ imei }))});

        const preparedReports = [];
        allImeiFromTraffic.map((imei) => {
            preparedReports.push(this._generateReportForEachScanner(_.find(scanners, ['imei', imei]), groupedScannerTraffic[imei], dateTo.getTime()));
        });


        await TrafficReport.create(preparedReports);
        return true;
    }

    /**
     * Generates report for each scanner.
     * @param {Object} scanner Scanner for which will generate a report.
     * @param {Object} scannerTraffic Scanner's traffic from which will generate a report.
     * @param {timestamp} reportDateTimeStamp Timestamp of report.
     */
    _generateReportForEachScanner(scanner, scannerTraffic, reportDateTimeStamp) {
        return {
            city: scanner.city,
            road: scanner.road,
            scannerId: scanner._id,
            date: reportDateTimeStamp,
            totalPerWeek: {
                in: _.sumBy(scannerTraffic, ({ traffic }) => traffic.in),
                out: _.sumBy(scannerTraffic, ({ traffic }) => traffic.out),
            },
            totalDuringWeek: {
                in: this._getTrafficForEachDay(scannerTraffic, scannerConfig.DIRECTIONS.asObject.IN),
                out: this._getTrafficForEachDay(scannerTraffic, scannerConfig.DIRECTIONS.asObject.OUT),
            },
            topFiveHotHours: this._getTopHotHours(scannerTraffic, 5),
        };
    }

    /**
     * Returns top hour hours of traffic.
     * @param {Object} scannerTraffic Scanner's traffic from which will generate a report.
     * @param {Number} topSize Number of top hot hours.
     */
    _getTopHotHours(scannerTraffic, topSize) {
        const topHours = [];
        const inMax = this._getMaxByDirection(scannerTraffic, scannerConfig.DIRECTIONS.asObject.IN, topSize);
        const outMax = this._getMaxByDirection(scannerTraffic, scannerConfig.DIRECTIONS.asObject.OUT, topSize);
        for(let i = 0; i < topSize; i++) {
            topHours.push(_.maxBy([...inMax, ...outMax], (trafficItem) => {
                const existenceInTop = _.find(topHours, ['_id', trafficItem._id]);
                if (!existenceInTop || existenceInTop.direction !== trafficItem.direction) return trafficItem.carsAmount;
                return 0;
            }))
        }
        return topHours.map(({ timestamp, direction, carsAmount }) => ({ timestamp, direction, carsAmount }));
    }

    /**
     * Returns max cars amount of traffic for exact direction.
     * @param {Object} scannerTraffic Scanner's traffic from which will generate a report.
     * @param {String} direction Direction of cars.
     * @param {Number} countOfMax Number of max cars amount.
     */
    _getMaxByDirection(scannerTraffic, direction, countOfMax) {
        const result = [];
        for(let i = 0; i < countOfMax; i++) {
            const maxByDirection = _.maxBy(scannerTraffic, (trafficItem) => {
                if (!_.find(result, ['_id', trafficItem._id])) return trafficItem.traffic[direction];
                return 0;
            })
            result.push({
                _id: maxByDirection._id,
                carsAmount: maxByDirection.traffic[direction],
                direction,
                timestamp: maxByDirection.hourTimestamp,
            });
        }
        return result;
    }

    /**
     * Returns traffic of cars for each weekday.
     * @param {Object} traffic Traffic from which will count cars amount.
     * @param {String} direction Direction of cars.
     */
    _getTrafficForEachDay(traffic, direction) {
        const result = {
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0,
        };
        traffic.map((trafficItem) => {
            result[getWeekdayFromTimestamp(trafficItem.hourTimestamp)] += trafficItem.traffic[direction];
        });

        return result;

        function getWeekdayFromTimestamp(timestamp) {
            switch (new Date(timestamp).getUTCDay()) {
                case 0: return 'monday';
                case 1: return 'tuesday';
                case 2: return 'wednesday';
                case 3: return 'thursday';
                case 4: return 'friday';
                case 5: return 'saturday';
                case 6: return 'sunday';
            }
        }
    }
}



module.exports = new TrafficReportService('TrafficReport');
