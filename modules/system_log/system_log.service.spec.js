const { expect } = require('chai');

describe('System log service testing', () => {

    const systemLogService = require('./system_log.service');
    const SystemLog = require('./system_log.model');

    const { SYSTEM_LOG } = require('../../config/model_constants');


    const MOCK_METHOD = 'POST';
    const MOCK_ENDPOINT = '/api/cats/tabby?color=red';
    const MOCK_REQUEST = { limit: 1, offset: 1 };
    const MOCK_RESPONSE = { cats: [ { id: 1 } ], count: 3 };

    const MOCK_CONTEXT = {
        url: MOCK_ENDPOINT,
        method: MOCK_METHOD,
        request: {
            body: MOCK_REQUEST
        },
        body: MOCK_RESPONSE
    };

    const MOCK_ERROR = new Error('Nobody likes errors');
    const MOCK_REFERENCES = {
        order_id: _.random(100, 10000),
        payment_id: _.random(600, 600000)
    };

    const MOCK_MESSAGE = 'Something cool happened.';

    const MOCK_DOC = {
        name: 'Steve', role: 'Village idiot'
    };

    describe('and the method createLog shall', () => {    

        before(async () => {
            await SystemLog.deleteMany().exec();
        });

        afterEach(async () => {
            await SystemLog.deleteMany().exec();
        });

        it('create a simple log with only a message', async () => {

            const result = await systemLogService.createLog(SYSTEM_LOG.TYPE.ERROR, SYSTEM_LOG.SUB_TYPES.ERROR.INTERNAL, MOCK_MESSAGE);

            expect(result).to.be.true;

            const [ log, count ] = await Promise.all([
                SystemLog.findOne().exec(),
                SystemLog.countDocuments().exec()
            ]);

            expect(count).to.equal(1);

            expect(log.type).to.equal(SYSTEM_LOG.TYPE.ERROR);
            expect(log.sub_type).to.equal(SYSTEM_LOG.SUB_TYPES.ERROR.INTERNAL);
            expect(log.message).to.equal(MOCK_MESSAGE);
            expect(log.created_at).to.be.a('date');

            expect(log.details).to.be.null;

        });

        it('create a log an error with the stack', async () => {

            const result = await systemLogService.createLog(SYSTEM_LOG.TYPE.ERROR, SYSTEM_LOG.SUB_TYPES.ERROR.INTERNAL, MOCK_ERROR.message, MOCK_ERROR.stack);

            expect(result).to.be.true;

            const [ log, count ] = await Promise.all([
                SystemLog.findOne().exec(),
                SystemLog.countDocuments().exec()
            ]);

            expect(count).to.equal(1);

            expect(log.type).to.equal(SYSTEM_LOG.TYPE.ERROR);
            expect(log.sub_type).to.equal(SYSTEM_LOG.SUB_TYPES.ERROR.INTERNAL);
            expect(log.message).to.equal(MOCK_ERROR.message);
            expect(log.created_at).to.be.a('date');
            expect(log.details).to.equal(MOCK_ERROR.stack);

        });        

    });

    describe('and the method logInternalError shall', () => {

        before(async() => {
            await SystemLog.deleteMany().exec();
        });

        afterEach(async () => {
            await SystemLog.deleteMany().exec();
        });

        it('correctly log an internal error', async () => {

            const result = await systemLogService.logInternalError(MOCK_ERROR);

            expect(result).to.be.true;

            const log = await SystemLog.findOne().exec();

            expect(log.type).to.equal(SYSTEM_LOG.TYPE.ERROR);
            expect(log.sub_type).to.equal(SYSTEM_LOG.SUB_TYPES.ERROR.INTERNAL);
            expect(log.message).to.equal(MOCK_ERROR.message);
            expect(log.details).to.equal(MOCK_ERROR.stack);

        });

    });

});