var domify = require('domify');
var assert = require('assert');
var Emitter = require('emitter');
var clone = require('clone');

var reactive = require('../');

var adapter = clone(reactive.adapter);

// simplified backbone adapter
var BackboneAdapter = function(reactive, model, key) {
  var self = this;
  self._model = model;
  self._key = key;

  model.on('change:' + key, self._handler = function() {
    self._setting = true;
    reactive.set(key, reactive.get(key));
    self._setting = false;
  });
};

BackboneAdapter.prototype.get = function() {
  var self = this;
  return self._model.get(self._key);
};

BackboneAdapter.prototype.set = function(val) {
  var self = this;

  if (self._setting) {
    return;
  }

  self._model.set(self._key, val);
};

BackboneAdapter.prototype.teardown = function() {
  var self = this;
  if (!self._handler) {
    return;
  }

  self._model.off('change:' + self._key, self._handler);
};

// Backbone-like Model

function Person(attrs) {
  if (!(this instanceof Person)) return new Person(attrs);
  this.attrs = attrs;
}

Emitter(Person.prototype);

Person.prototype.set = function(prop, val) {
  this.attrs[prop] = val;
  this.emit('change:' + prop, val);
};

Person.prototype.get = function(prop) {
  return this.attrs[prop];
};

// Tests

describe('custom adapter', function() {
  var el, person;

  before(function() {
    reactive.adapter = BackboneAdapter;
  });

  // go back to defaults to prevent leaking
  after(function() {
    reactive.adapter = undefined;
  });

  beforeEach(function() {
    person = Person({ name: 'Matt' });
    el = domify('<div><h1 data-text="name"></h1></div>');
  });

  it('setting obj[prop] should update view', function() {
    reactive(el, person);
    person.set('name', 'TJ');
    assert('TJ' == el.children[0].textContent);
  });

  it('shouldnt update view after being unsubscribed', function() {
    var react = reactive(el, person);
    assert('Matt' == el.children[0].textContent);

    // should unbind any handlers to the model and any internal handlers
    react.destroy();

    person.set('name', 'TJ');
    assert('Matt' == el.children[0].textContent);

    react.set('name', 'TJ');
    assert('Matt' == el.children[0].textContent);
  });

  it('setting view should update object', function() {
    var react = reactive(el, person);
    react.set('name', 'TJ');
    assert('TJ' == el.children[0].textContent);
    assert('TJ' == person.get('name'));
  });
});
