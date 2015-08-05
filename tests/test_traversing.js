'use strict';

var chai = require('chai');
var expect = chai.expect;
var NodeType = require('../lib/NodeType.js');
var traverse = require('../lib/traversing.js').traverse;
var lodash = require('lodash');


describe('traversing', function() {
  var testCases = {
    'should visit a name node': {
      given: createNameNode('name'),
      should: [
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
      ],
    },

    'should visit a member node': {
      given: createMemberNode('child', createNameNode('owner')),
      should: [
        ['enter', NodeType.MEMBER],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.MEMBER],
      ],
    },

    'should visit a nested member node': {
      given: createMemberNode('superchild', createMemberNode('child', createNameNode('owner'))),
      should: [
        ['enter', NodeType.MEMBER],
        ['enter', NodeType.MEMBER],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.MEMBER],
        ['leave', NodeType.MEMBER],
      ],
    },

    'should visit an union node': {
      given: createUnionNode(createNameNode('left'), createNameNode('right')),
      should: [
        ['enter', NodeType.UNION],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.UNION],
      ],
    },

    'should visit a nested union node': {
      given: createUnionNode(
        createUnionNode(
          createNameNode('left'),
          createNameNode('middle')
        ),
        createNameNode('right')
      ),
      should: [
        ['enter', NodeType.UNION],
        ['enter', NodeType.UNION],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.UNION],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.UNION],
      ],
    },

    'should visit a variadic node': {
      given: { type: NodeType.VARIADIC, value: createNameNode('variadic') },
      should: [
        ['enter', NodeType.VARIADIC],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.VARIADIC],
      ],
    },

    'should visit a record node that is empty': {
      given: {
        type: NodeType.RECORD,
        entries: [],
      },
      should: [
        ['enter', NodeType.RECORD],
        ['leave', NodeType.RECORD],
      ],
    },

    'should visit a record node that has multiple entries': {
      given: {
        type: NodeType.RECORD,
        entries: [
          createRecordEntry('key1', createNameNode('key1')),
          createRecordEntry('key2', createNameNode('key2')),
        ],
      },
      should: [
        ['enter', NodeType.RECORD],
        ['enter', NodeType.RECORD_ENTRY],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.RECORD_ENTRY],
        ['enter', NodeType.RECORD_ENTRY],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.RECORD_ENTRY],
        ['leave', NodeType.RECORD],
      ],
    },

    'should visit a generic node that is empty': {
      given: {
        type: NodeType.GENERIC,
        subject: createNameNode('subject'),
        objects: [],
      },
      should: [
        ['enter', NodeType.GENERIC],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.GENERIC],
      ],
    },

    'should visit a generic node that has multiple objects': {
      given: {
        type: NodeType.GENERIC,
        subject: createNameNode('subject'),
        objects: [
          createNameNode('object1'),
          createNameNode('object2'),
        ],
      },
      should: [
        ['enter', NodeType.GENERIC],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.GENERIC],
      ],
    },

    'should visit a module node': {
      given: {
        type: NodeType.MODULE,
        name: 'module',
      },
      should: [
        ['enter', NodeType.MODULE],
        ['leave', NodeType.MODULE],
      ],
    },

    'should visit an optional node': {
      given: {
        type: NodeType.OPTIONAL,
        value: createNameNode('optional'),
      },
      should: [
        ['enter', NodeType.OPTIONAL],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.OPTIONAL],
      ],
    },

    'should visit a nullable node': {
      given: {
        type: NodeType.NULLABLE,
        value: createNameNode('nullable'),
      },
      should: [
        ['enter', NodeType.NULLABLE],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.NULLABLE],
      ],
    },

    'should visit a non-nullable node': {
      given: {
        type: NodeType.NOT_NULLABLE,
        value: createNameNode('not_nullable'),
      },
      should: [
        ['enter', NodeType.NOT_NULLABLE],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.NOT_NULLABLE],
      ],
    },

    'should visit a function node that has no params and no returns': {
      given: {
        type: NodeType.FUNCTION,
        params: [],
        returns: null,
        this: null,
        new: null,
      },
      should: [
        ['enter', NodeType.FUNCTION],
        ['leave', NodeType.FUNCTION],
      ],
    },

    'should visit a function node that has few params and a returns and "this" and "new"': {
      given: {
        type: NodeType.FUNCTION,
        params: [
          createNameNode('param1'),
          createNameNode('param2'),
        ],
        returns: createNameNode('return'),
        this: createNameNode('this'),
        new: createNameNode('new'),
      },
      should: [
        ['enter', NodeType.FUNCTION],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.FUNCTION],
      ],
    },

    'should visit an any node': {
      given: {
        type: NodeType.ANY,
      },
      should: [
        ['enter', NodeType.ANY],
        ['leave', NodeType.ANY],
      ],
    },

    'should visit an unknown node': {
      given: {
        type: NodeType.UNKNOWN,
      },
      should: [
        ['enter', NodeType.UNKNOWN],
        ['leave', NodeType.UNKNOWN],
      ],
    },

    'should visit an inner member node': {
      given: createInnerMemberNode('child', createNameNode('owner')),
      should: [
        ['enter', NodeType.INNER_MEMBER],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.INNER_MEMBER],
      ],
    },

    'should visit a nested inner member node': {
      given: createInnerMemberNode('superchild',
        createInnerMemberNode('child', createNameNode('owner'))),
      should: [
        ['enter', NodeType.INNER_MEMBER],
        ['enter', NodeType.INNER_MEMBER],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.INNER_MEMBER],
        ['leave', NodeType.INNER_MEMBER],
      ],
    },

    'should visit an instance member node': {
      given: createInstanceMemberNode('child', createNameNode('owner')),
      should: [
        ['enter', NodeType.INSTANCE_MEMBER],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.INSTANCE_MEMBER],
      ],
    },

    'should visit a nested instance member node': {
      given: createInstanceMemberNode('superchild',
        createInstanceMemberNode('child', createNameNode('owner'))),
      should: [
        ['enter', NodeType.INSTANCE_MEMBER],
        ['enter', NodeType.INSTANCE_MEMBER],
        ['enter', NodeType.NAME],
        ['leave', NodeType.NAME],
        ['leave', NodeType.INSTANCE_MEMBER],
        ['leave', NodeType.INSTANCE_MEMBER],
      ],
    },
  };

  lodash.forEach(testCases, function(testCaseInfo, testCaseName) {
    it(testCaseName, function() {
      var visitedOrder = [];
      var onEnterSpy = createEventSpy('enter', visitedOrder);
      var onLeaveSpy = createEventSpy('leave', visitedOrder);

      traverse(testCaseInfo.given, onEnterSpy, onLeaveSpy);

      expect(visitedOrder).to.deep.equal(testCaseInfo.should);
    });
  });
});


function createNameNode(name) {
  return {
    type: NodeType.NAME,
    name: name,
  };
}

function createMemberNode(name, owner) {
  return {
    type: NodeType.MEMBER,
    owner: owner,
    name: name,
  };
}

function createUnionNode(left, right) {
  return {
    type: NodeType.UNION,
    left: left,
    right: right,
  };
}

function createRecordEntry(key, node) {
  return {
    type: NodeType.RECORD_ENTRY,
    key: key,
    value: node,
  };
}

function createInnerMemberNode(name, owner) {
  return {
    type: NodeType.INNER_MEMBER,
    owner: owner,
    name: name,
  };
}

function createInstanceMemberNode(name, owner) {
  return {
    type: NodeType.INSTANCE_MEMBER,
    owner: owner,
    name: name,
  };
}

function createEventSpy(eventName, result) {
  return function(node) {
    result.push([eventName, node.type]);
  };
}
