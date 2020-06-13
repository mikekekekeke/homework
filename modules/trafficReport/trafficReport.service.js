const Service = require('../../classes/Service');
const trafficReport = require('./trafficReport.model');
const scannerTraffic = require('../scannerTraffic/scannerTraffic.model');
const Scanner = require('../scanner/scanner.model');
const { SCANNER: scannerConfig } = require('../../config/model_constants');


class TrafficReportService extends Service {

    /**
     * Generates weekly report and saves it.
     */
    async generateReport() {
        const lastScannerTraffic = await trafficReport.findOne({}).sort({ _id: -1 }).exec();
        let dateFrom;
        if(lastScannerTraffic && lastScannerTraffic.Date) {
            dateFrom = new Date(lastScannerTraffic.Date);
        } else {
            dateFrom = new Date();
            dateFrom.setUTCDate(dateFrom.getUTCDate() - 7);
        }
        const dateTo = _.clone(dateFrom);
        dateTo.setUTCDate(dateTo.getUTCDate() + 7);

        const scannerTrafficForWeek = await scannerTraffic.find({ hourTimestamp: { $gte: dateFrom.getTime(), $lt: dateTo.getTime()} });
        const groupedScannerTraffic = _.groupBy(scannerTrafficForWeek, 'imei');
        const allImeiFromTraffic = Object.keys(groupedScannerTraffic);
        const scanners = await Scanner.find({ $or: _.map(allImeiFromTraffic, (imei) => ({ imei }))});

        const preparedReports = [];
        allImeiFromTraffic.map((imei) => {
            preparedReports.push(this._generateReportForEachScanner(_.find(scanners, ['imei', imei]), groupedScannerTraffic[imei], dateTo.getTime()));
        });


        await trafficReport.create(preparedReports);
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
