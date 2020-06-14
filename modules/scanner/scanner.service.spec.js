const { expect } = require('chai');
const sinon = require('sinon');

describe('Scanner service testing', () => {

    const scannerService = require('./scanner.service');

    const Scanner = require('./scanner.model');

    const ERRORS = require('../../config/errors');
    const { COMMON, PLACEHOLDER_ID, SCANNER } = require('../../config/model_constants');


    const MOCK_NAME = 'Western Vilnius exit';
    const MOCK_IMEI = '3487248762746276487262';
    const MOCK_CITY = COMMON.CITY.VILNIUS;
    const MOCK_ROAD = 'a1';
    const MOCK_COORDINATES = '40.714, -74.006';

    describe('and the method addScanner shall', async () => {

        before(() => Scanner.deleteMany().exec());

        afterEach(() => Scanner.deleteMany().exec());

        it('throw a validation error if the invalid params are passed', async () => {

            return Promise.all([
                [null],
                [MOCK_NAME, {}],
                [MOCK_NAME, MOCK_IMEI, 'Londonas'],
                [MOCK_NAME, MOCK_IMEI, MOCK_CITY, undefined]
            ].map(async params => {

                const [error] = await scannerService.addScanner(...params).to();

                expect(error).to.be.not.null;
                expect(error).to.be.instanceOf(InputValidationError);

            }));

        });

        it('throw a duplicate error if the scanner with same city and road exists', async () => {

            await Scanner.create({ name: 'AAAAAAA', city: MOCK_CITY, imei: '312313131313', road: MOCK_ROAD.toUpperCase(), coordinates: MOCK_COORDINATES });

            const [error] = await scannerService.addScanner(MOCK_NAME, MOCK_IMEI, MOCK_CITY, MOCK_ROAD, MOCK_COORDINATES).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(DuplicateError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.SCANNER.DUPLICATE);


        });

        it('create a new scanner if all conditions have met', async () => {

            const new_scanner = await scannerService.addScanner(MOCK_NAME, MOCK_IMEI, MOCK_CITY, MOCK_ROAD, MOCK_COORDINATES);

            expect(new_scanner).to.be.an('object');

            expect(new_scanner.name).to.equal(MOCK_NAME);
            expect(new_scanner.imei).to.equal(MOCK_IMEI);
            expect(new_scanner.city).to.equal(MOCK_CITY);
            expect(new_scanner.road).to.equal(MOCK_ROAD.toUpperCase());

            expect(new_scanner.created_at).to.be.a('number');
            expect(new_scanner.updated_at).to.be.a('number');

        });

    });

    describe('and the method editScanner shall', async () => {

        const MOCK_NEW_NAME = 'The Great Scanner';
        const MOCK_NEW_IMEI = '73982173981738217398321721';

        before(() => Scanner.deleteMany().exec());

        beforeEach(() => sinon.stub(scannerService, 'onScannerDataChange').callsFake(async () => null));

        afterEach(async () => {
            scannerService.onScannerDataChange.restore();

            await Scanner.deleteMany().exec();
        });

        it('throw a not found error if the scanner was not found', async () => {

            const [error] = await scannerService.editScanner(PLACEHOLDER_ID, MOCK_NEW_NAME, MOCK_NEW_IMEI).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(NotFoundError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.SCANNER.NOT_FOUND);

        });

        it('not make any changes if the new values have not been passed', async () => {

            const scanner = await Scanner.create({ name: MOCK_NAME, imei: MOCK_IMEI, city: MOCK_CITY, road: MOCK_ROAD.toUpperCase(), coordinates: MOCK_COORDINATES });

            await scannerService.editScanner(scanner._id);

            const updated = await Scanner.findById(scanner._id);

            expect(updated.name).to.equal(MOCK_NAME);
            expect(updated.imei).to.equal(MOCK_IMEI);

            expect(scannerService.onScannerDataChange.called).to.be.be.false;

        });

        it('update the name and imei an call onScannerDataChange', async () => {

            const scanner = await Scanner.create({ name: MOCK_NAME, imei: MOCK_IMEI, city: MOCK_CITY, road: MOCK_ROAD.toUpperCase(), coordinates: MOCK_COORDINATES });

            await scannerService.editScanner(scanner._id, MOCK_NEW_NAME, MOCK_NEW_IMEI);

            const updated = await Scanner.findById(scanner._id);

            expect(updated.name).to.equal(MOCK_NEW_NAME);
            expect(updated.imei).to.equal(MOCK_NEW_IMEI);

            expect(scannerService.onScannerDataChange.calledOnce).to.be.be.true;
            expect(scannerService.onScannerDataChange.calledWith(scanner._id, MOCK_IMEI, MOCK_NEW_IMEI));

        });

    });

    describe('and the method fetchScanner shall', async () => {

        before(async () => {
            scannerService.cache.flushAll();

            await Scanner.deleteMany().exec();
        });

        afterEach(async () => {
            scannerService.cache.flushAll();

            await Scanner.deleteMany().exec();
        });

        it('throw a not found error if the scanner was not found', async () => {

            const [error] = await scannerService.fetchScanner(PLACEHOLDER_ID).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(NotFoundError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.SCANNER.NOT_FOUND);

        });

        it('fetch scanner details and cache them in the process', async () => {

            let scanner = await Scanner.create({ name: MOCK_NAME, imei: MOCK_IMEI, city: MOCK_CITY, road: MOCK_ROAD.toUpperCase(), coordinates: MOCK_COORDINATES });

            scanner = await scannerService.fetchScanner(scanner._id);

            expect(scanner).to.be.an('object');

            expect(scanner.name).to.equal(MOCK_NAME);
            expect(scanner.imei).to.equal(MOCK_IMEI);
            expect(scanner.city).to.equal(MOCK_CITY);
            expect(scanner.road).to.equal(MOCK_ROAD.toUpperCase());

            expect(scanner.created_at).to.be.a('number');
            expect(scanner.updated_at).to.be.a('number');

            const cached = scannerService.cache.get(String(scanner._id));

            expect(cached).to.deep.equal(scanner);

        });

    });

    describe('and the method fetchScanners shall', async () => {

        before(() => Scanner.deleteMany().exec());

        afterEach(() => Scanner.deleteMany().exec());

        it('return empty array if there is no data', async () => {

            const result = await scannerService.fetchScanners();

            expect(result).to.be.an('object');
            expect(result.scanners).to.deep.equal([]);
            expect(result.count).to.equal(0);

        });

        it('return a list of scanners', async () => {

            await Promise.all([
                Scanner.create({ name: 'A', city: COMMON.CITY.KAUNAS, road: 'A3', imei: '1', coordinates: MOCK_COORDINATES }),
                Scanner.create({ name: 'B', city: COMMON.CITY.VILNIUS, road: 'B1', imei: '2', coordinates: MOCK_COORDINATES }),
                Scanner.create({ name: 'C', city: COMMON.CITY.KLAIPEDA, road: 'A54', imei: '3', coordinates: MOCK_COORDINATES }),
                Scanner.create({ name: 'D', city: COMMON.CITY.KAUNAS, road: '456', imei: '4', coordinates: MOCK_COORDINATES })
            ]);

            const result = await scannerService.fetchScanners();

            expect(result).to.be.an('object');
            expect(result.count).to.equal(4);

            result.scanners.forEach(s => {

                expect(s._id).to.be.not.undefined;
                expect(s.name).to.be.a('string');
                expect(Object.values(COMMON.CITY)).to.include(s.city);
                expect(s.road).to.be.a('string');
                expect(SCANNER.STATUSES.asArray).to.include(s.status);
                expect(s.coordinates).to.be.a('string');

            });

        });

    });

    describe('and the method fetchScannersBasic shall', async () => {

        before(() => Scanner.deleteMany().exec());

        afterEach(() => Scanner.deleteMany().exec());

        it('throw a validation error if the invalid params are passed', async () => {

            return Promise.all([
                [{ radius: 'radius' }],
                [{ coordinates: 'coordinates' }],
            ].map(async params => {

                const [error] = await scannerService.fetchScannersBasic(...params).to();

                expect(error).to.be.not.null;
                expect(error).to.be.instanceOf(InputValidationError);

            }));

        });

        it('return empty array when coordinates param of New York and radius param 10 meters, but scanner only exist in Los Angeles', async () => {

            await Scanner.create({ name: 'A', city: COMMON.CITY.KAUNAS, road: 'A3', imei: '1', coordinates: '34.052235, -118.243683' });

            const result = await scannerService.fetchScannersBasic(undefined, undefined,{ coordinates: MOCK_COORDINATES, radius: 10 });

            expect(result).to.be.an('object');
            expect(result.scanners).to.deep.equal([]);
            expect(result.count).to.equal(0);

        });

        it('return not empty array when coordinates and radius are allowing find the scanner', async () => {

            await Scanner.create({ name: 'A', city: COMMON.CITY.KAUNAS, road: 'A3', imei: '1', coordinates: '34.052235, -118.243683' });

            const result = await scannerService.fetchScannersBasic(undefined, undefined, { coordinates: MOCK_COORDINATES, radius: 6300000 });

            expect(result).to.be.an('object');
            expect(result.count).to.equal(1);

            result.scanners.forEach(s => {
                expect(s._id).to.be.not.undefined;
                expect(s.coordinates).to.be.a('string');
                expect(SCANNER.STATUSES.asArray).to.include(s.status);
                expect(s).to.have.property('lastSeen');
            });

        });

        it('return a list of scanners', async () => {

            await Promise.all([
                Scanner.create({ name: 'A', city: COMMON.CITY.KAUNAS, road: 'A3', imei: '1', coordinates: MOCK_COORDINATES }),
                Scanner.create({ name: 'B', city: COMMON.CITY.VILNIUS, road: 'B1', imei: '2', coordinates: MOCK_COORDINATES }),
                Scanner.create({ name: 'C', city: COMMON.CITY.KLAIPEDA, road: 'A54', imei: '3', coordinates: MOCK_COORDINATES }),
                Scanner.create({ name: 'D', city: COMMON.CITY.KAUNAS, road: '456', imei: '4', coordinates: MOCK_COORDINATES })
            ]);

            const result = await scannerService.fetchScannersBasic();

            expect(result).to.be.an('object');
            expect(result.count).to.equal(4);

            result.scanners.forEach(s => {
                expect(s._id).to.be.not.undefined;
                expect(s.coordinates).to.be.a('string');
                expect(SCANNER.STATUSES.asArray).to.include(s.status);
                expect(s).to.have.property('lastSeen');
            });

        });

    });

});
