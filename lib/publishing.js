'use strict';


var lodash = require('lodash');
var format = require('util').format;


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
      return format('%s.%s', concretePublish(memberNode.owner),
                         memberNode.name);
    },
    UNION: function(unionNode, concretePublish) {
      return format('(%s|%s)', concretePublish(unionNode.left),
                         concretePublish(unionNode.right));
    },
    VARIADIC: function(variadicNode, concretePublish) {
      return format('...%s', concretePublish(variadicNode.value));
    },
    RECORD: function(recordNode, concretePublish) {
      var concretePublishedEntries = lodash.map(recordNode.entries, concretePublish);
      return format('{%s}', concretePublishedEntries.join(', '));
    },
    RECORD_ENTRY: function(entryNode, concretePublish) {
      if (!entryNode.value) return entryNode.key;
      return format('%s: %s', entryNode.key, concretePublish(entryNode.value));
    },
    GENERIC: function(genericNode, concretePublish) {
      var concretePublishedObjects = lodash.map(genericNode.objects, concretePublish);
      return format('%s<%s>', concretePublish(genericNode.subject),
                         concretePublishedObjects.join(', '));
    },
    MODULE: function(moduleNode) {
      return format('module:%s', moduleNode.path);
    },
    OPTIONAL: function(optionalNode, concretePublish) {
      return format('%s=', concretePublish(optionalNode.value));
    },
    NULLABLE: function(nullableNode, concretePublish) {
      return format('?%s', concretePublish(nullableNode.value));
    },
    NOT_NULLABLE: function(notNullableNode, concretePublish) {
      return format('!%s', concretePublish(notNullableNode.value));
    },
    FUNCTION: function(functionNode, concretePublish) {
      var publidshedParams = lodash.map(functionNode.params, concretePublish);

      if (functionNode.new) {
        publidshedParams.unshift(format('new: %s',
          concretePublish(functionNode.new)));
      }

      if (functionNode.this) {
        publidshedParams.unshift(format('this: %s',
          concretePublish(functionNode.this)));
      }

      if (functionNode.returns) {
        return format('function(%s): %s', publidshedParams.join(', '),
                           concretePublish(functionNode.returns));
      }

      return format('function(%s)', publidshedParams.join(', '));
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
    STRING_VALUE: function(stringValueNode) {
      return format('"%s"', stringValueNode.string);
    },
    NUMBER_VALUE: function(numberValueNode) {
      return numberValueNode.number;
    },
    EXTERNAL: function(externalNode, concretePublish) {
      return format('external:%s', concretePublish(externalNode.value));
    },
  };
}


module.exports = {
  publish: publish,
  createDefaultPublisher: createDefaultPublisher,
};
