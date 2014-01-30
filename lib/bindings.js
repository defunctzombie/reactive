/**
 * Module dependencies.
 */

var classes = require('classes');
var event = require('event');

var settings = require('./settings');
var each_binding = require('./each');

// setup the default hide class name
// this is added to the class list for data-hide:true or data-show:false
settings.set('hide-class', 'hide');
settings.set('show-class', 'show');

/**
 * Attributes supported.
 */

var attrs = [
  'id',
  'src',
  'rel',
  'cols',
  'rows',
  'name',
  'href',
  'title',
  'class',
  'style',
  'width',
  'value',
  'height',
  'tabindex',
  'placeholder'
];

/**
 * Events supported.
 */

var events = [
  'change',
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mouseenter',
  'mouseleave',
  'blur',
  'focus',
  'input',
  'submit',
  'keydown',
  'keypress',
  'keyup'
];

/**
 * Apply bindings.
 */

module.exports = function(reactive){

  reactive.bind('each', each_binding);

  /**
   * Generate attribute bindings.
   */

  attrs.forEach(function(attr){
    reactive.bind('data-' + attr, function(el, name, obj){
      this.change(function(){
        el.setAttribute(attr, this.interpolate(name));
      });
    });
  });

/**
 * Append child element.
 */

  reactive.bind('data-append', function(el, name){
    var other = this.value(name);
    el.appendChild(other);
  });

/**
 * Replace element.
 */

  reactive.bind('data-replace', function(el, name){
    var other = this.value(name);
    el.parentNode.replaceChild(other, el);
  });

  /**
   * Show binding.
   */

  reactive.bind('data-show', function(el, name){
    this.change(function(){
      var hide_cls = settings.get('hide-class');
      var show_cls = settings.get('show-class');
      if (this.value(name)) {
        classes(el).add(show_cls).remove(hide_cls);
      } else {
        classes(el).remove(show_cls).add(hide_cls);
      }
    });
  });

  /**
   * Hide binding.
   */

  reactive.bind('data-hide', function(el, name){
    this.change(function(){
      var hide_cls = settings.get('hide-class');
      var show_cls = settings.get('show-class');
      if (this.value(name)) {
        classes(el).remove(show_cls).add(hide_cls);
      } else {
        classes(el).add(show_cls).remove(hide_cls);
      }
    });
  });

  /**
   * Checked binding.
   */

  reactive.bind('data-checked', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        el.setAttribute('checked', 'checked');
      } else {
        el.removeAttribute('checked');
      }
    });
  });

  /**
   * Text binding.
   */

  reactive.bind('data-text', function(el, name){
    this.change(function(){
      el.textContent = this.interpolate(name);
    });
  });

  /**
   * HTML binding.
   */

  reactive.bind('data-html', function(el, name){
    this.change(function(){
      el.innerHTML = this.formatted(name);
    });
  });

  /**
   * Generate event bindings.
   */

  events.forEach(function(name){
    reactive.bind('on-' + name, function(el, method){
      var self = this;
      var view = self.reactive.view;
      event.bind(el, name, function(e){
        e.preventDefault();

        var fn = view[method];
        if (!fn && view.parentView) {
          view = view.parentView;
          fn = view[method];
        }

        if (!fn) throw new Error('method .' + method + '() missing');
        fn.call(view, e, self.reactive);
      });
    });
  });
};
