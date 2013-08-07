"use strict";

var EventEmitter = require("events").EventEmitter,
    proto = EventEmitter.prototype;

function nodeEvents(List) {
    var config = List.prototype.config,
        key;

    config.emit = proto.emit;
    config.on = proto.on;
    config.removeListener = proto.removeListener;

    for (key in proto) { /* jshint forin: false */
        List.prototype[key] = proto[key];
    }
}

module.exports = nodeEvents;