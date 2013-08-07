"use strict";

function subset(Set) {
    Set.prototype.subset = function (filter) {
        var master = this,
            obj = {},
            subset = new Set(obj),
            on = subset.config.on;

        function onMasterAdd(event) {
            var element = event.element,
                key = event.key;

            if (filter && !filter(element, key, subset)) {
                return;
            }

            Set.prototype.set.call(subset, key, element);
        }

        function onMasterRemove(event) {
            Set.prototype.remove.call(subset, event.key);
        }

        copy(master.toObject(), obj, filter, subset);

        subset.set = master.set.bind(master);
        subset.remove = master.remove.bind(master);
        subset.getMaster = function () {
            return master;
        };

        on.call(master, "add", onMasterAdd);
        on.call(master, "remove", onMasterRemove);

        return subset;
    };
}

function copy(source, target, filter, subset) {
    var value,
        key;

    for (key in source) {
        if (source.hasOwnProperty(key)) {
            value = source[key];

            if (filter && !filter(value, key, subset)) {
                continue;
            }

            target[key] = value;

        }
    }

    return target;
}

module.exports = subset;