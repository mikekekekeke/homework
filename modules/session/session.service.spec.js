const { expect } = require('chai');
const jwt = require('jsonwebtoken');

describe('Session service testing', () => {

    const sessionService = require('./session.service');

    const Session = require('./session.model');
    const User = require('../user/user.model');

    const ERRORS = require('../../config/errors');
    const CONFIG = require('../../config/config');
    const { PLACEHOLDER_ID } = require('../../config/model_constants');

    describe('and the method clearSessions shall', async () => {

        before(() => Session.deleteMany().exec());

        afterEach(() => Session.deleteMany().exec());

        it('return 0 if no sessions were found', async () => {

            const result = await sessionService.clearSessions();

            expect(result).to.equal(0);

        });

        it('delete the session from the database and cache', async () => {

            const session = await Session.create({ user_id: PLACEHOLDER_ID });
            sessionService.cache.set(String(session._id), session.toJSON(), 200);

            const result = await sessionService.clearSessions({ _id: session._id });
            
            expect(result).to.equal(1);

            const sessions = await Session.countDocuments().exec();

            expect(sessions).to.equal(0);

            const cached = sessionService.cache.get(String(session._id));

            expect(cached).to.be.undefined;

        });

    });

    describe('and the method login shall', async () => {

        const MOCK_USERNAME = 'billllylylly';
        const MOCK_PASSWORD = 'Y87y98Y8Y8Y98Y98Y89y';

        before(() => Promise.all([
            User.deleteMany().exec(),
            Session.deleteMany().exec()
        ]));

        afterEach(() => Promise.all([
            User.deleteMany().exec(),
            Session.deleteMany().exec()
        ]));

        it('throw a conflict error if the user was not found', async () => {

            const [error] = await sessionService.login(MOCK_USERNAME, MOCK_PASSWORD).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(ConflictError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.INVALID_USERNAME_PASSWORD);

        });

        it('throw a conflict error if the user was found but the password is not valid', async () => {

            await User.create({ username: MOCK_USERNAME, password: MOCK_PASSWORD + '2343242' });

            const [error] = await sessionService.login(MOCK_USERNAME, MOCK_PASSWORD).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(ConflictError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.INVALID_USERNAME_PASSWORD);

        });

        it('create a session and a token if the username and password matches', async () => {

            const user = await User.create({ username: MOCK_USERNAME, password: MOCK_PASSWORD });

            const token = await sessionService.login(MOCK_USERNAME, MOCK_PASSWORD);

            expect(token).to.be.a('string');

            const session = await Session.findOne().exec();

            expect(session).to.be.not.null;
            expect(session.user_id).to.deep.equal(user._id);
            expect(session.expires_at.getTime()).to.be.greaterThan(Date.now());

        });

    });

    describe('and the method verifyToken shall', async () => {

        const MOCK_USERNAME = 'billllylylly';
        const MOCK_PASSWORD = 'Y87y98Y8Y8Y98Y98Y89y';

        before(() => Promise.all([
            User.deleteMany().exec(),
            Session.deleteMany().exec()
        ]));

        afterEach(() => Promise.all([
            User.deleteMany().exec(),
            Session.deleteMany().exec()
        ]));

        it('throw a validation error if the token is invalid', async () => {

            const [error] = await sessionService.verifyToken('j53lkj5k3l').to();

            expect(error).to.nested.not.null;
            expect(error).to.be.instanceOf(InputValidationError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.SESSION.INVALID_TOKEN);

        });

        it('throw a authentication error if the session was not found', async () => {

            const token = await jwt.sign({ session_id: PLACEHOLDER_ID, user_id: PLACEHOLDER_ID }, CONFIG.SESSION.JWT_SECRET);

            const [error] = await sessionService.verifyToken(token).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(AuthenticationError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.SESSION.SESSION_EXPIRED);

        });

        it('throw a authentication error if the session has expired', async () => {

            const user = await User.create({ username: MOCK_USERNAME, password: MOCK_PASSWORD });
            const session = await Session.create({ user_id: user._id, expires_at: Date.now() });

            const token = await jwt.sign({ session_id: session._id, user_id: user._id }, CONFIG.SESSION.JWT_SECRET);

            const [error] = await sessionService.verifyToken(token).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(AuthenticationError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.SESSION.SESSION_EXPIRED);

        });

        it('verify the token adn return the session object', async () => {

            const user = await User.create({ username: MOCK_USERNAME, password: MOCK_PASSWORD });
            const session = await Session.create({ user_id: user._id });

            const token = await jwt.sign({ session_id: session._id, user_id: user._id }, CONFIG.SESSION.JWT_SECRET);

            const result = await sessionService.verifyToken(token);

            expect(result).to.be.an('object');
            expect(result.session_id).to.equal(String(session._id));
            expect(result.user).to.be.an('object');
            expect(result.user._id).to.equal(String(user._id));
            expect(result.user.username).to.equal(user.username);

        });

    });

});