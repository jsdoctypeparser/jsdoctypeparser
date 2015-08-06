'use strict';

var chai = require('chai');
var expect = chai.expect;
var lodash = require('lodash');
var jsdoctypeparser = require('../index.js');


describe('jsdoctypeparser', function() {
  var expectedTypeMap = {
    parse: 'function',
    SyntaxError: 'function',
    publish: 'function',
    createDefaultPublisher: 'function',
    traverse: 'function',
    NodeType: 'object',
    SyntaxType: 'object',
  };


  lodash.forEach(expectedTypeMap, function(expectedType, key) {
    describe('.' + key, function() {
      it('should be exported', function() {
        expect(jsdoctypeparser[key]).to.be.a(expectedType);
      });
    });
  });
});
