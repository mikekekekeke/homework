module.exports = {
    // Object freeze to avoid reassigning during program runtime

    NODE_ENV: Object.freeze({
        PRODUCTION: 'production',
        DEVELOPMENT: 'development',
        MOCHA: 'mocha'
    }),

    REGEX: Object.freeze({
        OBJECT_ID: /^([0-9a-fA-F]){24}$/, //Sometimes ObjectId.isValid may not be enough
    }),

    EVENTS: Object.freeze({
        SYSTEM_LOG: {
            CREATE_LOG: 'create_log',
            LOG_INTERNAL_ERROR: 'log_internal_error'
        },

        SESSION: {
            CLEAR_USER_SESSIONS: 'clear_user_sessions'
        },

        SCANNER: {
            ON_IMEI_CHANGE: 'on_imei_change'
        }
    }),

    SERVER_MODE: Object.freeze({
        CRON: 'cron',
    }),
};
