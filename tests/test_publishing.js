'use strict';


var expect = require('chai').expect;
var parse = require('../lib/parsing.js').parse;
var publish = require('../lib/publishing.js').publish;


describe('publish', function() {
  it('Build a primitive type name', function() {
    var node = parse('boolean');
    expect(publish(node)).to.equal('boolean');
  });


  it('Build a global type name', function() {
    var node = parse('Window');
    expect(publish(node)).to.equal('Window');
  });


  it('Build an user-defined type name', function() {
    var node = parse('goog.ui.Menu');
    expect(publish(node)).to.equal('goog.ui.Menu');
  });


  it('Build a generic type has a parameter', function() {
    var node = parse('Array.<string>');
    expect(publish(node)).to.equal('Array<string>');
  });


  it('Build a generic type has 2 parameters', function() {
    var node = parse('Object.<string, number>');
    expect(publish(node)).to.equal('Object<string, number>');
  });


  it('Build a JsDoc-formal generic type', function() {
    var node = parse('String[]');
    expect(publish(node)).to.equal('Array<String>');
  });


  it('Build a formal type union', function() {
    var node = parse('(number|boolean)');
    expect(publish(node)).to.equal('(number|boolean)');
  });


  it('Build a informal type union', function() {
    var node = parse('number|boolean');
    expect(publish(node)).to.equal('(number|boolean)');
  });


  it('Build a record type with an entry', function() {
    var node = parse('{myNum}');
    expect(publish(node)).to.equal('{myNum}');
  });


  it('Build a record type with 2 entries', function() {
    var node = parse('{myNum: number, myObject}');
    expect(publish(node)).to.equal('{myNum: number, myObject}');
  });


  it('Build a generic type has a parameter as a record type', function() {
    var node = parse('Array<{length}>');
    expect(publish(node)).to.equal('Array<{length}>');
  });


  it('Build a nullable type has a nullable type operator on the head', function() {
    var node = parse('?number');
    expect(publish(node)).to.equal('?number');
  });


  it('Build a nullable type has a nullable type operator on the tail', function() {
    var node = parse('goog.ui.Component?');
    expect(publish(node)).to.equal('?goog.ui.Component');
  });


  it('Build a non-nullable type has a nullable type operator on the head', function() {
    var node = parse('!Object');
    expect(publish(node)).to.equal('!Object');
  });


  it('Build a non-nullable type has a nullable type operator on the tail', function() {
    var node = parse('Object!');
    expect(publish(node)).to.equal('!Object');
  });


  it('Build a function type', function() {
    var node = parse('Function');
    expect(publish(node)).to.equal('Function');
  });


  it('Build a function type has no parameters', function() {
    var node = parse('function()');
    expect(publish(node)).to.equal('function()');
  });


  it('Build a function type has a parameter', function() {
    var node = parse('function(string)');
    expect(publish(node)).to.equal('function(string)');
  });


  it('Build a function type has 2 parameters', function() {
    var node = parse('function(string, boolean)');
    expect(publish(node)).to.equal('function(string, boolean)');
  });


  it('Build a function type has a return', function() {
    var node = parse('function(): number');
    expect(publish(node)).to.equal('function(): number');
  });


  it('Build a function type has a context', function() {
    var node = parse('function(this:goog.ui.Menu, string)');
    expect(publish(node)).to.equal('function(this: goog.ui.Menu, string)');
  });


  it('Build a constructor type', function() {
    var node = parse('function(new:goog.ui.Menu, string)');
    expect(publish(node)).to.equal('function(new: goog.ui.Menu, string)');
  });


  it('Build a function type has a variable parameter', function() {
    var node = parse('function(string, ...number): number');
    expect(publish(node)).to.equal('function(string, ...number): number');
  });


  it('Build a function type has parameters have some type operators', function() {
    var node = parse('function(?string=, number=)');
    expect(publish(node)).to.equal('function(?string=, number=)');
  });


  it('Build a goog.ui.Component#forEachChild', function() {
    var node = parse('function(this:T,?,number):?');
    expect(publish(node)).to.equal('function(this: T, ?, number): ?');
  });


  it('Build a variable type', function() {
    var node = parse('...number');
    expect(publish(node)).to.equal('...number');
  });


  it('Build an optional type has an optional type operator on the head', function() {
    var node = parse('=number');
    expect(publish(node)).to.equal('number=');
  });


  it('Build an optional type has an optional type operator on the tail', function() {
    var node = parse('number=');
    expect(publish(node)).to.equal('number=');
  });


  it('Build an all type', function() {
    var node = parse('*');
    expect(publish(node)).to.equal('*');
  });


  it('Build an unknown type', function() {
    var node = parse('?');
    expect(publish(node)).to.equal('?');
  });


  it('Build an undefined type with an "undefined" keyword', function() {
    var node = parse('undefined');
    expect(publish(node)).to.equal('undefined');
  });


  it('Build a null type with an "null" keyword', function() {
    var node = parse('null');
    expect(publish(node)).to.equal('null');
  });


  it('Build a module type', function() {
    var node = parse('module:foo/bar');
    expect(publish(node)).to.equal('module:foo/bar');
  });


  it('Build a module type with a prefix nullable type operator', function() {
    var node = parse('?module:foo/bar');
    expect(publish(node)).to.equal('?module:foo/bar');
  });


  it('Build a module type with a postfix nullable type operator', function() {
    var node = parse('module:foo/bar?');
    expect(publish(node)).to.equal('?module:foo/bar');
  });


  it('Build a string value type', function() {
    var node = parse('"stringValue"');
    expect(publish(node)).to.equal('"stringValue"');
  });


  it('Build a number value type', function() {
    var node = parse('0123456789');
    expect(publish(node)).to.equal('0123456789');
  });


  it('Build a bin number value type', function() {
    var node = parse('0b01');
    expect(publish(node)).to.equal('0b01');
  });


  it('Build an oct number value type', function() {
    var node = parse('0o01234567');
    expect(publish(node)).to.equal('0o01234567');
  });


  it('Build a hex number value type', function() {
    var node = parse('0x0123456789abcdef');
    expect(publish(node)).to.equal('0x0123456789abcdef');
  });


  it('Build a module type with a generic type operator', function() {
    // Because the new generic type syntax was arrived, the old type generic
    // with the module keyword is not equivalent to the legacy behavior.
    //
    // For example, we get 2 parts as 'module:foo/bar.' and '<string>', when
    // the following type expression are arrived.
    //   var node = parse('module:foo/bar.<string>');
    var node = parse('module:foo/bar<string>');
    expect(publish(node)).to.equal('module:foo/bar<string>');
  });
});
