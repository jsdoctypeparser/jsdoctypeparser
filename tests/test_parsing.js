'use strict';

const {expect, assert} = require('chai');

const NodeType = require('../lib/NodeType.js');
const Parser = require('../lib/parsing.js');
const SyntaxType = require('../lib/SyntaxType.js');

const {
  GenericTypeSyntax, UnionTypeSyntax, VariadicTypeSyntax,
  OptionalTypeSyntax, NullableTypeSyntax, NotNullableTypeSyntax,
} = SyntaxType;

describe('Parser', function() {
  it('should return a type name node when "TypeName" arrived', function() {
    const typeExprStr = 'TypeName';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTypeNameNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a type name node when "my-type" arrived', function() {
    const typeExprStr = 'my-type';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTypeNameNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a type name node when "$" arrived', function() {
    const typeExprStr = '$';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTypeNameNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a type name node when "_" arrived', function() {
    const typeExprStr = '_';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTypeNameNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an any type node when "*" arrived', function() {
    const typeExprStr = '*';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createAnyTypeNode();
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an unknown type node when "?" arrived', function() {
    const typeExprStr = '?';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createUnknownTypeNode();
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an optional unknown type node when "?=" arrived', function() {
    const typeExprStr = '?=';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createUnknownTypeNode(),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a module name node when "module:path/to/file" arrived', function() {
    const typeExprStr = 'module:path/to/file';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createModuleNameNode(createFilePathNode('path/to/file'));
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a module name node when "module : path/to/file" arrived', function() {
    const typeExprStr = 'module : path/to/file';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createModuleNameNode(createFilePathNode('path/to/file'));
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a member node when "(module:path/to/file).member" arrived', function() {
    const typeExprStr = '(module:path/to/file).member';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createMemberTypeNode(
      createParenthesizedNode(
        createModuleNameNode(createFilePathNode('path/to/file'))
      ),
      'member'
    );
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a member node when "module:path/to/file.member" arrived', function() {
    const typeExprStr = 'module:path/to/file.member';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createModuleNameNode(
      createMemberTypeNode(createFilePathNode('path/to/file'), 'member')
    );
    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a member node when "module:path/to/file.event:member" arrived', function() {
    const typeExprStr = 'module:path/to/file.event:member';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createModuleNameNode(
      createMemberTypeNode(createFilePathNode('path/to/file'), 'member', true)
    );
    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a member type node when "owner.event:Member" arrived', function() {
    const typeExprStr = 'owner.event:Member';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createMemberTypeNode(
      createTypeNameNode('owner'),
      'Member',
      true);

    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a module name node when "external:string" arrived', function() {
    const typeExprStr = 'external:string';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createExternalNameNode(createTypeNameNode('string'));
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a module name node when "external : String#rot13" arrived', function() {
    const typeExprStr = 'external : String#rot13';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createExternalNameNode(
      createInstanceMemberTypeNode(createTypeNameNode('String'), 'rot13'));
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a member type node when "owner.Member" arrived', function() {
    const typeExprStr = 'owner.Member';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createMemberTypeNode(
      createTypeNameNode('owner'),
      'Member');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a member type node when "owner . Member" arrived', function() {
    const typeExprStr = 'owner . Member';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createMemberTypeNode(
      createTypeNameNode('owner'),
      'Member');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a member type node when "superOwner.owner.Member" arrived', function() {
    const typeExprStr = 'superOwner.owner.Member';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createMemberTypeNode(
        createMemberTypeNode(
          createTypeNameNode('superOwner'), 'owner'),
        'Member');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a member type node when "superOwner.owner.Member=" arrived', function() {
    const typeExprStr = 'superOwner.owner.Member=';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createMemberTypeNode(
        createMemberTypeNode(
          createTypeNameNode('superOwner'),
        'owner'),
      'Member'),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an inner member type node when "owner~innerMember" arrived', function() {
    const typeExprStr = 'owner~innerMember';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createInnerMemberTypeNode(
      createTypeNameNode('owner'),
      'innerMember');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an inner member type node when "owner ~ innerMember" arrived', function() {
    const typeExprStr = 'owner ~ innerMember';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createInnerMemberTypeNode(
      createTypeNameNode('owner'),
      'innerMember');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an inner member type node when "superOwner~owner~innerMember" ' +
     'arrived', function() {
    const typeExprStr = 'superOwner~owner~innerMember';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createInnerMemberTypeNode(
        createInnerMemberTypeNode(
          createTypeNameNode('superOwner'), 'owner'),
        'innerMember');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an inner member type node when "superOwner~owner~innerMember=" ' +
     'arrived', function() {
    const typeExprStr = 'superOwner~owner~innerMember=';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createInnerMemberTypeNode(
        createInnerMemberTypeNode(
          createTypeNameNode('superOwner'),
        'owner'),
      'innerMember'),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an instance member type node when "owner#instanceMember" arrived', function() {
    const typeExprStr = 'owner#instanceMember';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createInstanceMemberTypeNode(
      createTypeNameNode('owner'),
      'instanceMember');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an instance member type node when "owner # instanceMember" ' +
     'arrived', function() {
    const typeExprStr = 'owner # instanceMember';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createInstanceMemberTypeNode(
      createTypeNameNode('owner'),
      'instanceMember');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an instance member type node when "superOwner#owner#instanceMember" ' +
     'arrived', function() {
    const typeExprStr = 'superOwner#owner#instanceMember';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createInstanceMemberTypeNode(
        createInstanceMemberTypeNode(
          createTypeNameNode('superOwner'), 'owner'),
        'instanceMember');

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an instance member type node when "superOwner#owner#instanceMember=" ' +
     'arrived', function() {
    const typeExprStr = 'superOwner#owner#instanceMember=';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createInstanceMemberTypeNode(
        createInstanceMemberTypeNode(
          createTypeNameNode('superOwner'),
        'owner'),
      'instanceMember'),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an union type when "LeftType|RightType" arrived', function() {
    const typeExprStr = 'LeftType|RightType';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createUnionTypeNode(
      createTypeNameNode('LeftType'),
      createTypeNameNode('RightType'),
      UnionTypeSyntax.PIPE
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an union type when "LeftType|MiddleType|RightType" arrived', function() {
    const typeExprStr = 'LeftType|MiddleType|RightType';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createUnionTypeNode(
      createTypeNameNode('LeftType'),
      createUnionTypeNode(
        createTypeNameNode('MiddleType'),
        createTypeNameNode('RightType'),
        UnionTypeSyntax.PIPE
      ), UnionTypeSyntax.PIPE);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an union type when "(LeftType|RightType)" arrived', function() {
    const typeExprStr = '(LeftType|RightType)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createParenthesizedNode(
      createUnionTypeNode(
        createTypeNameNode('LeftType'),
        createTypeNameNode('RightType')
      )
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an union type when "( LeftType | RightType )" arrived', function() {
    const typeExprStr = '( LeftType | RightType )';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createParenthesizedNode(
      createUnionTypeNode(
        createTypeNameNode('LeftType'),
        createTypeNameNode('RightType')
      )
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an union type when "LeftType/RightType" arrived', function() {
    const typeExprStr = 'LeftType/RightType';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createUnionTypeNode(
      createTypeNameNode('LeftType'),
      createTypeNameNode('RightType'),
      UnionTypeSyntax.SLASH
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a record type node when "{}" arrived', function() {
    const typeExprStr = '{}';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createRecordTypeNode([]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a record type node when "{key:ValueType}" arrived', function() {
    const typeExprStr = '{key:ValueType}';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createRecordTypeNode([
      createRecordEntryNode('key', createTypeNameNode('ValueType')),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a record type node when "{keyOnly}" arrived', function() {
    const typeExprStr = '{keyOnly}';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createRecordTypeNode([
      createRecordEntryNode('keyOnly', null),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a record type node when "{key1:ValueType1,key2:ValueType2}"' +
     ' arrived', function() {
    const typeExprStr = '{key1:ValueType1,key2:ValueType2}';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createRecordTypeNode([
      createRecordEntryNode('key1', createTypeNameNode('ValueType1')),
      createRecordEntryNode('key2', createTypeNameNode('ValueType2')),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a record type node when "{key:ValueType1,keyOnly}"' +
     ' arrived', function() {
    const typeExprStr = '{key:ValueType1,keyOnly}';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createRecordTypeNode([
      createRecordEntryNode('key', createTypeNameNode('ValueType1')),
      createRecordEntryNode('keyOnly', null),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a record type node when "{ key1 : ValueType1 , key2 : ValueType2 }"' +
     ' arrived', function() {
    const typeExprStr = '{ key1 : ValueType1 , key2 : ValueType2 }';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createRecordTypeNode([
      createRecordEntryNode('key1', createTypeNameNode('ValueType1')),
      createRecordEntryNode('key2', createTypeNameNode('ValueType2')),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a record type node when "{\'quoted-key\':ValueType}"' +
     ' arrived', function() {
    const typeExprStr = '{\'quoted-key\':ValueType}';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createRecordTypeNode([
      createRecordEntryNode('quoted-key', createTypeNameNode('ValueType')),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a tuple type node when "[]" arrived', function() {
    const typeExprStr = '[]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTupleTypeNode([]);

    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a tuple type node when "[TupleType]" arrived', function() {
    const typeExprStr = '[TupleType]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTupleTypeNode([
      createTypeNameNode('TupleType'),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a tuple type node when "[TupleType1, TupleType2]" arrived', function() {
    const typeExprStr = '[TupleType1, TupleType2]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTupleTypeNode([
      createTypeNameNode('TupleType1'),
      createTypeNameNode('TupleType2'),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a tuple type node when "[TupleConcreteType, ...TupleVarargsType]" arrived', function() {
    const typeExprStr = '[TupleConcreteType, ...TupleVarargsType]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTupleTypeNode([
      createTypeNameNode('TupleConcreteType'),
      createVariadicTypeNode(
        createTypeNameNode('TupleVarargsType'),
        VariadicTypeSyntax.PREFIX_DOTS
      ),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a tuple type node when "[TupleConcreteType, TupleBrokenVarargsType...]" arrived', function() {
    const typeExprStr = '[TupleConcreteType, TupleBrokenVarargsType...]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTupleTypeNode([
      createTypeNameNode('TupleConcreteType'),
      createVariadicTypeNode(
        // This is broken because the TypeScript JSDoc parser doesn't support
        // the suffix dots variadic type syntax:
        createTypeNameNode('TupleBrokenVarargsType'),
        VariadicTypeSyntax.SUFFIX_DOTS
      ),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a tuple type node when "[TupleAnyVarargs, ...]" arrived', function() {
    const typeExprStr = '[TupleAnyVarargs, ...]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTupleTypeNode([
      createTypeNameNode('TupleAnyVarargs'),
      createVariadicTypeNode(
        null,
        VariadicTypeSyntax.ONLY_DOTS
      ),
    ]);

    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a generic type node when "[][]" arrived', function() {
    const typeExprStr = '[][]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Array'),
      [
        createTupleTypeNode([]),
      ],
      GenericTypeSyntax.SQUARE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a generic type node when "[TupleType][]" arrived', function() {
    const typeExprStr = '[TupleType][]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Array'),
      [
        createTupleTypeNode([
          createTypeNameNode('TupleType'),
        ]),
      ],
      GenericTypeSyntax.SQUARE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a generic type node when "[TupleType1, TupleType2][]" arrived', function() {
    const typeExprStr = '[TupleType1, TupleType2][]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Array'),
      [
        createTupleTypeNode([
          createTypeNameNode('TupleType1'),
          createTypeNameNode('TupleType2'),
        ]),
      ],
      GenericTypeSyntax.SQUARE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "Generic<ParamType>" arrived', function() {
    const typeExprStr = 'Generic<ParamType>';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Generic'), [
        createTypeNameNode('ParamType'),
    ], GenericTypeSyntax.ANGLE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "Generic<Inner<ParamType>>" arrived', function() {
    const typeExprStr = 'Generic<Inner<ParamType>>';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Generic'), [
        createGenericTypeNode(
          createTypeNameNode('Inner'), [ createTypeNameNode('ParamType') ]
        ),
    ], GenericTypeSyntax.ANGLE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "Generic<ParamType1,ParamType2>"' +
     ' arrived', function() {
    const typeExprStr = 'Generic<ParamType1,ParamType2>';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Generic'), [
        createTypeNameNode('ParamType1'),
        createTypeNameNode('ParamType2'),
      ], GenericTypeSyntax.ANGLE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "Generic < ParamType1 , ParamType2 >"' +
     ' arrived', function() {
    const typeExprStr = 'Generic < ParamType1, ParamType2 >';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Generic'), [
        createTypeNameNode('ParamType1'),
        createTypeNameNode('ParamType2'),
      ], GenericTypeSyntax.ANGLE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "Generic.<ParamType>" arrived', function() {
    const typeExprStr = 'Generic.<ParamType>';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Generic'), [
        createTypeNameNode('ParamType'),
    ], GenericTypeSyntax.ANGLE_BRACKET_WITH_DOT);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "Generic.<ParamType1,ParamType2>"' +
     ' arrived', function() {
    const typeExprStr = 'Generic.<ParamType1,ParamType2>';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Generic'), [
        createTypeNameNode('ParamType1'),
        createTypeNameNode('ParamType2'),
      ], GenericTypeSyntax.ANGLE_BRACKET_WITH_DOT);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "Generic .< ParamType1 , ParamType2 >"' +
     ' arrived', function() {
    const typeExprStr = 'Generic .< ParamType1 , ParamType2 >';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Generic'), [
        createTypeNameNode('ParamType1'),
        createTypeNameNode('ParamType2'),
      ], GenericTypeSyntax.ANGLE_BRACKET_WITH_DOT);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "ParamType[]" arrived', function() {
    const typeExprStr = 'ParamType[]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Array'), [
        createTypeNameNode('ParamType'),
      ], GenericTypeSyntax.SQUARE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "ParamType[][]" arrived', function() {
    const typeExprStr = 'ParamType[][]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Array'), [
        createGenericTypeNode(
          createTypeNameNode('Array'), [
            createTypeNameNode('ParamType'),
        ], GenericTypeSyntax.SQUARE_BRACKET),
      ], GenericTypeSyntax.SQUARE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a generic type node when "ParamType [ ] [ ]" arrived', function() {
    const typeExprStr = 'ParamType [ ] [ ]';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createGenericTypeNode(
      createTypeNameNode('Array'), [
        createGenericTypeNode(
          createTypeNameNode('Array'), [
            createTypeNameNode('ParamType'),
        ], GenericTypeSyntax.SQUARE_BRACKET),
      ], GenericTypeSyntax.SQUARE_BRACKET);

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an optional type node when "string=" arrived', function() {
    const typeExprStr = 'string=';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createTypeNameNode('string'),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an optional type node when "=string" arrived (deprecated)', function() {
    const typeExprStr = '=string';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createTypeNameNode('string'),
      OptionalTypeSyntax.PREFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a nullable type node when "?string" arrived', function() {
    const typeExprStr = '?string';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNullableTypeNode(
      createTypeNameNode('string'),
      NullableTypeSyntax.PREFIX_QUESTION_MARK
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a nullable type node when "string?" arrived (deprecated)', function() {
    const typeExprStr = 'string?';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNullableTypeNode(
      createTypeNameNode('string'),
      NullableTypeSyntax.SUFFIX_QUESTION_MARK
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an optional type node when "string =" arrived', function() {
    const typeExprStr = 'string =';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createTypeNameNode('string'),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an optional type node when "= string" arrived (deprecated)', function() {
    const typeExprStr = '= string';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createTypeNameNode('string'),
      OptionalTypeSyntax.PREFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a nullable type node when "? string" arrived', function() {
    const typeExprStr = '? string';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNullableTypeNode(
      createTypeNameNode('string'),
      NullableTypeSyntax.PREFIX_QUESTION_MARK
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a nullable type node when "string ?" arrived (deprecated)', function() {
    const typeExprStr = 'string ?';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNullableTypeNode(
      createTypeNameNode('string'),
      NullableTypeSyntax.SUFFIX_QUESTION_MARK
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an optional type node when "?string=" arrived', function() {
    const typeExprStr = '?string=';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createNullableTypeNode(
        createTypeNameNode('string'),
        NullableTypeSyntax.PREFIX_QUESTION_MARK
      ),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return an optional type node when "string?=" arrived', function() {
    const typeExprStr = 'string?=';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createOptionalTypeNode(
      createNullableTypeNode(
        createTypeNameNode('string'),
        NullableTypeSyntax.SUFFIX_QUESTION_MARK
      ),
      OptionalTypeSyntax.SUFFIX_EQUALS_SIGN
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should throw an error when "?!string" arrived', function() {
    const typeExprStr = '?!string';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should throw an error when "!?string" arrived', function() {
    const typeExprStr = '!?string';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should return a variadic type node when "...PrefixVariadic" arrived', function() {
    const typeExprStr = '...PrefixVariadic';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createVariadicTypeNode(
      createTypeNameNode('PrefixVariadic'),
      VariadicTypeSyntax.PREFIX_DOTS
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a variadic type node when "SuffixVariadic..." arrived', function() {
    const typeExprStr = 'SuffixVariadic...';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createVariadicTypeNode(
      createTypeNameNode('SuffixVariadic'),
      VariadicTypeSyntax.SUFFIX_DOTS
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a variadic type node when "..." arrived', function() {
    const typeExprStr = '...';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createVariadicTypeNode(
      null,
      VariadicTypeSyntax.ONLY_DOTS
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a variadic type node when "...!Object" arrived', function() {
    const typeExprStr = '...!Object';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createVariadicTypeNode(
      createNotNullableTypeNode(
        createTypeNameNode('Object'),
        NotNullableTypeSyntax.PREFIX_BANG
      ),
      VariadicTypeSyntax.PREFIX_DOTS
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a variadic type node when "...?" arrived', function() {
    const typeExprStr = '...?';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createVariadicTypeNode(
      createUnknownTypeNode(),
      VariadicTypeSyntax.PREFIX_DOTS
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a not nullable type node when "!Object" arrived', function() {
    const typeExprStr = '!Object';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNotNullableTypeNode(
      createTypeNameNode('Object'),
      NotNullableTypeSyntax.PREFIX_BANG
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a not nullable type node when "Object!" arrived', function() {
    const typeExprStr = 'Object!';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNotNullableTypeNode(
      createTypeNameNode('Object'),
      NotNullableTypeSyntax.SUFFIX_BANG
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a not nullable type node when "! Object" arrived', function() {
    const typeExprStr = '! Object';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNotNullableTypeNode(
      createTypeNameNode('Object'),
      NotNullableTypeSyntax.PREFIX_BANG
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a not nullable type node when "Object !" arrived', function() {
    const typeExprStr = 'Object !';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNotNullableTypeNode(
      createTypeNameNode('Object'),
      NotNullableTypeSyntax.SUFFIX_BANG
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node when "function()" arrived', function() {
    const typeExprStr = 'function()';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [], null,
      { 'this': null, 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node with a param when "function(Param)" arrived', function() {
    const typeExprStr = 'function(Param)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [ createTypeNameNode('Param') ], null,
      { 'this': null, 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node with several params when "function(Param1,Param2)"' +
     ' arrived', function() {
    const typeExprStr = 'function(Param1,Param2)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [ createTypeNameNode('Param1'), createTypeNameNode('Param2') ], null,
      { 'this': null, 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node with variadic params when "function(...VariadicParam)"' +
     ' arrived', function() {
    const typeExprStr = 'function(...VariadicParam)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [
        createVariadicTypeNode(
          createTypeNameNode('VariadicParam'),
          VariadicTypeSyntax.PREFIX_DOTS
        ),
      ],
      null, { 'this': null, 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node with variadic params when "function(Param,...VariadicParam)"' +
     ' arrived', function() {
    const typeExprStr = 'function(Param,...VariadicParam)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [
        createTypeNameNode('Param'),
        createVariadicTypeNode(
          createTypeNameNode('VariadicParam'),
          VariadicTypeSyntax.PREFIX_DOTS
        ),
      ],
      null, { 'this': null, 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should throw an error when "function(...VariadicParam, UnexpectedLastParam)"' +
     ' arrived', function() {
    const typeExprStr = 'function(...VariadicParam, UnexpectedLastParam)';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should return a function type node with returns when "function():Returned"' +
     ' arrived', function() {
    const typeExprStr = 'function():Returned';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [], createTypeNameNode('Returned'),
      { 'this': null, 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node with a context type when "function(this:ThisObject)"' +
     ' arrived', function() {
    const typeExprStr = 'function(this:ThisObject)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [], null,
      { 'this': createTypeNameNode('ThisObject'), 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node with a context type when ' +
     '"function(this:ThisObject, param1)" arrived', function() {
    const typeExprStr = 'function(this:ThisObject, param1)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [createTypeNameNode('param1')],
      null,
      { 'this': createTypeNameNode('ThisObject'), 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node as a constructor when "function(new:NewObject)"' +
     ' arrived', function() {
    const typeExprStr = 'function(new:NewObject)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [], null,
      { 'this': null, 'new': createTypeNameNode('NewObject') }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a function type node as a constructor when ' +
     '"function(new:NewObject, param1)" arrived', function() {
    const typeExprStr = 'function(new:NewObject, param1)';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [createTypeNameNode('param1')],
      null,
      { 'this': null, 'new': createTypeNameNode('NewObject') }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should throw an error when "function(new:NewObject, this:ThisObject)" ' +
     'arrived', function() {
    const typeExprStr = 'function(new:NewObject, this:ThisObject)';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should throw an error when "function(this:ThisObject, new:NewObject)" ' +
     'arrived', function() {
    const typeExprStr = 'function(this:ThisObject, new:NewObject)';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should return a function type node when "function( Param1 , Param2 ) : Returned"' +
     ' arrived', function() {
    const typeExprStr = 'function( Param1 , Param2 ) : Returned';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createFunctionTypeNode(
      [ createTypeNameNode('Param1'), createTypeNameNode('Param2') ],
      createTypeNameNode('Returned'),
      { 'this': null, 'new': null }
    );

    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a number value type node when "0123456789" arrived', function() {
    const typeExprStr = '0123456789';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNumberValueNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a number value type node when "0.0" arrived', function() {
    const typeExprStr = '0.0';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNumberValueNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a number value type node when "-0" arrived', function() {
    const typeExprStr = '-0';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNumberValueNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a number value type node when "0b01" arrived', function() {
    const typeExprStr = '0b01';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNumberValueNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a number value type node when "0o01234567" arrived', function() {
    const typeExprStr = '0o01234567';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNumberValueNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a number value type node when "0x0123456789abcdef" arrived', function() {
    const typeExprStr = '0x0123456789abcdef';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createNumberValueNode(typeExprStr);
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a string value type node when \'""\' arrived', function() {
    const typeExprStr = '""';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createStringValueNode('');
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a string value type node when \'"string"\' arrived', function() {
    const typeExprStr = '"string"';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createStringValueNode('string');
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a string value type node when \'"マルチバイト"\' arrived', function() {
    const typeExprStr = '"マルチバイト"';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createStringValueNode('マルチバイト');
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a string value type node when \'"\\n\\"\\t"\' arrived', function() {
    const typeExprStr = '"\\n\\"\\t"';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createStringValueNode('\\n"\\t');
    expect(node).to.deep.equal(expectedNode);
  });


  it('should throw a syntax error when "" arrived', function() {
    const typeExprStr = '';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should throw a syntax error when "Invalid type" arrived', function() {
    const typeExprStr = 'Invalid type';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should throw a syntax error when "Promise*Error" arrived', function() {
    const typeExprStr = 'Promise*Error';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should throw a syntax error when "(unclosedParenthesis, " arrived', function() {
    const typeExprStr = '(unclosedParenthesis, ';

    expect(function() {
      Parser.parse(typeExprStr);
    }).to.throw(Parser.SyntaxError);
  });


  it('should return a type query type node when "typeof foo" arrived', function() {
    const typeExprStr = 'typeof foo';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createTypeQueryNode(
      createTypeNameNode('foo')
    );
    expect(node).to.deep.equal(expectedNode);
  });


  it('should return a key query type node when "keyof foo" arrived', function() {
    const typeExprStr = 'keyof foo';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createKeyQueryNode(
      createTypeNameNode('foo')
    );
    expect(node).to.deep.equal(expectedNode);
  });

  it('should return a key query type node when "keyof typeof foo" arrived', function() {
    const typeExprStr = 'keyof typeof foo';
    const node = Parser.parse(typeExprStr);

    const expectedNode = createKeyQueryNode(
      createTypeQueryNode(
        createTypeNameNode('foo')
      )
    );
    expect(node).to.deep.equal(expectedNode);
  });


  describe('operator precedence', function() {
    context('when "Foo|function():Returned?" arrived', function() {
      it('should parse as "Foo|((function():Returned)?)"', function() {
        const typeExprStr = 'Foo|function():Returned?';
        const node = Parser.parse(typeExprStr);

        const expectedNode = createUnionTypeNode(
          createTypeNameNode('Foo'),
          createNullableTypeNode(
            createFunctionTypeNode(
              [],
              createTypeNameNode('Returned'),
            { 'this': null, 'new': null }
            ),
            NullableTypeSyntax.SUFFIX_QUESTION_MARK
          ),
          UnionTypeSyntax.PIPE
        );

        expect(node).to.deep.equal(expectedNode);
      });
    });
  });
});


/**
 * @template T
 * @param {T} typeName
 */
function createTypeNameNode(typeName) {
  return {
    type: NodeType.NAME,
    name: typeName,
  };
}

function createAnyTypeNode() {
  return {
    type: NodeType.ANY,
  };
}

function createUnknownTypeNode() {
  return {
    type: NodeType.UNKNOWN,
  };
}

function createModuleNameNode(value) {
  return {
    type: NodeType.MODULE,
    value: value,
  };
}

function createExternalNameNode(value) {
  return {
    type: NodeType.EXTERNAL,
    value: value,
  };
}

function createOptionalTypeNode(optionalTypeExpr, syntax) {
  return {
    type: NodeType.OPTIONAL,
    value: optionalTypeExpr,
    meta: { syntax: syntax },
  };
}

function createNullableTypeNode(nullableTypeExpr, syntax) {
  return {
    type: NodeType.NULLABLE,
    value: nullableTypeExpr,
    meta: { syntax: syntax },
  };
}

function createNotNullableTypeNode(nullableTypeExpr, syntax) {
  return {
    type: NodeType.NOT_NULLABLE,
    value: nullableTypeExpr,
    meta: { syntax: syntax },
  };
}

function createMemberTypeNode(ownerTypeExpr, memberTypeName, hasEventPrefix) {
  return {
    type: NodeType.MEMBER,
    owner: ownerTypeExpr,
    name: memberTypeName,
    hasEventPrefix: hasEventPrefix || false,
  };
}

function createInnerMemberTypeNode(ownerTypeExpr, memberTypeName, hasEventPrefix) {
  return {
    type: NodeType.INNER_MEMBER,
    owner: ownerTypeExpr,
    name: memberTypeName,
    hasEventPrefix: hasEventPrefix || false,
  };
}

function createInstanceMemberTypeNode(ownerTypeExpr, memberTypeName, hasEventPrefix) {
  return {
    type: NodeType.INSTANCE_MEMBER,
    owner: ownerTypeExpr,
    name: memberTypeName,
    hasEventPrefix: hasEventPrefix || false,
  };
}

function createUnionTypeNode(leftTypeExpr, rightTypeExpr, syntax) {
  return {
    type: NodeType.UNION,
    left: leftTypeExpr,
    right: rightTypeExpr,
    meta: { syntax: syntax || UnionTypeSyntax.PIPE },
  };
}

function createVariadicTypeNode(variadicTypeExpr, syntax) {
  return {
    type: NodeType.VARIADIC,
    value: variadicTypeExpr,
    meta: { syntax: syntax },
  };
}

function createRecordTypeNode(recordEntries) {
  return {
    type: NodeType.RECORD,
    entries: recordEntries,
  };
}

function createRecordEntryNode(key, valueTypeExpr) {
  return {
    type: NodeType.RECORD_ENTRY,
    key: key,
    value: valueTypeExpr,
  };
}

/**
 * @template T
 * @param {T[]} tupleEntries
 */
function createTupleTypeNode(tupleEntries) {
  return {
    type: NodeType.TUPLE,
    entries: tupleEntries,
  };
}

function createGenericTypeNode(genericTypeName, paramExprs, syntaxType) {
  return {
    type: NodeType.GENERIC,
    subject: genericTypeName,
    objects: paramExprs,
    meta: { syntax: syntaxType || GenericTypeSyntax.ANGLE_BRACKET },
  };
}

function createFunctionTypeNode(paramNodes, returnedNode, modifierMap) {
  return {
    type: NodeType.FUNCTION,
    params: paramNodes,
    returns: returnedNode,
    this: modifierMap.this,
    new: modifierMap.new,
  };
}

function createNumberValueNode(numberLiteral) {
  return {
    type: NodeType.NUMBER_VALUE,
    number: numberLiteral,
  };
}

function createStringValueNode(stringLiteral) {
  return {
    type: NodeType.STRING_VALUE,
    string: stringLiteral,
  };
}

function createFilePathNode(filePath) {
  return {
    type: NodeType.FILE_PATH,
    path: filePath,
  };
}

function createParenthesizedNode(value) {
  return {
    type: NodeType.PARENTHESIS,
    value: value,
  };
}

/**
 * @template T
 * @param {T} name
 */
function createTypeQueryNode(name) {
  return {
    type: NodeType.TYPE_QUERY,
    name: name,
  }
}

/**
 * @template T
 * @param {T} value
 */
function createKeyQueryNode(value) {
  return {
    type: NodeType.KEY_QUERY,
    value: value,
  };
}

