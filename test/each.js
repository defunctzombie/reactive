var Emitter = require('emitter');
var domify = require('domify');
var assert = require('assert');

var reactive = require('../');

describe('each', function(){
  it('empty should not fail', function(){
    var el = domify('<ul><li each="todos">{this}</li></ul>');
    var view = reactive(el);
    assert.equal(el.children.length, 0);
  })

  it('predefined array should work', function(){
    var el = domify('<ul><li each="todos">{this}</li></ul>');

    var model = {
      todos: ['milk', 'cereal', 'apples']
    };

    var view = reactive(el, model);

    assert.equal(el.children.length, 3);
    assert.equal(el.children[0].textContent, 'milk');
    assert.equal(el.children[1].textContent, 'cereal');
    assert.equal(el.children[2].textContent, 'apples');
  })

  it('accessing properties', function(){
    var el = domify('<ul><li each="todos">{name}</li></ul>');

    var model = {
      todos: [
        { name: 'milk' },
        { name: 'cereal' },
        { name: 'apples' }
      ]
    };

    var view = reactive(el, model);

    assert.equal(el.children.length, 3);
    assert.equal(el.children[0].textContent, 'milk');
    assert.equal(el.children[1].textContent, 'cereal');
    assert.equal(el.children[2].textContent, 'apples');
  })

  it('Array#push', function(){
    var el = domify('<ul><li each="todos">{this}</li></ul>');

    var model = {
      todos: []
    };

    var view = reactive(el, model);

    assert.equal(el.children.length, 0);

    model.todos.push('milk');
    assert.equal(el.children[0].textContent, 'milk');

    model.todos.push('cereal');
    assert.equal(el.children[1].textContent, 'cereal');
  })

  it('Array#unshift', function(){
    var el = domify('<ul><li each="todos">{this}</li></ul>');

    var model = {
      todos: []
    };

    var view = reactive(el, model);

    assert.equal(el.children.length, 0);

    model.todos.unshift('milk');
    assert.equal(el.children[0].textContent, 'milk');

    model.todos.unshift('cereal');
    assert.equal(el.children[0].textContent, 'cereal');

    model.todos.push('apples');
    assert.equal(el.children[2].textContent, 'apples');
  })

  it('Array#splice', function(){
    var el = domify('<ul><li each="todos">{this}</li></ul>');

    var model = {
      todos: []
    };

    var view = reactive(el, model);

    assert.equal(el.children.length, 0);

    // splice in two new items
    model.todos.splice(0, 0, 'milk', 'eggs');
    assert.equal(el.children.length, 2);
    assert.equal(el.children[0].textContent, 'milk');
    assert.equal(el.children[1].textContent, 'eggs');
    assert.deepEqual(model.todos, ['milk', 'eggs']);

    // replace milk with apples
    model.todos.splice(0, 1, 'apples');
    assert.equal(el.children.length, 2);
    assert.equal(el.children[0].textContent, 'apples');
    assert.equal(el.children[1].textContent, 'eggs');
    assert.deepEqual(model.todos, ['apples', 'eggs']);

    // splice milk back in to start
    model.todos.splice(0, 0, 'milk');
    assert.equal(el.children.length, 3);
    assert.equal(el.children[0].textContent, 'milk');
    assert.equal(el.children[1].textContent, 'apples');
    assert.equal(el.children[2].textContent, 'eggs');
    assert.deepEqual(model.todos, ['milk', 'apples', 'eggs']);
  })

  // test that items are put into the proper place in the dom
  it('multiple arrays', function(){
    var el = domify('<ul><li each="todos">{this}</li><li each="tonots">{this}</li></ul>');

    var model = {
      todos: [],
      tonots: []
    };

    var view = reactive(el, model);

    assert.equal(el.children.length, 0);

    model.tonots.push('milk');
    assert.equal(el.children[0].textContent, 'milk');

    model.todos.push('apples');
    assert.equal(el.children[0].textContent, 'apples');
    assert.equal(el.children[1].textContent, 'milk');

    model.tonots.push('cereal');
    assert.equal(el.children[2].textContent, 'cereal');
  })

})
