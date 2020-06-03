const { expect } = require('chai');

describe('Error utils testing', () => {

    const errorUtils = require('./error');

    const ERROR = require('../config/errors');

    const MOCK_SUB_CODE = _.random(1, 2000);

    const MOCK_DUPLICATE_ERROR = new DuplicateError('Username already taken', MOCK_SUB_CODE);
    const MOCK_INPUT_VALIDATION_ERROR = new InputValidationError('Settings.value must be an integer', MOCK_SUB_CODE);
    const MOCK_GENERIC_ERROR = new GenericError('Generic error message', MOCK_SUB_CODE);
    const MOCK_CONFLICT_ERROR = new ConflictError('Cats and dogs are not allowed to be together', MOCK_SUB_CODE);
    const MOCK_NOT_FOUND_ERROR = new NotFoundError('Meaning', MOCK_SUB_CODE);
    const MOCK_AUTHENTICATION_ERROR = new AuthenticationError(`You are not authorized`, MOCK_SUB_CODE);
    const MOCK_PERMISSION_ERROR = new PermissionError('You are not cool enough for this', MOCK_SUB_CODE);
    const MOCK_RATE_ERROR = new RateError('Not so fast buddy', MOCK_SUB_CODE);
    const MOCK_ERROR = new Error(`Oh boy, you done goofed up`);

    describe('and the method parseError shall', () => {

        it('parse a duplicate error', () => {

            const result = errorUtils.parseError(MOCK_DUPLICATE_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(400);
            expect(result.message).to.equal(MOCK_DUPLICATE_ERROR.message);
            expect(result.code).to.equal(ERROR.CODE.DUPLICATE);
            expect(result.sub_code).to.equal(MOCK_SUB_CODE);

        });

        it('parse an input validation error error', () => {

            const result = errorUtils.parseError(MOCK_INPUT_VALIDATION_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(400);
            expect(result.message).to.equal(MOCK_INPUT_VALIDATION_ERROR.message);
            expect(result.code).to.equal(ERROR.CODE.VALIDATION);
            expect(result.sub_code).to.equal(MOCK_SUB_CODE);

        });

        it('parse a generic error error', () => {

            const result = errorUtils.parseError(MOCK_GENERIC_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(400);
            expect(result.message).to.equal(MOCK_GENERIC_ERROR.message);
            expect(result.code).to.equal(ERROR.CODE.GENERIC);
            expect(result.sub_code).to.equal(MOCK_SUB_CODE);

        });

        it('parse a conflict error error', () => {

            const result = errorUtils.parseError(MOCK_CONFLICT_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(400);
            expect(result.message).to.equal(MOCK_CONFLICT_ERROR.message);
            expect(result.code).to.equal(ERROR.CODE.CONFLICT);
            expect(result.sub_code).to.equal(MOCK_SUB_CODE);

        });

        it('parse a not found error error', () => {

            const result = errorUtils.parseError(MOCK_NOT_FOUND_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(404);
            expect(result.message).to.equal(MOCK_NOT_FOUND_ERROR.message);
            expect(result.code).to.equal(ERROR.CODE.NOT_FOUND);
            expect(result.sub_code).to.equal(MOCK_SUB_CODE);

        });

        it('parse an authentication error error', () => {

            const result = errorUtils.parseError(MOCK_AUTHENTICATION_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(403);
            expect(result.message).to.equal(MOCK_AUTHENTICATION_ERROR.message);
            expect(result.code).to.equal(ERROR.CODE.AUTHENTICATION);
            expect(result.sub_code).to.equal(MOCK_SUB_CODE);

        });

        it('parse a permission error error', () => {

            const result = errorUtils.parseError(MOCK_PERMISSION_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(401);
            expect(result.message).to.equal(MOCK_PERMISSION_ERROR.message);
            expect(result.code).to.equal(ERROR.CODE.PERMISSION);
            expect(result.sub_code).to.equal(MOCK_SUB_CODE);

        });

        it('parse any unrecognized errors as internal ones', () => {

            const result = errorUtils.parseError(MOCK_ERROR);

            expect(result).to.be.an('object');
            expect(result.status).to.equal(500);
            expect(result.message).to.equal('Internal error');
            expect(result.code).to.equal(ERROR.CODE.INTERNAL);
            expect(result.sub_code).to.equal(0);

        });


    });

});