/**
 * Module dependencies.
 */

var Adapter = require('./adapter');
var AttrBinding = require('./attr-binding');
var TextBinding = require('./text-binding');
var debug = require('debug')('reactive');
var bindings = require('./bindings');
var Binding = require('./binding');
var utils = require('./utils');
var query = require('query');
var Emitter = require('emitter');
var settings = require('./settings');
var walk = require('./walk');

/**
 * Expose `Reactive`.
 */

exports = module.exports = Reactive;

/**
 * Bindings.
 */

exports.bindings = {};

/**
 * Expose adapter
 */

exports.adapter = undefined;

/**
 * Expose settings
 */

exports.settings = settings;

/**
 * Define binding `name` with callback `fn(el, val)`.
 *
 * @param {String} name or object
 * @param {String|Object} name
 * @param {Function} fn
 * @api public
 */

exports.bind = function(name, fn){
  if ('object' == typeof name) {
    for (var key in name) {
      exports.bind(key, name[key]);
    }
    return;
  }

  exports.bindings[name] = fn;
};

/**
 * Middleware
 * @param {Function} fn
 * @api public
 */

exports.use = function(fn) {
  fn(exports);
  return this;
};

/**
 * Initialize a reactive template for `el` and `obj`.
 *
 * @param {Element} el
 * @param {Element} obj
 * @param {Object} options
 * @api public
 */

function Reactive(el, model, view) {
  if (!(this instanceof Reactive)) {
    return new Reactive(el, model, view);
  }

  this.Adapter = exports.adapter || Adapter;
  this.el = el;
  this.model = model;
  this.els = [];
  this.view = view || {};

  // adapters map of keypath -> adapter
  this._adapters = {};

  // attributes we might bind later
  this._future = {};

  this.bindings = {};
  for (var key in exports.bindings) {
    this.bindings[key] = exports.bindings[key];
  }

  // bind what we know now
  this._bind();
}

Emitter(Reactive.prototype);

/**
 * @api private
 */
Reactive.prototype._bind = function() {
  var self = this;

  var bindings = self.bindings;

  walk(self.el, function(el, next) {
    // element
    if (el.nodeType == 1) {
      var skip = false;

      var attrs = {};
      for (var i = 0; i < el.attributes.length; ++i) {
        var attr = el.attributes[i];
        var name = attr.name;
        attrs[name] = attr;
      }

      // bindings must be iterated first
      // to see if any request skipping
      // only then can we see about attributes
      Object.keys(bindings).forEach(function(name) {
        if (!attrs[name] || skip) {
          return;
        }

        debug('bind [%s]', name);

        var prop = attrs[name].value;
        var binding_fn = bindings[name];
        if (utils.hasInterpolation(prop) || !binding_fn) {
          return;
        }

        var binding = new Binding(name, self, el, binding_fn);
        binding.bind();
        if (binding.skip) {
          skip = true;
        }
      });

      if (skip) {
        return next(skip);
      }

      // if we are not skipping
      // bind any interpolation attrs
      for (var i = 0; i < el.attributes.length; ++i) {
        var attr = el.attributes[i];
        var name = attr.name;
        if (utils.hasInterpolation(attr.value)) {
          new AttrBinding(self, el, attr);
        }
        else {
          // what if this appears more than once?
          // need to keep a list of future shit
          // available to bind later
          if (!self._future[name]) {
            self._future[name] = []
          }

          self._future[name].push(el);
        }
      }

      return next(skip);
    }
    // text
    else if (el.nodeType == 3) {
      if (utils.hasInterpolation(el.data)) {
        debug('bind text "%s"', el.data);
        new TextBinding(self, el);
      }
    }

    next();
  });
};

/**
 * Bind `name` to `fn`.
 *
 * @param {String|Object} name or object
 * @param {Function} fn
 * @api public
 */
Reactive.prototype.bind = function(name, fn) {
  var self = this;

  if ('object' == typeof name) {
    for (var key in name) {
      self.bind(key, name[key]);
    }
    return;
  }

  var els = self._future[name];
  els.forEach(function(el) {
    var binding = new Binding(name, self, el, fn);
    binding.bind();
  });

  return this;
};

/**
 * Use middleware
 *
 * @api public
 */

Reactive.prototype.use = function(fn) {
  fn(this);
  return this;
};

// used by bindings to subscribe to a key's changes
Reactive.prototype.sub = function(key, fn) {
  var self = this;

  // ensure we have an adapter for this key
  self.adapter(key);

  self.on('change ' + key, fn);
  return self;
};

// get the value of a key
Reactive.prototype.get = function(key) {
  var self = this;

  if (key === 'this') {
    return self.model;
  }

  var view = self.view;
  if ('function' == typeof view[key]) {
    return view[key]();
  }

  // view value
  if (view.hasOwnProperty(key)) {
    return view[key];
  }

  var adapter = self.adapter(key);
  return adapter.get();
};

// set the value of a key
Reactive.prototype.set = function(key, value) {
  var self = this;

  debug('set %s = %s', key, value);
  var adapter = self.adapter(key);
  adapter.set(value);

  return self.emit('change ' + key, value);
};

// get the adapter for this key
// if no adapter has yet been created, one will be created
Reactive.prototype.adapter = function(key) {
  var self = this;
  var Adapter = self.Adapter;

  var adapters = self._adapters;
  if (!adapters[key]) {
    adapters[key] = new Adapter(self, self.model, key);
  }

  return adapters[key];
};

Reactive.prototype.destroy = function() {
  var self = this;

  if (self.el.parentNode) {
    self.el.parentNode.removeChild(self.el);
  }

  for (var key in self._adapters) {
    self._adapters[key].teardown();
    self.off('change ' + key);
  }

  self.emit('destroyed');
};

// bundled bindings

exports.use(bindings);
