'use strict';

const {parse, SyntaxError} = require('./lib/parsing.js');
const {publish, createDefaultPublisher} = require('./lib/publishing.js');
const {traverse} = require('./lib/traversing.js');
const NodeType = require('./lib/NodeType.js');
const SyntaxType = require('./lib/SyntaxType.js');


/**
 * Namespace for jsdoctypeparser.
 * @namespace
 * @exports jsdoctypeparser
 */
module.exports = {
  parse,
  SyntaxError,
  publish,
  createDefaultPublisher,
  traverse,
  NodeType,
  SyntaxType,
};
