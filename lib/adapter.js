var Adapter = function(reactive, model, key) {
    var self = this;
    self._model = model || {};
    self._key = key;

    if (!self._model.on) {
        return;
    }

    self._model.on('change ' + key, self._handler = function() {
        self._setting = true;
        // actually sets the value in the view
        reactive.set(key, reactive.get(key));
        self._setting = false;
    });
};

Adapter.prototype.set = function(val) {
    var self = this;
    var key = self._key;

    if (self._setting) {
        return;
    }

    var obj = self._model;
    if ('function' == typeof obj[key]) {
        obj[key](val);
    } else {
        obj[key] = val;
    }
};

Adapter.prototype.get = function() {
    var self = this;
    var key = self._key;

    var parts = key.split('.');
    var obj = self._model;
    var part = parts.shift();
    do {
        if (typeof obj[part] === 'function') {
            obj = obj[part].call(obj);
        }
        else {
            obj = obj[part];
        }

        if (!obj) {
            return undefined;
        }

        part = parts.shift();
    } while(part);

    return obj;
};

// unhook any bindings
Adapter.prototype.teardown = function() {
    var self = this;
    if (!self._handler) {
        return;
    }

    var model = self._model;
    if (!model.off) {
        return
    };

    model.off('change ' + prop, self._handler);
};

module.exports = Adapter;
