const Service = require('../../classes/Service');

const ScannerTraffic = require('./scannerTraffic.model');

const { schemas, validateInput } = require('../../utils/validation');
const { SCANNER: scannerConfig } = require('../../config/model_constants');

class ScannerTrafficService extends Service {

    /**
     * Adds a scanner traffic scans.
     * @param {String} imei IMEI of the scanner.
     * @param {Array} scans Scanner's records to save.
     * @param {String} scannerStatus Scanner's status.
     */
    async saveScans(imei, scans, scannerStatus) {

        scans = validateInput(scans, schemas.scanner.traffic.scans);

        if (scannerStatus === scannerConfig.STATUSES.asObject.INACTIVE) return { scans: 0 };

        const trafficGroupedByHourTimestamp = this._splitScansInDayHours(scans);
        const lastScannerTraffic = await ScannerTraffic.findOne({ imei }).sort({_id: 'desc'}).exec();

        const newScannerTraffics = [];
        const timestampKeys = Object.keys(trafficGroupedByHourTimestamp);
        let scanCounter = 0;

        /**
         * Check is latest scan(by asc sorting last scan is 0 element) has same hour
         * as last scan in database, if so, it adding to existence database record,
         * and delete this hour timestamp from records for save.
         */
        if (lastScannerTraffic && lastScannerTraffic.hourTimestamp === timestampKeys[0]) {
            lastScannerTraffic.traffic.in += trafficGroupedByHourTimestamp[timestampKeys[0]].in;
            lastScannerTraffic.traffic.out += trafficGroupedByHourTimestamp[timestampKeys[0]].out;
            await lastScannerTraffic.save();
            scanCounter += trafficGroupedByHourTimestamp[timestampKeys[0]].scanCounter;
            timestampKeys.shift();
        }

        /**
         * Collecting object for database, and counting how mane scan records
         * it going to save, by beforehand prepared 'scanCounter' field.
         * @type {number}
         */
        _.map(timestampKeys, (timestampKey) => {
            scanCounter += trafficGroupedByHourTimestamp[timestampKey].scanCounter;
            delete trafficGroupedByHourTimestamp[timestampKey].scanCounter;
            newScannerTraffics.push({
                imei,
                hourTimestamp: timestampKey,
                traffic: trafficGroupedByHourTimestamp[timestampKey],
            })
        });

        await ScannerTraffic.create(newScannerTraffics);

        return { scans: scanCounter };
    }

    /**
     * Returns timestamp without minutes and seconds accuracy
     * For main traffic scans logic.
     * @param {number} timestamp Timestamp for modifying.
     */
    _getHoursTimestamp(timestamp) {
        const date = new Date(timestamp);
        date.setMinutes(0);
        date.setSeconds(0);
        return date.getTime();
    }

    /**
     * Splitting scans in hours by timestamps and returns the object with traffic grouped by hour (ASC).
     * It is counting 'scanCounter' as well, in order to count exact new records amount in future logic.
     * @param {Array} scans Scanner's records to split.
     */
    _splitScansInDayHours(scans) {
        const hours = {};
        const ascSortedScans = _.sortBy(scans, ({ timestamp }) => timestamp);
        ascSortedScans.map(({ timestamp, traffic }) => {
            const jsTimestamp = timestamp * 1000;
           if (!hours[this._getHoursTimestamp(jsTimestamp)]) {
               hours[this._getHoursTimestamp(jsTimestamp)] = traffic;
               hours[this._getHoursTimestamp(jsTimestamp)].scanCounter = 1;
           }
           else {
               hours[this._getHoursTimestamp(jsTimestamp)].in += traffic.in;
               hours[this._getHoursTimestamp(jsTimestamp)].out += traffic.out;
               ++hours[this._getHoursTimestamp(jsTimestamp)].scanCounter;
           }
        });
        return hours;
    }
}

module.exports = new ScannerTrafficService('ScannerTraffic');
