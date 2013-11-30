
/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:text-binding');
var utils = require('./utils');

/**
 * Expose `TextBinding`.
 */

module.exports = TextBinding;

/**
 * Initialize a new text binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 * @param {Attribute} attr
 * @api private
 */

function TextBinding(reactive, node) {
  this.reactive = reactive;
  this.text = node.data;
  this.node = node;
  this.props = utils.interpolationProps(this.text);
  this.subscribe();
  this.render();
}

/**
 * Subscribe to changes.
 */

TextBinding.prototype.subscribe = function(){
  var self = this;
  var reactive = this.reactive;

  var render = function() {
    self.render();
  };

  var props = [];

  this.props.forEach(function(prop) {
    var parts = prop.split('.');
    while (parts.length > 0) {
      var key = parts.join('.');
      if (props.indexOf(key) > 0) {
        break;
      }
      props.push(parts.join('.'));
      parts.pop();
    };
  });

  props.forEach(function(prop) {
      reactive.sub(prop, render);
  });
};

TextBinding.prototype.render = function() {
  var node = this.node;
  var reactive = this.reactive;
  var model = reactive.model;
  var text = this.text;

  // TODO: delegate most of this to `Reactive`
  debug('render %s', text);
  node.data = utils.interpolate(text, function(prop, fn){
    if (fn) {
      return fn(reactive, utils.call);
    }

    return reactive.get(model, prop);
  });
}
