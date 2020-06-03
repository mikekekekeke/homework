const { EVENTS, NODE_ENV } = require('../config/static');
const CONFIG = require('../config/config');
const ERROR = require('../config/errors');

const emitter = require('../utils/events');

module.exports = {

    /**
     * Parse error for HTTP response.
     * @param {Error} error Error received. 
     */
    parseError(error) {

        let status = 400;
        let code = 0;
        let message = 'Unknown error';
        let sub_code = 0;

        if (_.isString(error)) return { status, code: ERROR.CODE.VALIDATION, message: error };
        if (!_.isObject(error)) return { status, code, message };

        switch (error.name) {

            case ERROR.TYPE.DUPLICATE:
                status = 400;
                code = ERROR.CODE.DUPLICATE;
                message = error.message;
                sub_code = error.sub_code;
                break;

            case ERROR.TYPE.INPUT_VALIDATION:
                status = 400;
                code = ERROR.CODE.VALIDATION;
                message = error.message;
                sub_code = error.sub_code;
                break;

            case ERROR.TYPE.VALIDATION: //Joi validation error
                status = 400;
                code = ERROR.CODE.VALIDATION;
                message = _.isArray(error.details) ? error.details.map(e => e.message).join(', ') : (error.details || error.message || error);
                sub_code = error.sub_code;
                break;

            case ERROR.TYPE.GENERIC:
                status = 400;
                code = ERROR.CODE.GENERIC;
                message = error.message;
                sub_code = error.sub_code;
                break;

            case ERROR.TYPE.CONFLICT:
                status = 400;
                code = ERROR.CODE.CONFLICT;
                message = error.message;
                sub_code = error.sub_code;
                break;

            case ERROR.TYPE.NOT_FOUND:
                status = 404;
                code = ERROR.CODE.NOT_FOUND;
                message = error.message;
                sub_code = error.sub_code;
                break;

            case ERROR.TYPE.AUTHENTICATION:
                status = 403;
                code = ERROR.CODE.AUTHENTICATION;
                message = error.message;
                sub_code = error.sub_code;
                break;

            case ERROR.TYPE.PERMISSION:
                status = 401;
                code = ERROR.CODE.PERMISSION;
                message = error.message;
                sub_code = error.sub_code;
                break;

            default:
                status = 500;
                code = ERROR.CODE.INTERNAL;
                message = 'Internal error';
                break;

        }

        if (status === 500 && CONFIG.NODE_ENV !== NODE_ENV.MOCHA) {
            log.danger(error);
            emitter.dispatch(
                EVENTS.SYSTEM_LOG.LOG_INTERNAL_ERROR,
                error
            );
        }

        return { status, code, message, sub_code };

    }

};