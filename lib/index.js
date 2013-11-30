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

  this.bindAll();
  this.bindInterpolation(this.el, []);
}

Emitter(Reactive.prototype);

/**
 * Traverse and bind all interpolation within attributes and text.
 *
 * @param {Element} el
 * @api private
 */

Reactive.prototype.bindInterpolation = function(el, els){
  var self = this;

  // element
  if (el.nodeType == 1) {
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (utils.hasInterpolation(attr.value)) {
        new AttrBinding(self, el, attr);
      }
    }
  }

  // text node
  if (el.nodeType == 3) {
    if (utils.hasInterpolation(el.data)) {
      debug('bind text "%s"', el.data);
      new TextBinding(self, el);
    }
  }

  // walk nodes
  for (var i = 0; i < el.childNodes.length; i++) {
    var node = el.childNodes[i];
    this.bindInterpolation(node, els);
  }
};

/**
 * Apply all bindings.
 *
 * @api private
 */

Reactive.prototype.bindAll = function() {
  for (var name in exports.bindings) {
    this.bind(name, exports.bindings[name]);
  }
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

  var els = query.all('[' + name + ']', self.el);
  if (self.el.hasAttribute && self.el.hasAttribute(name)) {
    els = [].slice.call(els);
    els.unshift(self.el);
  }
  if (!els.length) return;

  debug('bind [%s] (%d elements)', name, els.length);
  for (var i = 0; i < els.length; i++) {

    var el = els[i];

    // we create an adapter for each 'property' we need to interface with
    var key = el.getAttribute(name);
    self.adapter(key);

    var binding = new Binding(name, self, els[i], fn);
    binding.bind();
  }
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

  for (var key in self._adapters) {
    self._adapters[key].teardown();
    self.off('change ' + key);
  }
};

// bundled bindings

exports.use(bindings);
