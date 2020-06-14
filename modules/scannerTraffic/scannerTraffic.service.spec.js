const { expect } = require('chai');
const sinon = require('sinon');

describe('Scanner traffic service testing', () => {

  const scannerTrafficService = require('./scannerTraffic.service');

  const ScannerTraffic = require('./scannerTraffic.model');
  const Scanner = require('../scanner/scanner.model');

  const { COMMON, SCANNER } = require('../../config/model_constants');


  const MOCK_CITY = COMMON.CITY.VILNIUS;
  const MOCK_ROAD = 'a1';
  const MOCK_COORDINATES = '40.714, -74.006';

  describe('and the method saveScans shall', async () => {

    before(() => ScannerTraffic.deleteMany().exec());

    afterEach(() => ScannerTraffic.deleteMany().exec());

    after(() => Scanner.deleteMany().exec());

    it('throw a validation error if the body defined not property', async () => {

      const [error] = await scannerTrafficService.saveScans(
        'imei',
        [ { timestamp: 123, traffic: { in: 123, out: 123, extra: 123 } } ],
        { status: 'active' },
        ).to();

      expect(error).to.be.not.null;
      expect(error).to.be.instanceOf(Error);

    });

    it(`returns 0 scans response if scanner has ${SCANNER.STATUSES.asObject.INACTIVE}`, async () => {

      const [, result] = await scannerTrafficService.saveScans(
        'imei',
        [ { timestamp: 123, traffic: { in: 123, out: 123 } } ],
        { status: SCANNER.STATUSES.asObject.INACTIVE },
        ).to();

      expect(result).to.be.an('object');
      expect(result.scans).to.equal(0);

    });

    it(`returns 2 scans response and scanner will appear to ${SCANNER.STATUSES.asObject.ACTIVE} from ${SCANNER.STATUSES.asObject.OUT_OF_ORDER}`, async () => {

      await Scanner.create({ name: 'AAAAAAA', city: MOCK_CITY, imei: '123', road: MOCK_ROAD.toUpperCase(), coordinates: MOCK_COORDINATES });

      const date = new Date();
      date.setUTCHours(date.getUTCHours() + 1);
      const fakeScanner = {
        get status() {
          return SCANNER.STATUSES.asObject.OUT_OF_ORDER
        },
        set status(status) {
          expect(status).to.equal(SCANNER.STATUSES.asObject.ACTIVE);
        },
        save: () => {},
      };

      sinon.stub(fakeScanner, 'save').callsFake(async () => null);
      const [, result] = await scannerTrafficService.saveScans(
        '123',
        [
          { timestamp: new Date().getTime(), traffic: { in: 123, out: 123 } },
          { timestamp: date.getTime(), traffic: { in: 123, out: 123 } },
        ],
        fakeScanner,
      ).to();

      expect(result).to.be.an('object');
      expect(result.scans).to.equal(2);

      expect(fakeScanner.save.calledOnce).to.be.be.true;

    });

  });

});
