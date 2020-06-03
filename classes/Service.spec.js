const { expect } = require('chai');
const sinon = require('sinon');

describe('Service class testing', () => {

    const Service = require('./Service');

    const emitter = require('../utils/events');

    const MOCK_EVENT = 'send_test_command';

    const MOCK_EVENT_ARRAY = [ MOCK_EVENT ];
    const MOCK_EVENT_OBJECT = { [MOCK_EVENT]: MOCK_EVENT };

    const MOCK_ARGS = [ 'lenny', { count: 1 } ];

    class MockServiceClass extends Service {

        constructor(name, options = {}, done, test_args) {
            super(name, options);

            this.done = done;
            this.current_count = 0;
            this.test_args = test_args;
        }

        sendTestCommand(...args) {
            this.checkCompletion(args);
        }

        sendTestCommandLocally(...args) {
            this.checkCompletion(args);
        }

        sendTestCommandGlobally(...args) {
            this.checkCompletion(args);
        }

        clearOldBoxes(...args) {
            this.checkCompletion(args);
        }

        clearOldBoxesLocally(...args) {
            this.checkCompletion(args);
        }

        clearOldBoxesGlobally(...args) {
            this.checkCompletion(args);
        }

        checkCompletion(args) {
            expect(args).to.deep.equal(this.test_args);
            this.done();
        }

    };

    /**
     * @type {MockServiceClass}
     */
    let mockService;

    afterEach(() => {
        emitter.removeAllListeners();
        mockService.cache.flushAll();
        mockService = null; //Destroy the instance.
    });

    const testServiceClass = (events, done) => {

        const checkSpies = () => {

            expect(mockService.sendTestCommand.calledOnce).to.be.true;


            done();
        };

        mockService = new MockServiceClass('Mocha', { events }, checkSpies, MOCK_ARGS);
        
        sinon.spy(mockService, 'sendTestCommand');

        emitter.dispatch(MOCK_EVENT, ...MOCK_ARGS);

    };

    it('correctly register event as a common function from an object', done => {
        return testServiceClass(MOCK_EVENT_OBJECT, done);
    });
    
    it('correctly register event as a common function from an array', done => {
        return testServiceClass(MOCK_EVENT_ARRAY, done);
    });


});