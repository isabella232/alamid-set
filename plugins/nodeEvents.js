"use strict";

var EventEmitter = require("events").EventEmitter,
    proto = EventEmitter.prototype;

function nodeEvents(Set) {
    var config = Set.prototype.config,
        constructor = Set.prototype.constructor,
        key;

    config.emit = proto.emit;
    config.on = proto.on;
    config.removeListener = proto.removeListener;
    config.removeAllListeners = proto.removeAllListeners;

    for (key in proto) { /* jshint forin: false */
        if (Set.prototype.hasOwnProperty(key)) {
            throw new Error("Cannot apply nodeEvents-plugin: There is already a '" + key + "'-property defined.");
        }
        Set.prototype[key] = proto[key];
    }

    Set.prototype.constructor = function () {
        EventEmitter.call(this);
        constructor.apply(this, arguments);
    };
}

module.exports = nodeEvents;