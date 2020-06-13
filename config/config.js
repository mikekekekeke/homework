const { NODE_ENV } = require('./static');

const reportMissing = (variable, default_val = undefined) => {
    console.log(`[ENV] Missing "${variable}" environmental variable!`);
    return default_val;
};

module.exports = {

    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    NODE_ENV: process.env.NODE_ENV || NODE_ENV.DEVELOPMENT,

    DATABASE: {
        get URL() {
            let url = '';
            switch (module.exports.NODE_ENV) {

                case NODE_ENV.PRODUCTION:
                    url = process.env.DATABASE_URL_PRODUCTION;
                    break;

                case NODE_ENV.DEVELOPMENT:
                    url = process.env.DATABASE_URL_DEVELOPMENT;
                    break;

                case NODE_ENV.MOCHA:
                    url = process.env.DATABASE_URL_MOCHA;
                    break;

            }

            return url || process.env.DATABASE_URL || reportMissing('DATABASE_URL');
        }
    },

    SYSTEM_LOG: {
        MAX_RETIRES: process.env.SYSTEM_LOG_MAX_RETIRES ? parseInt(process.env.SYSTEM_LOG_MAX_RETIRES) : 5,
        RETRY_INTERVAL: process.env.SYSTEM_LOG_RETRY_INTERVAL ? parseInt(process.env.SYSTEM_LOG_RETRY_INTERVAL) * 1000 : 10000 //env in seconds
    },

    LOG: {
        LEVELS: {
            DANGER: 1,
            WARNING: 2,
            INFO: 3,
            DEBUG: 4
        },
        get LEVEL() { return process.env.LOG_LEVEL ? this.LEVELS[process.env.LOG_LEVEL.toUpperCase()] : 0 }
    },

    SESSION: {
        JWT_SECRET: process.env.JWT_SECRET || reportMissing('JWT_SECRET', 'Q29uZ3JhdHohIFlvdSBrbm93IEJhc2U2NCE='),
        USER_EXPIRATION: process.env.USER_SESSION_EXPIRATION ? parseInt(process.env.USER_SESSION_EXPIRATION, 10) * 60 * 1000 : 24 * 60 * 60 * 1000, //env in minutes
        CACHE_TTL : 5 * 60,
    },

    USER: {
        PASSWORD_SALT_ROUNDS: process.env.PASSWORD_SALT_ROUNDS ? parseInt(process.env.PASSWORD_SALT_ROUNDS, 10) : 5,
        ROOT: {
            USERNAME: process.env.ROOT_USERNAME,
            PASSWORD: process.env.ROOT_PASSWORD
        }
    },

    SCANNER: {
        CACHE_TTL: 10 * 60
    },

    TRAFFIC_REPORT: {
        CACHE_TTL: 10 * 60
    },

    JOBS: {
        TRAFFIC_REPORT: {
            ENABLED: (process.env.TRAFFIC_REPORT_JOB_ENABLED === true.toString()),
        }
    }
};
