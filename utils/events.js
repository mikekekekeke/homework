'use strict';

const EventEmitter = require('events');

class InternalEventEmitter extends EventEmitter {

    constructor(...args) {
        super(...args);
    }

    /**
     * Used to call functions on services.
     * @param {String} event_name Event name to trigger.
     * @param  {...any} args Method arguments.
     */
    dispatch(event_name, ...args) {
        this.emit(event_name, args);

        return this;
    }

};

module.exports = new InternalEventEmitter();
