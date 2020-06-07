const Service = require('../../classes/Service');

const Scanner = require('./scanner.model');

const ERRORS = require('../../config/errors');
const CONFIG = require('../../config/config');
const { EVENTS } = require('../../config/static');
const { SCANNER } = require('../../config/model_constants');

const { ObjectId } = require('mongodb');
const { schemas, validateInput } = require('../../utils/validation');

class ScannerService extends Service {

    /**
     * Returns scanner default status.
     */
    getDefaultScannerStatus() {
        return SCANNER.defaultStatus;
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

        scanner.set({
            name: name || scanner.name,
            imei: imei || scanner.imei
        });

        await scanner.save();

        if(imei && previous_imei !== imei) this.emitter.dispatch(EVENTS.SCANNER.ON_IMEI_CHANGE, scanner._id, previous_imei, imei);

        return scanner.toWeb();

    }

    /**
     * @todo Handle IMEI changes here.
     * @param {(ObjectId|String)} scanner_id Scanner database id.
     * @param {String} previous_imei Previous IMEI.
     * @param {String} new_imei new IMEI.
     */
    async onImeiChange(scanner_id, previous_imei, new_imei) {

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
                road: 1
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

}

module.exports = new ScannerService('Scanner', { events: EVENTS.SCANNER });
