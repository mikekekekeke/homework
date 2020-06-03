const chalk = require('chalk');

const { NODE_ENV } = require('./static');
const ERROR = require('./errors');
const CONFIG = require('./config');

const errorUtils = require('../utils/error');

_ = require('lodash');

ReS = function (ctx, body, status = 200) {
    ctx.status = status;
    if (_.isEmpty(body)) ctx.status = 204;
    ctx.body = body;
};

ReE = function (ctx, error, status) {

    const parsed = errorUtils.parseError(error, ctx);

    ctx.status = status || parsed.status;
    ctx.body = { error: parsed.message, code: parsed.code, sub_code: parsed.sub_code };
};

Respond = function (ctx, error, success_response, status) {
    if (error) return ReE(ctx, error, status);
    return ReS(ctx, success_response, status);
};

isJSON = function (string) {
    try {
        JSON.parse(string);
        return true;
    } catch (e) {
        return false;
    }
};

parseJSON = function (string) { //Silent parser.
    try {
        const parsed = JSON.parse(string);
        return parsed;
    } catch (e) {
        return string;
    }
};

sleep = ms => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms || 0);
    });
};

TO = (promise, default_resolve = null) => { //Same as Promise.to(), but for non-native or weird Promises used by different modules.
    return promise
        .then(r => [null, r])
        .catch(e => [e, default_resolve])
};

log = function (message, options = {}) {
    if (_.isObject(message) || _.isArray(message)) message = JSON.stringify(message, null, 3);
    if (!message.endsWith('.')) message += '.';
    console.log(`${options.prefix || ''}${chalk.bold((`(${new Date().toISOString()}@PID:${process.pid})`))}: ${message}`);
};

log.info = function (message) {
    return this(message, { prefix: chalk.green.bold('[INFO]') });
};

log.debug = function (message) {
    return this(message, { prefix: chalk.cyan.bold('[DEBUG]') });
};

log.warning = function (message) {
    return this(message, { prefix: chalk.yellow.bold('[WARNING]') });
};

log.danger = function (message) {
    return this(message, { prefix: chalk.red.bold('[DANGER]') });
};

let exclude_log_type = [];

switch (CONFIG.LOG.LEVEL) {

    case CONFIG.LOG.LEVELS.DANGER:
        exclude_log_type = ['warning', 'info', 'debug'];
        break;

    case CONFIG.LOG.LEVELS.WARNING:
        exclude_log_type = ['info', 'debug'];
        break;

    case CONFIG.LOG.LEVELS.INFO:
        exclude_log_type = ['debug'];
        break;

    case CONFIG.LOG.LEVELS.DEBUG:
        exclude_log_type = [];
        break;

    default:
        exclude_log_type = [null, 'danger', 'info', 'warning', 'debug'];
        break;

}

if (CONFIG.NODE_ENV === NODE_ENV.MOCHA) {
    exclude_log_type = [null, 'danger', 'info', 'warning', 'debug'];
}

exclude_log_type.forEach(ex => !ex ? log = () => null : log[ex] = () => null);

GenericError = class extends Error {
    constructor(message, sub_code, ...args) {
        super(message, ...args);
        this.name = ERROR.TYPE.GENERIC;
        this.sub_code = sub_code;
    };
};

NotFoundError = class extends Error {
    constructor(name, sub_code, ...args) {
        super(`${name} not found.`, ...args);
        this.name = ERROR.TYPE.NOT_FOUND;
        this.sub_code = sub_code;
    };
};

InputValidationError = class extends Error {
    constructor(message, sub_code, ...args) {
        super(message, ...args);
        this.name = ERROR.TYPE.INPUT_VALIDATION;
        this.sub_code = sub_code;
    }
};

DuplicateError = class extends Error {
    constructor(message, sub_code, ...args) {
        super(message, ...args);
        this.name = ERROR.TYPE.DUPLICATE;
        this.sub_code = sub_code;
    }
};

AuthenticationError = class extends Error {
    constructor(message, sub_code, ...args) {
        super(message, ...args);
        this.name = ERROR.TYPE.AUTHENTICATION;
        this.sub_code = sub_code;
    }
};

PermissionError = class extends Error {
    constructor(message, sub_code, ...args) {
        super(message, ...args);
        this.name = ERROR.TYPE.PERMISSION;
        this.sub_code = sub_code;
    }
};

RateError = class extends Error {
    constructor(message, sub_code, ...args) {
        super(message, ...args);
        this.name = ERROR.TYPE.RATE;
        this.sub_code = sub_code;
    }
};

ConflictError = class extends Error {
    constructor(message, sub_code, ...args) {
        super(message, ...args);
        this.name = ERROR.TYPE.CONFLICT;
        this.sub_code = sub_code;
    }
};

module.exports = {};