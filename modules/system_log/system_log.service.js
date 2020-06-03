'use strict';

const Service = require('../../classes/Service');

const { EVENTS } = require('../../config/static');
const { SYSTEM_LOG } = require('../../config/model_constants');
const CONFIG = require('../../config/config');

const SystemLog = require('./system_log.model');

class SystemLogService extends Service {

    constructor(name, options = {}) {
        super(name, options);
    }

    /**
     * Creates a system log.
     * @param {String} type Log type. 
     * @param {String} sub_type Sub type of the log.
     * @param {String} message Short message for the log.
     * @param {String} [details] Description or stack.
     */
    async createLog(type, sub_type, message, details = null, attempt = 0) {

        log[type === SYSTEM_LOG.TYPE.ERROR ? 'danger' : 'info'](`<${type.toUpperCase()}:${sub_type.toUpperCase()}>: ${message}`);
        
        const doc = { type, sub_type, message, details };
        const [ err ] = await SystemLog.create(doc).to();

        if(err) {
            attempt++;
            if(attempt >= CONFIG.SYSTEM_LOG.MAX_RETIRES) {
                console.log(`Failed to create the system log: ${err.message || err}`); //Last resort
                console.log(JSON.stringify(doc, null, 4));
                return false;
            }

            setTimeout(() => this.createLog(type, sub_type, message, details, attempt), CONFIG.SYSTEM_LOG.RETRY_INTERVAL * attempt);
            return false;
        }

        return true;

    }

    /**
     * Logs an internal error that occurred somewhere on the system.
     * @param {Error} error Error received. 
     * @param {String} [sub_type] More precise sub type of the internal error.
     */
    async logInternalError(error, sub_type = SYSTEM_LOG.SUB_TYPES.ERROR.INTERNAL) {
        log.danger(error.stack);
        return this.createLog(SYSTEM_LOG.TYPE.ERROR, sub_type, error.message, error.stack);
    }

};

module.exports = new SystemLogService('System Log', { events: EVENTS.SYSTEM_LOG });