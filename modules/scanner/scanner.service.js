const Service = require('../../classes/Service');

const Scanner = require('./scanner.model');
const ScannerTraffic = require('../scannerTraffic/scannerTraffic.model');

const ERRORS = require('../../config/errors');
const CONFIG = require('../../config/config');
const { EVENTS } = require('../../config/static');
const { SCANNER } = require('../../config/model_constants');

const { ObjectId } = require('mongodb');
const { schemas, validateInput } = require('../../utils/validation');

class ScannerService extends Service {

    /**
     * Verifies an imei of scanner.
     */
    async checkStatuses() {
        const allScanners = await Scanner.find();
        const scannersLastTraffic = await this._getLastTrafficForScanners(allScanners);

        const diactivatedScannersAmount = await this._analyzeScannersActivityAndDiactivateIfNeed(allScanners, scannersLastTraffic);
        return { scannersChecked: allScanners.length, scannersOutOfOrder: diactivatedScannersAmount };
    }

    /**
     * Verifies an imei of scanner.
     * @param {String} imei Imei of scanner.
     */
    async verifyImei(imei) {
        imei = validateInput(imei, schemas.string, 'IMEI must be a string');
        const scanner = await Scanner.findOne({ imei }).exec();
        if (!scanner) throw new NotFoundError('Scanner', ERRORS.SUB_CODE.SCANNER.NOT_FOUND);
        return { scanner };
    }

    /**
     * Returns scanner default status.
     */
    getUnknownScannerCoordinates() {
        return SCANNER.UNKNOWN_COORDINATES;
    }

    /**
     * Returns scanner default status.
     */
    getDefaultScannerStatus() {
        return SCANNER.DEFAULT_STATUS;
    }

    /**
     * Adds a new scanner for a combination of city and road.
     * @param {String} name Name for the scanner.
     * @param {String} imei IMEI of the scanner.
     * @param {String} city City where the scanner is placed.
     * @param {String} road Road number where the scanner is stationed.
     * @param {String} coordinates Coordinates of the scanner location.
     * @param {String} status Status of scanner.
     */
    async addScanner(name, imei, city, road, coordinates, status) {

        name = validateInput(name, schemas.string, 'Name must a be a string');
        imei = validateInput(imei, schemas.string, 'IMEI must be a string');
        city = validateInput(city, schemas.city);
        road = validateInput(road, schemas.scanner.road);
        coordinates = validateInput(coordinates, schemas.scanner.coordinates);
        status = validateInput(status, schemas.scanner.status);
        await this._checkCoordinates(coordinates);

        /**
         * We will allow one scanner for each road and city, as how they should be in real life.
         * During editing we don't allow to change city or road, only the name and IMEI, in case they have to replace the scanner hardware.
         */
        const duplicate = await Scanner.findOne({ city, road }, '_id').lean().exec();

        if(duplicate) throw new DuplicateError('Scanner already exists with the given city and road.', ERRORS.SUB_CODE.SCANNER.DUPLICATE);

        const scanner = await Scanner.create({ name, imei, city, road, coordinates, status });

        return scanner.toWeb();

    }

    /**
     * Edits a scanners name or IMEI or both.
     * @param {(ObjectId|String)} scanner_id Scanner ID.
     * @param {String} [name] New name.
     * @param {String} [imei] New IMEI.
     */
    async editScanner(scanner_id, name, imei) {

        scanner_id = validateInput(scanner_id, schemas.objectId);
        if(name) name = validateInput(name, schemas.string, 'Name must a be a string');
        if(imei) imei = validateInput(imei, schemas.string, 'IMEI must be a string');

        const scanner = await Scanner.findById(scanner_id).exec();

        if(!scanner) throw new NotFoundError(`Scanner(${scanner_id})`, ERRORS.SUB_CODE.SCANNER.NOT_FOUND);

        const previous_imei = scanner.imei;
        const previous_name = scanner.name;

        scanner.set({
            name: name || scanner.name,
            imei: imei || scanner.imei
        });

        await scanner.save();

        if ((imei && previous_imei !== imei)
          || (name && name !== previous_name)) this.emitter.dispatch(EVENTS.SCANNER.ON_DATA_CHANGE, scanner);

        return scanner.toWeb();

    }

    /**
     * Handles changes with scanner's data.
     * @param {(Object)} updatedScanner Scanner updated with new data.
     */
    async onScannerDataChange(updatedScanner) {
        this.cache.set(String(updatedScanner._id), updatedScanner.toWeb(), CONFIG.SCANNER.CACHE_TTL);
    }

    /**
     * Fetches scanner details.
     * @param {(ObjectId|String)} scanner_id Scanner ID.
     */
    async fetchScanner(scanner_id) {

        scanner_id = validateInput(scanner_id, schemas.objectId);

        const cached = this.cache.get(String(scanner_id));
        if(cached) return cached;

        const scanner = await Scanner.findById(scanner_id).exec();

        if(!scanner) throw new NotFoundError(`Scanner(${scanner_id})`, ERRORS.SUB_CODE.SCANNER.NOT_FOUND);

        this.cache.set(String(scanner_id), scanner.toWeb(), CONFIG.SCANNER.CACHE_TTL);

        return scanner.toWeb();

    }

    /**
     * Fetches a paginated list of scanners.
     * @param {Number} [limit] Optional record limit.
     * @param {Number} [offset] Optional record offset,
     * @param {Object} [filters] Optional city and road filters.
     */
    async fetchScanners(limit = 100, offset = 0, filters = {}) {

        limit = validateInput(limit, schemas.limit);
        offset = validateInput(offset, schemas.offset);
        filters = validateInput(filters, schemas.scanner.filters);

        const result = await Scanner.aggregate([{
            $match: filters
        }, {
            $sort: { created_at: -1 }
        }, {
            $project: {
                _id: 1,
                name: 1,
                city: 1,
                road: 1,
                coordinates: 1,
                status: 1
            }
        }, {
            $facet: {
                scanners: [{
                    $skip: offset
                }, {
                    $limit: limit
                }],

                count: [{
                    $count: 'count'
                }]
            }
        }]).exec();

        return { scanners: _.get(result, '[0].scanners', []), count: _.get(result, '[0].count[0].count', 0) };

    }

    /**
     * Fetches a paginated list of scanners.
     * @param {Number} [limit] Optional record limit.
     * @param {Number} [offset] Optional record offset,
     * @param {Object} [filters] Optional city and road filters.
     */
    async fetchScannersBasic(limit = 100, offset = 0, filters = {}) {
        limit = validateInput(limit, schemas.limit);
        offset = validateInput(offset, schemas.offset);
        filters = validateInput(filters, schemas.scanner.basic.filters);
        if (filters.coordinates) await this._checkCoordinates(filters.coordinates);

        const result = await Scanner.aggregate([{
            $sort: { created_at: -1 }
        }, {
            $project: {
                _id: 1,
                coordinates: 1,
                status: 1,
                imei: 1,
            }
        }, {
            $facet: {
                scanners: [{
                    $skip: offset
                }, {
                    $limit: limit
                }],
            }
        }]).exec();

        let scanners = _.get(result, '[0].scanners', []);
        if (filters.coordinates && filters.radius) {
            scanners = _.filter(scanners, (scanner) => {
                if (scanner.coordinates === this.getUnknownScannerCoordinates()) return false;
                return this._detectAre2CoordinatePointsInAllowRadius(scanner.coordinates, filters.coordinates, filters.radius);
            });
        }

        if (scanners.length !== 0) {
            const lastScannersTraffic = await this._getLastTrafficForScanners(scanners);
            scanners.map((scanner) => {
                const lastScannerTraffic = _.find(lastScannersTraffic, ['imei', scanner.imei]);
                scanner.lastSeen = lastScannerTraffic ? lastScannerTraffic.createdAt.getTime() : null;
                delete scanner.imei;
            })
        }
        return { scanners, count: scanners.length };
    }

    /**
     * Detects are two coordinates points in allow radius.
     * @param {String} coordinates1 First coordinates point.
     * @param {String} coordinates2 Second coordinates point.
     * @param {number} allowRadius Allow radius for 2 points(in meters).
     */
    _detectAre2CoordinatePointsInAllowRadius(coordinates1, coordinates2, allowRadius) {
        let { latitude: lat1, longitude: lon1 } = this._getLatitudeAndLongitudeFromCoordinates(coordinates1);
        let { latitude: lat2, longitude: lon2 } = this._getLatitudeAndLongitudeFromCoordinates(coordinates2);

        const R = CONFIG.RADIUS_OF_EARTH_IN_KM; // Radius of the earth in km
        const dLat = toRad(lat2-lat1);
        const dLon = toRad(lon2-lon1);
        lat1 = toRad(lat1);
        lat2 = toRad(lat2);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(3) * 1000 <= allowRadius;

        // Converts numeric degrees to radians
        function toRad(Value)
        {
            return Value * Math.PI / 180;
        }
    }

    /**
     * Analyzes scanners, and diactivates them if need.
     * @param {Array} scanners Scanners for analyzing.
     * @param {Array} scannersLastTraffic Scanners last traffic for analyzing.
     */
    async _analyzeScannersActivityAndDiactivateIfNeed(scanners, scannersLastTraffic) {
        const promises = [];
        scanners.map((scanner) => {
            const scannerLastTraffic = _.find(scannersLastTraffic, ['imei', scanner.imei]);
            if (this._detectIsScannerShouldBeOutOfOrder(scanner, scannerLastTraffic && scannerLastTraffic.createdAt)) {
                scanner.status = SCANNER.STATUSES.asObject.OUT_OF_ORDER;
                promises.push(scanner.save());
            }
        })
        await Promise.all(promises);
        return promises.length;
    }

    /**
     * Returns last traffic for given scanners
     * @param {Array} scanners Scanners for last traffic extracting.
     */
    _getLastTrafficForScanners(scanners) {
        return ScannerTraffic.aggregate([
            {
                $match:  { $or: _.map(scanners, ({ imei }) => ({ imei }))}
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$imei',
                    'createdAt': {
                        $first: '$createdAt'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    imei: '$_id',
                    createdAt: 1
                }
            }
        ]);
    }

    /**
     * Detects is scanner should have out_of_order status
     * @param {Object} scanner Scanner for detection.
     * @param {Timestamp} lastActiveTime Timestamp for inactivity deadline logic.
     */
    _detectIsScannerShouldBeOutOfOrder(scanner, lastActiveTime) {
        if (scanner.status === SCANNER.STATUSES.asObject.OUT_OF_ORDER) return false;

        const inactivityDeadline = new Date();
        inactivityDeadline.setUTCHours(inactivityDeadline.getUTCHours() - CONFIG.SCANNER.INACTIVITY_DEADLINE_IN_HOURS);
        if (!lastActiveTime) return scanner.created_at.getTime() < inactivityDeadline.getTime();
        return lastActiveTime.getTime() < inactivityDeadline.getTime();
    }

    /**
     * Verifies a coordinates of scanner.
     * Valid format of coordinates: '40.714, -74.006' (LATITUDE, LONGITUDE)
     * Note: written as service function because of app using old 'hapi'
     * validator version, which does not support custom validation function
     * @param {String} coordinates Coordinates of scanner.
     */
    _checkCoordinates(coordinates) {
        // Valid coordinates format '40.714, -74.006' (LATITUDE, LONGITUDE)
        const { latitude, longitude } = this._getLatitudeAndLongitudeFromCoordinates(coordinates);
        if (!isFinite(latitude) || Math.abs(latitude) > 90
          || !isFinite(longitude) && Math.abs(longitude) > 180
        ) {
            throw new InputValidationError('Invalid coordinates', ERRORS.SUB_CODE.SCANNER.INVALID_PARAMETER);
        }
        return coordinates;
    };

    /**
     * Returns splitted latitude and longitude from coordinates string.
     * @param {String} coordinates Coordinates string.
     */
    _getLatitudeAndLongitudeFromCoordinates(coordinates) {
        const latitude = coordinates.slice(0, coordinates.indexOf(','));
        const longitude = coordinates.slice(coordinates.indexOf(' ') + 1, coordinates.length);
        return { latitude, longitude };
    }

}

module.exports = new ScannerService('Scanner', { events: EVENTS.SCANNER });
