'use strict';

const {SyntaxError, parse} = require('../peg_lib/jsdoctype.js');

module.exports = {

  /** * A class for JSDoc type expression syntax errors.
   * @constructor
   * @extends {Error}
   */
  SyntaxError,


  /**
   * Parse the specified type expression string.
   * @param {string} typeExprStr Type expression string.
   * @return {Object} AST.
   */
  parse,
};
