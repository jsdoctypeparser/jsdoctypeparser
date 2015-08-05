'use strict';


var lodash = require('lodash');
var util = require('util');


function publish(node, opt_publisher) {
  var publisher = opt_publisher || createDefaultPublisher();
  return publisher[node.type](node, function(childNode) {
    return publish(childNode, publisher);
  });
}


function createDefaultPublisher() {
  return {
    NAME: function(nameNode) {
      return nameNode.name;
    },
    MEMBER: function(memberNode, concretePublish) {
      return util.format('%s.%s', concretePublish(memberNode.owner),
                         memberNode.name);
    },
    UNION: function(unionNode, concretePublish) {
      return util.format('(%s|%s)', concretePublish(unionNode.left),
                         concretePublish(unionNode.right));
    },
    VARIADIC: function(variadicNode, concretePublish) {
      return util.format('...%s', concretePublish(variadicNode.value));
    },
    RECORD: function(recordNode, concretePublish) {
      var concretePublishedEntries = lodash.map(recordNode.entries, concretePublish);
      return util.format('{%s}', concretePublishedEntries.join(', '));
    },
    RECORD_ENTRY: function(entryNode, concretePublish) {
      if (!entryNode.value) return entryNode.key;
      return util.format('%s: %s', entryNode.key, concretePublish(entryNode.value));
    },
    GENERIC: function(genericNode, concretePublish) {
      var concretePublishedObjects = lodash.map(genericNode.objects, concretePublish);
      return util.format('%s<%s>', concretePublish(genericNode.subject),
                         concretePublishedObjects.join(', '));
    },
    MODULE: function(moduleNode) {
      return util.format('module:%s', moduleNode.path);
    },
    OPTIONAL: function(optionalNode, concretePublish) {
      return util.format('%s=', concretePublish(optionalNode.value));
    },
    NULLABLE: function(nullableNode, concretePublish) {
      return util.format('?%s', concretePublish(nullableNode.value));
    },
    NOT_NULLABLE: function(notNullableNode, concretePublish) {
      return util.format('!%s', concretePublish(notNullableNode.value));
    },
    FUNCTION: function(functionNode, concretePublish) {
      var publidshedParams = lodash.map(functionNode.params, concretePublish);

      if (functionNode.newValue) {
        publidshedParams.unshift(util.format('new: %s',
          concretePublish(functionNode.newValue)));
      }

      if (functionNode.thisValue) {
        publidshedParams.unshift(util.format('this: %s',
          concretePublish(functionNode.thisValue)));
      }

      if (functionNode.returns) {
        return util.format('function(%s): %s', publidshedParams.join(', '),
                           concretePublish(functionNode.returns));
      }

      return util.format('function(%s)', publidshedParams.join(', '));
    },
    ANY: function() {
      return '*';
    },
    UNKNOWN: function() {
      return '?';
    },
    INNER_MEMBER: function(memberNode, concretePublish) {
      return concretePublish(memberNode.owner) + '~' + memberNode.name;
    },
    INSTANCE_MEMBER: function(memberNode, concretePublish) {
      return concretePublish(memberNode.owner) + '#' + memberNode.name;
    },
  };
}


module.exports = {
  publish: publish,
  createDefaultPublisher: createDefaultPublisher,
};
