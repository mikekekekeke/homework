module.exports = {

    TYPE: {
        VALIDATION: 'ValidationError',
        INPUT_VALIDATION: 'InputValidationError',
        NOT_FOUND: 'NotFoundError',
        DUPLICATE: 'DuplicateError',
        GENERIC: 'GenericError',
        AUTHENTICATION: 'AuthenticationError',
        PERMISSION: 'PermissionError',
        CONFLICT: 'ConflictError',
    },

    CODE: {
        VALIDATION: 100,
        NOT_FOUND: 101,
        INTERNAL: 102,
        DUPLICATE: 103,
        GENERIC: 104,
        AUTHENTICATION: 105,
        PERMISSION: 106,
        CONFLICT: 107,
    },

    SUB_CODE: {

        GENERAL: {
            CRON_JOB: 800
        },

        USER: {
            NOT_FOUND: 1000,
            DUPLICATE: 1001,
            REMOVE_ROOT: 1002,
            REMOVE_YOURSELF: 1003,
            INVALID_OLD_PASSWORD: 1004,
            INVALID_USERNAME_PASSWORD: 1005,
        },

        SESSION: {
            INVALID_TOKEN: 2000,
            SESSION_EXPIRED: 2001,
            ROOT_ONLY: 2002
        },

        SCANNER: {
            DUPLICATE: 3000,
            NOT_FOUND: 3001
        }

    }

};