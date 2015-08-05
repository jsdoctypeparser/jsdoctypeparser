'use strict';


var lodash = require('lodash');


/**
 * Traverse the specified AST.
 * @param {{ type: NodeType }} node AST to traverse.
 * @param {function({ type: NodeType })?} opt_onEnter Callback for onEnter.
 * @param {function({ type: NodeType })?} opt_onLeave Callback for onLeave.
 */
function traverse(node, opt_onEnter, opt_onLeave) {
  if (opt_onEnter) opt_onEnter(node);

  var childNodes = _collectChildNodes(node);
  lodash.forEach(childNodes, function(childNode) {
    traverse(childNode, opt_onEnter, opt_onLeave);
  });

  if (opt_onLeave) opt_onLeave(node);
}


/**
 * @enum {number}
 * @private
 */
var _PropertyAccessor = {
  NODE: function(fn, node) {
    fn(node);
  },
  NODE_LIST: function(fn, nodes) {
    lodash.forEach(nodes, function(node) {
      fn(node);
    });
  },
  NULLABLE_NODE: function(fn, opt_node) {
    if (opt_node) fn(opt_node);
  },
};


/** @private */
var _childNodesMap = {
  NAME: {},
  MEMBER: {
    owner: _PropertyAccessor.NODE,
  },
  UNION: {
    left: _PropertyAccessor.NODE,
    right: _PropertyAccessor.NODE,
  },
  VARIADIC: {
    value: _PropertyAccessor.NODE,
  },
  RECORD: {
    entries: _PropertyAccessor.NODE_LIST,
  },
  RECORD_ENTRY: {
    value: _PropertyAccessor.NULLABLE_NODE,
  },
  GENERIC: {
    subject: _PropertyAccessor.NODE,
    objects: _PropertyAccessor.NODE_LIST,
  },
  MODULE: {},
  OPTIONAL: {
    value: _PropertyAccessor.NODE,
  },
  NULLABLE: {
    value: _PropertyAccessor.NODE,
  },
  NOT_NULLABLE: {
    value: _PropertyAccessor.NODE,
  },
  FUNCTION: {
    params: _PropertyAccessor.NODE_LIST,
    returns: _PropertyAccessor.NULLABLE_NODE,
    thisValue: _PropertyAccessor.NULLABLE_NODE,
    newValue: _PropertyAccessor.NULLABLE_NODE,
  },
  ANY: {},
  UNKNOWN: {},
  INNER_MEMBER: {
    owner: _PropertyAccessor.NODE,
  },
  INSTANCE_MEMBER: {
    owner: _PropertyAccessor.NODE,
  },
};


/** @private */
function _collectChildNodes(node) {
  var childNodes = [];
  var propAccessorMap = _childNodesMap[node.type];

  lodash.forEach(propAccessorMap, function(propAccessor, propName) {
    propAccessor(childNodes.push.bind(childNodes), node[propName]);
  });

  return childNodes;
}


module.exports = {
  traverse: traverse,
};
