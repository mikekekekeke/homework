const emitter = require('../utils/events');
const NodeCache = require('node-cache');

class Service {

    /**
     * Creates a new instance of a service.
     * @param {String} name Name of the service.
     * @param {Object} [options] Additional options.
     * @param {Object|String[]} [options.events] `Object` or a `String` array containing events to register.
     * @param {Boolean} [options.separate_event_name] Set to `true` to have separate function names for local and global events, example: `sendEmailLocally` and `globalSendEmailGlobally`. Defaults to `false`.
     * @param {Number} [options.default_cache_ttl] Number of seconds of how long the cache will be available.
     */
    constructor(name = 'Base', options = {}) {
        this.emitter = emitter;
        this.events = [];
        this.name = name;

        //Cache object which rotates the redis clients for min latency, applies a prefix for the service and converts objects to JSON strings and vice-versa.
        this.cache = new NodeCache();

        const handleEvent = async (function_name, args) => {

            try {
                await this[function_name](...args);
            } catch (e) {
                log.danger(`[${this.name} Service] error occurred during "${function_name}" call:`);
                log.danger(e);
            }
        };

        if (options.events) { //Register events.

            if (_.isArray(options.events)) this.events = options.events;
            else if (_.isObject(options.events)) this.events = Object.values(options.events);
            else throw new Error(`"options.events" must be an Object or a String[].`);

            this.events.forEach(event => {

                const function_name = _.camelCase(event);

                if (_.isFunction(this[function_name])) {

                    this.emitter.on(event, args => handleEvent(function_name, args));

                    log.debug(`Event method "${function_name}" registered for ${this.name} Service`);

                }
                else log.danger(`Event method "${function_name}" for service "${this.name}" not registered`);

            });

        }

        log.info(`${this.name} Service is ready`);
    }

};

module.exports = Service;