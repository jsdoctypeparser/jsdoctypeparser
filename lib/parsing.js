'use strict';

/**
 * @typedef AstNode
 * @property {string} type
 * @property {'none'|'single'|'double'} [quoteStyle]
 * @property {string} [key]
 * @property {string} [name]
 * @property {string} [number]
 * @property {string} [path]
 * @property {string} [string]
 * @property {boolean} [hasEventPrefix]
 * @property {boolean} [typeName]
 * @property {Object<string,any>} [meta]
 * @property {AstNode} [returns]
 * @property {AstNode} [new]
 * @property {AstNode} [value]
 * @property {AstNode} [left]
 * @property {AstNode} [right]
 * @property {AstNode} [owner]
 * @property {AstNode} [subject]
 * @property {AstNode} [this]
 * @property {AstNode[]} [entries]
 * @property {AstNode[]} [objects]
 * @property {AstNode[]} [params]
 */

const {
  parse, SyntaxError: JSDocTypeSyntaxError,
} = require('../peg_lib/jsdoctype-permissive.js');

const {
  parse: parseJsdoc, SyntaxError: JSDocSyntaxError,
} = require('../peg_lib/jsdoctype-jsdoc.js');
const {
  parse: parseClosure, SyntaxError: ClosureSyntaxError,
} = require('../peg_lib/jsdoctype-closure.js');
const {
  parse: parseTypeScript, SyntaxError: TypeScriptSyntaxError,
} = require('../peg_lib/jsdoctype-typescript.js');

module.exports = {

  /**
   * A class for JSDoc-like type expression syntax errors.
   * @constructor
   * @extends {Error}
   */
  JSDocTypeSyntaxError,

  /**
   * A class for JSDoc-specific type expression syntax errors.
   * @constructor
   * @extends {Error}
   */
  JSDocSyntaxError,

  /**
   * A class for Closure type expression syntax errors.
   * @constructor
   * @extends {Error}
   */
  ClosureSyntaxError,

  /**
   * A class for TypeScript type expression syntax errors.
   * @constructor
   * @extends {Error}
   */
  TypeScriptSyntaxError,

  /**
   * @typedef {object} ParseOptions
   * @property {"permissive"|"jsdoc"|"closure"|"typescript"} [mode='permissive']
   */

  /**
   * Parse the specified type expression string.
   * @param {string} typeExprStr Type expression string.
   * @param {ParseOptions} opts
   * @return {AstNode} AST.
   */
  parse (typeExprStr, {mode = 'permissive'} = {}) {
    switch (mode) {
      case 'jsdoc':
        return parseJsdoc(typeExprStr);
      case 'closure':
        return parseClosure(typeExprStr);
      case 'typescript':
        return parseTypeScript(typeExprStr);
      case 'permissive':
        return parse(typeExprStr);
      default:
        throw new TypeError('Unrecognized mode: "' + mode + '"');
    }
  },
};
