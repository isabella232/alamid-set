"use strict";

/**
 * Simple observable array. It acts just like an array but you can listen for
 * "add"-, "remove"- and "sort"-events. Instead of setting and retrieving
 * values via bracket notation you should use .set() and .at().
 *
 * @constructor
 */
function Set() {
    Set.prototype.constructor.apply(this, arguments);
}

/**
 * Internal object.
 *
 * @type {Object}
 * @private
 */
Set.prototype._elements = null;

/**
 * The default config.
 *
 * @type {{emit: Function, on: Function, removeListener: Function, removeAllListeners: Function}}
 */
Set.prototype.config = {
    emit: throwMethodMissingError("emit"),
    on: throwMethodMissingError("on"),
    removeListener: throwMethodMissingError("removeListener"),
    removeAllListeners: throwMethodMissingError("removeAllListeners")
};

Set.prototype.constructor = function (obj) {
    this._elements = obj || {};
};

Set.prototype.set = function (key, element) {
    var elements = this._elements,
        prevElement = elements[key];

    if (prevElement !== element) {
        if (this.has(key)) {
            emit(this, RemoveEvent, prevElement, key);
        }

        this._elements[key] = element;
        emit(this, AddEvent, element, key);
    }

    return this;
};

Set.prototype.setAll = function (obj) {
    var key;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            this.set(key, obj[key]);
        }
    }

    return this;
};

Set.prototype.get = function (key) {
    return this._elements[key];
};

Set.prototype.getAll = function () {
    var elements = this._elements,
        all = {},
        key;

    for (key in elements) {
        if (elements.hasOwnProperty(key)) {
            all[key] = this.get(key);
        }
    }

    return all;
};

Set.prototype.has = function (key) {
    return this._elements.hasOwnProperty(key);
};

Set.prototype.remove = function (key) {
    var element = this._elements[key];

    if (this.has(key)) {
        delete this._elements[key];
        emit(this, RemoveEvent, element, key);
    }

    return element;
};

Set.prototype.toObject = function () {
    return this._elements;
};

Set.prototype.dispose = function () {
    delete this._elements;
    this.config.removeAllListeners.call(this);
};

Set.configure = function (newConfig) {
    this.prototype.config = newConfig;

    return this;
};

/**
 * Calls the given function with the List as argument. Plugins can be used to hook into class methods by
 * overriding them.
 *
 * @param {Function} plugin
 * @returns {Set}
 */
Set.use = function (plugin) {
    plugin(this);

    return this;
};

function throwMethodMissingError(method) {
    return function () {
        throw new Error("(alamid-set) You need to configure a '" + method + "'-method for the List");
    };
}

function emit(self, Event, arg1, arg2, arg3) {
    self.config.emit.call(self, Event.prototype.name, new Event(self, arg1, arg2, arg3));
}

function AddEvent(target, element, key) {
    this.target = target;
    this.element = element;
    this.key = key;
}

/**
 * @type {String}
 */
AddEvent.prototype.name = "add";

/**
 * The set that emitted the event
 * @type {Function}
 */
AddEvent.prototype.target = null;

/**
 * @type {*}
 */
AddEvent.prototype.element = null;

/**
 * @type {String}
 */
AddEvent.prototype.key = null;

function RemoveEvent(target, element, key) {
    this.target = target;
    this.element = element;
    this.key = key;
}

/**
 * @type {string}
 */
RemoveEvent.prototype.name = "remove";

/**
 * The set that emitted the event
 * @type {Function}
 */
RemoveEvent.prototype.target = null;

/**
 * @type {*}
 */
RemoveEvent.prototype.element = null;

/**
 * @type {Number}
 */
RemoveEvent.prototype.key = null;

module.exports = Set;