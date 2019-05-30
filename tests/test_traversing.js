'use strict';

const {expect} = require('chai');
const NodeType = require('../lib/NodeType.js');
const {traverse} = require('../lib/traversing.js');

describe('traversing', function() {
  const testCases = {
    'should visit a name node': {
      given: createNameNode('name'),
      then: [
        ['enter', NodeType.NAME, undefined, undefined],
        ['leave', NodeType.NAME, undefined, undefined],
      ],
    },

    'should visit a member node': {
      given: createMemberNode('child', createNameNode('owner')),
      then: [
        ['enter', NodeType.MEMBER, undefined, undefined],
        ['enter', NodeType.NAME, 'owner', NodeType.MEMBER],
        ['leave', NodeType.NAME, 'owner', NodeType.MEMBER],
        ['leave', NodeType.MEMBER, undefined, undefined],
      ],
    },

    'should visit a nested member node': {
      given: createMemberNode('superchild', createMemberNode('child', createNameNode('owner'))),
      then: [
        ['enter', NodeType.MEMBER, undefined, undefined],
        ['enter', NodeType.MEMBER, 'owner', NodeType.MEMBER],
        ['enter', NodeType.NAME, 'owner', NodeType.MEMBER],
        ['leave', NodeType.NAME, 'owner', NodeType.MEMBER],
        ['leave', NodeType.MEMBER, 'owner', NodeType.MEMBER],
        ['leave', NodeType.MEMBER, undefined, undefined],
      ],
    },

    'should visit an union node': {
      given: createUnionNode(createNameNode('left'), createNameNode('right')),
      then: [
        ['enter', NodeType.UNION, undefined, undefined],
        ['enter', NodeType.NAME, 'left', NodeType.UNION],
        ['leave', NodeType.NAME, 'left', NodeType.UNION],
        ['enter', NodeType.NAME, 'right', NodeType.UNION],
        ['leave', NodeType.NAME, 'right', NodeType.UNION],
        ['leave', NodeType.UNION, undefined, undefined],
      ],
    },

    'should visit a type query node': {
      given: createTypeQueryNode(createNameNode('t')),
      then: [
        ['enter', NodeType.TYPE_QUERY, undefined, undefined],
        ['enter', NodeType.NAME, 'name', NodeType.TYPE_QUERY],
        ['leave', NodeType.NAME, 'name', NodeType.TYPE_QUERY],
        ['leave', NodeType.TYPE_QUERY, undefined, undefined],
      ],
    },

    'should visit an import type node': {
      given: createImportNode(createStringLiteral('jquery')),
      then: [
        ['enter', NodeType.IMPORT, undefined, undefined],
        ['enter', NodeType.STRING_VALUE, 'path', NodeType.IMPORT],
        ['leave', NodeType.STRING_VALUE, 'path', NodeType.IMPORT],
        ['leave', NodeType.IMPORT, undefined, undefined],
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
      then: [
        ['enter', NodeType.UNION, undefined, undefined],
        ['enter', NodeType.UNION, 'left', NodeType.UNION],
        ['enter', NodeType.NAME, 'left', NodeType.UNION],
        ['leave', NodeType.NAME, 'left', NodeType.UNION],
        ['enter', NodeType.NAME, 'right', NodeType.UNION],
        ['leave', NodeType.NAME, 'right', NodeType.UNION],
        ['leave', NodeType.UNION, 'left', NodeType.UNION],
        ['enter', NodeType.NAME, 'right', NodeType.UNION],
        ['leave', NodeType.NAME, 'right', NodeType.UNION],
        ['leave', NodeType.UNION, undefined, undefined],
      ],
    },

    'should visit a variadic node': {
      given: { type: NodeType.VARIADIC, value: createNameNode('variadic') },
      then: [
        ['enter', NodeType.VARIADIC, undefined, undefined],
        ['enter', NodeType.NAME, 'value', NodeType.VARIADIC],
        ['leave', NodeType.NAME, 'value', NodeType.VARIADIC],
        ['leave', NodeType.VARIADIC, undefined, undefined],
      ],
    },

    'should visit a record node that is empty': {
      given: {
        type: NodeType.RECORD,
        entries: [],
      },
      then: [
        ['enter', NodeType.RECORD, undefined, undefined],
        ['leave', NodeType.RECORD, undefined, undefined],
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
      then: [
        ['enter', NodeType.RECORD, undefined, undefined],
        ['enter', NodeType.RECORD_ENTRY, 'entries', NodeType.RECORD],
        ['enter', NodeType.NAME, 'value', NodeType.RECORD_ENTRY],
        ['leave', NodeType.NAME, 'value', NodeType.RECORD_ENTRY],
        ['leave', NodeType.RECORD_ENTRY, 'entries', NodeType.RECORD],
        ['enter', NodeType.RECORD_ENTRY, 'entries', NodeType.RECORD],
        ['enter', NodeType.NAME, 'value', NodeType.RECORD_ENTRY],
        ['leave', NodeType.NAME, 'value', NodeType.RECORD_ENTRY],
        ['leave', NodeType.RECORD_ENTRY, 'entries', NodeType.RECORD],
        ['leave', NodeType.RECORD, undefined, undefined],
      ],
    },

    'should visit a generic node that is empty': {
      given: {
        type: NodeType.GENERIC,
        subject: createNameNode('subject'),
        objects: [],
      },
      then: [
        ['enter', NodeType.GENERIC, undefined, undefined],
        ['enter', NodeType.NAME, 'subject', NodeType.GENERIC],
        ['leave', NodeType.NAME, 'subject', NodeType.GENERIC],
        ['leave', NodeType.GENERIC, undefined, undefined],
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
      then: [
        ['enter', NodeType.GENERIC, undefined, undefined],
        ['enter', NodeType.NAME, 'subject', NodeType.GENERIC],
        ['leave', NodeType.NAME, 'subject', NodeType.GENERIC],
        ['enter', NodeType.NAME, 'objects', NodeType.GENERIC],
        ['leave', NodeType.NAME, 'objects', NodeType.GENERIC],
        ['enter', NodeType.NAME, 'objects', NodeType.GENERIC],
        ['leave', NodeType.NAME, 'objects', NodeType.GENERIC],
        ['leave', NodeType.GENERIC, undefined, undefined],
      ],
    },

    'should visit a module node': {
      given: {
        type: NodeType.MODULE,
        value: createFilePathNode('module'),
      },
      then: [
        ['enter', NodeType.MODULE, undefined, undefined],
        ['enter', NodeType.FILE_PATH, 'value', NodeType.MODULE],
        ['leave', NodeType.FILE_PATH, 'value', NodeType.MODULE],
        ['leave', NodeType.MODULE, undefined, undefined],
      ],
    },

    'should visit an optional node': {
      given: {
        type: NodeType.OPTIONAL,
        value: createNameNode('optional'),
      },
      then: [
        ['enter', NodeType.OPTIONAL, undefined, undefined],
        ['enter', NodeType.NAME, 'value', NodeType.OPTIONAL],
        ['leave', NodeType.NAME, 'value', NodeType.OPTIONAL],
        ['leave', NodeType.OPTIONAL, undefined, undefined],
      ],
    },

    'should visit a nullable node': {
      given: {
        type: NodeType.NULLABLE,
        value: createNameNode('nullable'),
      },
      then: [
        ['enter', NodeType.NULLABLE, undefined, undefined],
        ['enter', NodeType.NAME, 'value', NodeType.NULLABLE],
        ['leave', NodeType.NAME, 'value', NodeType.NULLABLE],
        ['leave', NodeType.NULLABLE, undefined, undefined],
      ],
    },

    'should visit a non-nullable node': {
      given: {
        type: NodeType.NOT_NULLABLE,
        value: createNameNode('not_nullable'),
      },
      then: [
        ['enter', NodeType.NOT_NULLABLE, undefined, undefined],
        ['enter', NodeType.NAME, 'value', NodeType.NOT_NULLABLE],
        ['leave', NodeType.NAME, 'value', NodeType.NOT_NULLABLE],
        ['leave', NodeType.NOT_NULLABLE, undefined, undefined],
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
      then: [
        ['enter', NodeType.FUNCTION, undefined, undefined],
        ['leave', NodeType.FUNCTION, undefined, undefined],
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
      then: [
        ['enter', NodeType.FUNCTION, undefined, undefined],
        ['enter', NodeType.NAME, 'params', NodeType.FUNCTION],
        ['leave', NodeType.NAME, 'params', NodeType.FUNCTION],
        ['enter', NodeType.NAME, 'params', NodeType.FUNCTION],
        ['leave', NodeType.NAME, 'params', NodeType.FUNCTION],
        ['enter', NodeType.NAME, 'returns', NodeType.FUNCTION],
        ['leave', NodeType.NAME, 'returns', NodeType.FUNCTION],
        ['enter', NodeType.NAME, 'this', NodeType.FUNCTION],
        ['leave', NodeType.NAME, 'this', NodeType.FUNCTION],
        ['enter', NodeType.NAME, 'new', NodeType.FUNCTION],
        ['leave', NodeType.NAME, 'new', NodeType.FUNCTION],
        ['leave', NodeType.FUNCTION, undefined, undefined],
      ],
    },

    'should visit an arrow function that has two params and a returns': {
      given: {
        type: NodeType.ARROW,
        params: [
          { type: NodeType.NAMED_PARAMETER, name: 'param1', typeName: createNameNode('type1') },
          { type: NodeType.NAMED_PARAMETER, name: 'param2', typeName: createNameNode('type2') },
        ],
        returns: createNameNode('return'),
      },
      then: [
        ['enter', NodeType.ARROW, undefined, undefined],
        ['enter', NodeType.NAMED_PARAMETER, 'params', NodeType.ARROW],
        ['enter', NodeType.NAME, 'typeName', NodeType.NAMED_PARAMETER],
        ['leave', NodeType.NAME, 'typeName', NodeType.NAMED_PARAMETER],
        ['leave', NodeType.NAMED_PARAMETER, 'params', NodeType.ARROW],
        ['enter', NodeType.NAMED_PARAMETER, 'params', NodeType.ARROW],
        ['enter', NodeType.NAME, 'typeName', NodeType.NAMED_PARAMETER],
        ['leave', NodeType.NAME, 'typeName', NodeType.NAMED_PARAMETER],
        ['leave', NodeType.NAMED_PARAMETER, 'params', NodeType.ARROW],
        ['enter', NodeType.NAME, 'returns', NodeType.ARROW],
        ['leave', NodeType.NAME, 'returns', NodeType.ARROW],
        ['leave', NodeType.ARROW, undefined, undefined],
      ],
    },

    'should visit an arrow function that has one variadic param and a returns': {
      given: {
        type: NodeType.ARROW,
        params: [
          {
            type: NodeType.VARIADIC,
            value: {
              type: NodeType.NAMED_PARAMETER,
              name: 'param1',
              typeName: createNameNode('type1'),
            },
          },
        ],
        returns: createNameNode('return'),
      },
      then: [
        ['enter', NodeType.ARROW, undefined, undefined],
        ['enter', NodeType.VARIADIC, 'params', NodeType.ARROW],
        ['enter', NodeType.NAMED_PARAMETER, 'value', NodeType.VARIADIC],
        ['enter', NodeType.NAME, 'typeName', NodeType.NAMED_PARAMETER],
        ['leave', NodeType.NAME, 'typeName', NodeType.NAMED_PARAMETER],
        ['leave', NodeType.NAMED_PARAMETER, 'value', NodeType.VARIADIC],
        ['leave', NodeType.VARIADIC, 'params', NodeType.ARROW],
        ['enter', NodeType.NAME, 'returns', NodeType.ARROW],
        ['leave', NodeType.NAME, 'returns', NodeType.ARROW],
        ['leave', NodeType.ARROW, undefined, undefined],
      ],
    },

    'should visit an any node': {
      given: {
        type: NodeType.ANY,
      },
      then: [
        ['enter', NodeType.ANY, undefined, undefined],
        ['leave', NodeType.ANY, undefined, undefined],
      ],
    },

    'should visit an unknown node': {
      given: {
        type: NodeType.UNKNOWN,
      },
      then: [
        ['enter', NodeType.UNKNOWN, undefined, undefined],
        ['leave', NodeType.UNKNOWN, undefined, undefined],
      ],
    },

    'should visit an inner member node': {
      given: createInnerMemberNode('child', createNameNode('owner')),
      then: [
        ['enter', NodeType.INNER_MEMBER, undefined, undefined],
        ['enter', NodeType.NAME, 'owner', NodeType.INNER_MEMBER],
        ['leave', NodeType.NAME, 'owner', NodeType.INNER_MEMBER],
        ['leave', NodeType.INNER_MEMBER, undefined, undefined],
      ],
    },

    'should visit a nested inner member node': {
      given: createInnerMemberNode('superchild',
        createInnerMemberNode('child', createNameNode('owner'))),
      then: [
        ['enter', NodeType.INNER_MEMBER, undefined, undefined],
        ['enter', NodeType.INNER_MEMBER, 'owner', NodeType.INNER_MEMBER],
        ['enter', NodeType.NAME, 'owner', NodeType.INNER_MEMBER],
        ['leave', NodeType.NAME, 'owner', NodeType.INNER_MEMBER],
        ['leave', NodeType.INNER_MEMBER, 'owner', NodeType.INNER_MEMBER],
        ['leave', NodeType.INNER_MEMBER, undefined, undefined],
      ],
    },

    'should visit an instance member node': {
      given: createInstanceMemberNode('child', createNameNode('owner')),
      then: [
        ['enter', NodeType.INSTANCE_MEMBER, undefined, undefined],
        ['enter', NodeType.NAME, 'owner', NodeType.INSTANCE_MEMBER],
        ['leave', NodeType.NAME, 'owner', NodeType.INSTANCE_MEMBER],
        ['leave', NodeType.INSTANCE_MEMBER, undefined, undefined],
      ],
    },

    'should visit a nested instance member node': {
      given: createInstanceMemberNode('superchild',
        createInstanceMemberNode('child', createNameNode('owner'))),
      then: [
        ['enter', NodeType.INSTANCE_MEMBER, undefined, undefined],
        ['enter', NodeType.INSTANCE_MEMBER, 'owner', NodeType.INSTANCE_MEMBER],
        ['enter', NodeType.NAME, 'owner', NodeType.INSTANCE_MEMBER],
        ['leave', NodeType.NAME, 'owner', NodeType.INSTANCE_MEMBER],
        ['leave', NodeType.INSTANCE_MEMBER, 'owner', NodeType.INSTANCE_MEMBER],
        ['leave', NodeType.INSTANCE_MEMBER, undefined, undefined],
      ],
    },

    'should visit a string value node': {
      given: { type: NodeType.STRING_VALUE, value: 'stringValue' },
      then: [
        ['enter', NodeType.STRING_VALUE, undefined, undefined],
        ['leave', NodeType.STRING_VALUE, undefined, undefined],
      ],
    },

    'should visit a number value node': {
      given: { type: NodeType.NUMBER_VALUE, value: 'numberValue' },
      then: [
        ['enter', NodeType.NUMBER_VALUE, undefined, undefined],
        ['leave', NodeType.NUMBER_VALUE, undefined, undefined],
      ],
    },

    'should visit an external node': {
      given: { type: NodeType.EXTERNAL, value: createNameNode('external') },
      then: [
        ['enter', NodeType.EXTERNAL, undefined, undefined],
        ['enter', NodeType.NAME, 'value', NodeType.EXTERNAL],
        ['leave', NodeType.NAME, 'value', NodeType.EXTERNAL],
        ['leave', NodeType.EXTERNAL, undefined, undefined],
      ],
    },
  };

  Object.keys(testCases).forEach(function(testCaseName) {
    const testCaseInfo = testCases[testCaseName];

    it(testCaseName, function() {
      const visitedOrder = [];
      const onEnterSpy = createEventSpy('enter', visitedOrder);
      const onLeaveSpy = createEventSpy('leave', visitedOrder);

      traverse(testCaseInfo.given, onEnterSpy, onLeaveSpy);

      expect(visitedOrder).to.deep.equal(testCaseInfo.then);
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

function createTypeQueryNode(name) {
  return {
    type: NodeType.TYPE_QUERY,
    name: name,
  }
}

function createImportNode(path) {
  return {
    type: NodeType.IMPORT,
    path: path,
  }
}

function createStringLiteral(string) {
  return {
    type: NodeType.STRING_VALUE,
    string: string,
  }
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
  return function(node, propName, parentType) {
    result.push([eventName, node.type, propName, parentType]);
  };
}

function createFilePathNode(filePath) {
  return {
    type: NodeType.FILE_PATH,
    path: filePath,
  };
}

function create() {
}
