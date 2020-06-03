const { expect } = require('chai');
const sinon = require('sinon');

describe('User service testing', async () => {

    const userService = require('./user.service');
    const sessionService = require('../session/session.service');

    const User = require('./user.model');

    const ERRORS = require('../../config/errors');
    const { USER, PLACEHOLDER_ID } = require('../../config/model_constants');


    const MOCK_USERNAME = 'Nick_boy21313';
    const MOCK_PASSWORD = 'Tk4kj2h4k2h34h2hj';

    describe('and the method addUser shall', () => {

        before(async () => User.deleteMany().exec());

        afterEach(async () => User.deleteMany().exec());

        it('throw a validation error if the username or password are invalid', async () => {

            return Promise.all([
                [ null, null ],
                [ MOCK_USERNAME, '13212' ],
                [ 'dsf', MOCK_PASSWORD ]
            ].map(async params => {

                const [error] = await userService.addUser(...params).to();
 
                expect(error).to.be.not.null;
                expect(error).to.be.instanceOf(InputValidationError);

            }));

        });

        it('throw a duplicate error if the username already exists', async () => {

            await userService.addUser(MOCK_USERNAME, MOCK_PASSWORD);

            const [error] = await userService.addUser(MOCK_USERNAME, MOCK_PASSWORD).to();
 
            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(DuplicateError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.DUPLICATE);

        });

        it('register a new user', async () => {

            await userService.addUser(MOCK_USERNAME, MOCK_PASSWORD);

            const user = await User.findOne({ username: MOCK_USERNAME.toLowerCase() }, '+password').exec();

            expect(user).to.be.not.null;
            expect(user.password).to.not.equal(MOCK_PASSWORD);
            expect(user.checkPassword(MOCK_PASSWORD)).to.be.true;
            expect(user.role).to.equal(USER.ROLE.USER);

        });

    });

    describe('an the method addRootUser shall', () => {

        before(async () => User.deleteMany().exec());

        afterEach(async () => User.deleteMany().exec());

        it('return false if the root user already exists', async () => {

            await userService.addRootUser(MOCK_USERNAME, MOCK_PASSWORD);

            const result = await userService.addRootUser(MOCK_USERNAME, MOCK_PASSWORD);

            expect(result).to.be.false;

        });

        it('register a root user', async () => {

            await userService.addRootUser(MOCK_USERNAME, MOCK_PASSWORD);

            const user = await User.findOne({ username: MOCK_USERNAME.toLowerCase() }, '+password').exec();

            expect(user).to.be.not.null;
            expect(user.password).to.not.equal(MOCK_PASSWORD);
            expect(user.checkPassword(MOCK_PASSWORD)).to.be.true;
            expect(user.role).to.equal(USER.ROLE.ROOT);

        });


    });

    describe('and the method removeUser', async () => {
        
        before(async () => User.deleteMany().exec());

        beforeEach(() => sinon.stub(sessionService, 'clearUserSessions').callsFake(async () => true))

        afterEach(async () => {
            sessionService.clearUserSessions.restore();

            await User.deleteMany().exec();
        });

        it('throw a not found error if the user was not found', async () => {

            const [error] = await userService.removeUser(PLACEHOLDER_ID, PLACEHOLDER_ID).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(NotFoundError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.NOT_FOUND);

        });

        it('throw a conflict error if trying to remove yourself', async () => {

            const user = await userService.addUser(MOCK_USERNAME, MOCK_PASSWORD);

            const [error] = await userService.removeUser(user._id, user._id).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(ConflictError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.REMOVE_YOURSELF);

        });

        it('throw a conflict error if trying to remove yourself', async () => {

            const root = await userService.addRootUser(MOCK_USERNAME, MOCK_PASSWORD);

            const [error] = await userService.removeUser(root._id, PLACEHOLDER_ID).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(ConflictError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.REMOVE_ROOT);

        });

        it('remove the user and clear all session', async () => {

            const user = await userService.addUser(MOCK_USERNAME, MOCK_PASSWORD);

            const result = await userService.removeUser(user._id, PLACEHOLDER_ID);

            expect(result).to.be.true;

            const removed = await User.findById(user._id).exec();

            expect(removed).to.be.null;

            expect(sessionService.clearUserSessions.calledOnce).to.be.true;
            expect(sessionService.clearUserSessions.calledWith(user._id)).to.be.true;

        });

    });

    describe('and the method removeUser', async () => {

        const MOCK_NEW_PASSWORD = 'hg45324hj32g5h2g53hj2';
        
        before(async () => User.deleteMany().exec());

        beforeEach(() => sinon.stub(sessionService, 'clearUserSessions').callsFake(async () => true))

        afterEach(async () => {
            sessionService.clearUserSessions.restore();

            await User.deleteMany().exec();
        });

        it('throw a not found error if the user was not found', async () => {

            const [error] = await userService.changePassword(PLACEHOLDER_ID, MOCK_PASSWORD, MOCK_PASSWORD).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(NotFoundError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.NOT_FOUND);

        });

        it('throw  conflict error if the previous password does not match', async () => {

            const user = await userService.addUser(MOCK_USERNAME, MOCK_PASSWORD);

            const [error] = await userService.changePassword(user._id, MOCK_NEW_PASSWORD, MOCK_PASSWORD).to();

            expect(error).to.be.not.null;
            expect(error).to.be.instanceOf(ConflictError);
            expect(error.sub_code).to.equal(ERRORS.SUB_CODE.USER.INVALID_OLD_PASSWORD);

        });

        it('change the password and clear all other sessions', async () => {

            let user = await userService.addUser(MOCK_USERNAME, MOCK_PASSWORD);

            await userService.changePassword(user._id, MOCK_PASSWORD, MOCK_NEW_PASSWORD, PLACEHOLDER_ID).to();

            user = await User.findById(user._id, '+password').exec();

            expect(user.checkPassword(MOCK_PASSWORD)).to.be.false;
            expect(user.checkPassword(MOCK_NEW_PASSWORD)).to.be.true;

            expect(sessionService.clearUserSessions.calledOnce).to.be.true;
            expect(sessionService.clearUserSessions.calledWith(user._id, PLACEHOLDER_ID)).to.be.true;

        });

    });

    describe('and the method fetchUsers shall', async () => {

        before(async () => User.deleteMany().exec());

        afterEach(async () => User.deleteMany().exec());

        it('return an empty array if there no users', async () => {

            const result = await userService.fetchUsers();

            expect(result.count).to.equal(0);
            expect(result.users).to.deep.equal([]);

        });

        it('only return users and not root', async () => {

            const [root] = await Promise.all([
                userService.addRootUser('fsdfssfdsfds', 'dssadadsada'),
                userService.addUser('fdsfsfs', 'dssadadsada'),
                userService.addUser('sfdsfsfdfddsf', 'dssadadsada'),
                userService.addUser('32424323', 'dssadadsada')
            ]);

            const result = await userService.fetchUsers();

            expect(result.count).to.equal(3);
            
            result.users.forEach(u => {

                expect(u._id).to.not.deep.equal(root._id);
                expect(u.username).to.be.a('string');

            })

        });

    });

});