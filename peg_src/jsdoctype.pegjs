{
  var lodash = require('lodash');
  var meta = require('../lib/SyntaxType.js');
  var GenericTypeSyntax = meta.GenericTypeSyntax;
  var UnionTypeSyntax = meta.UnionTypeSyntax;
  var VariadicTypeSyntax = meta.VariadicTypeSyntax;
  var NodeType = require('../lib/NodeType.js');

  var NamepathOperatorType = {
    MEMBER: 'MEMBER',
    INNER_MEMBER: 'INNER_MEMBER',
    INSTANCE_MEMBER: 'INSTANCE_MEMBER',
  };

  function reverse(array) {
    var reversed = [].concat(array);
    reversed.reverse();
    return reversed;
  }

  function buildByFirstAndRest(first, restWithComma, restIndex) {
    if (!first) return [];

    var rests = restWithComma ? lodash.pluck(restWithComma, restIndex) : [];
    return [first].concat(rests);
  }
}


TopLevelTypeExpr = SuffixVariadicTypeExpr


TypeExpr = UnionTypeExpr
         / ArrayOfGenericTypeExprJsDocFlavored


/*
 * White spaces.
 */
_  = [ \t\r\n ]*


/*
 * JavaScript identifier names.
 *
 * NOTE: We does not support UnicodeIDStart and \UnicodeEscapeSequence yet.
 *
 * Spec:
 *   - http://www.ecma-international.org/ecma-262/6.0/index.html#sec-names-and-keywords
 *   - http://unicode.org/reports/tr31/#Table_Lexical_Classes_for_Identifiers
 */
JsIdentifier = $([a-zA-Z_$][a-zA-Z0-9_$]*)


NamepathExpr = rootOwner:TypeNameExpr memberPartWithOperators:(_ InfixNamepathOperator _ JsIdentifier)* {
               return memberPartWithOperators.reduce(function(owner, tokens) {
                 var operatorType = tokens[1];
                 var memberName = tokens[3];

                 switch (operatorType) {
                   case NamepathOperatorType.MEMBER:
                     return {
                       type: NodeType.MEMBER,
                       owner: owner,
                       name: memberName,
                     };
                   case NamepathOperatorType.INSTANCE_MEMBER:
                     return {
                       type: NodeType.INSTANCE_MEMBER,
                       owner: owner,
                       name: memberName,
                     };
                   case NamepathOperatorType.INNER_MEMBER:
                     return {
                       type: NodeType.INNER_MEMBER,
                       owner: owner,
                       name: memberName,
                     };
                   default:
                     throw new Error('Unexpected operator type: "' + operatorType + '"');
                 }
               }, rootOwner);
             }



/*
 * Type name expressions.
 *
 * Examples:
 *   - string
 *   - null
 *   - Error
 *   - $
 *   - _
 *   - custom-type (JSDoc compatible)
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
TypeNameExpr = TypeNameExprJsDocFlavored
             / TypeNameExprStrict

TypeNameExprStrict = name:JsIdentifier {
                     return {
                       type: NodeType.NAME,
                       name: name
                     };
                   }


// JSDoc allow to use hyphens in identifier contexts.
// See https://github.com/Kuniwak/jsdoctypeparser/issues/15
TypeNameExprJsDocFlavored = name:$([a-zA-Z_$][a-zA-Z0-9_$-]*) {
                            return {
                              type: NodeType.NAME,
                              name: name
                            };
                          }


InfixNamepathOperator = MemberTypeOperator
                      / InstanceMemberTypeOperator
                      / InnerMemberTypeOperator


/*
 * Member type expressions.
 *
 * Examples:
 *   - owner.member
 *   - superOwner.owner.member
 */
MemberTypeOperator = "." {
                     return NamepathOperatorType.MEMBER;
                   }


/*
 * Inner member type expressions.
 *
 * Examples:
 *   - owner~innerMember
 *   - superOwner~owner~innerMember
 */
InnerMemberTypeOperator = "~" {
                          return NamepathOperatorType.INNER_MEMBER;
                        }


/*
 * Instance member type expressions.
 *
 * Examples:
 *   - owner#instanceMember
 *   - superOwner#owner#instanceMember
 */
InstanceMemberTypeOperator = "#" {
                             return NamepathOperatorType.INSTANCE_MEMBER;
                           }



Operand = FuncTypeExpr
        / RecordTypeExpr
        / ParenthesisTypeExpr
        / AnyTypeExpr
        / UnknownTypeExpr
        / ModuleNameExpr
        / ValueExpr
        / ExternalNameExpr
        / GenericTypeExpr
        / NamepathExpr


/*
 * Function type expressions.
 *
 * Examples:
 *   - function(string)
 *   - function(string, ...string)
 *   - function():number
 *   - function(this:jQuery):jQuery
 *   - function(new:Error)
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
FuncTypeExpr = "function" _ paramsPart:FuncTypeExprParamsPart _ returnedTypePart:(":" _ TypeExpr)? {
               var returnedTypeNode = returnedTypePart ? returnedTypePart[2] : null;

               return {
                 type: NodeType.FUNCTION,
                 params: paramsPart.params,
                 returns: returnedTypeNode,
                 this: paramsPart.modifier.nodeThis,
                 new: paramsPart.modifier.nodeNew,
               };
             }


FuncTypeExprParamsPart = "(" _ modifier:FuncTypeExprModifier _ "," _ params: FuncTypeExprParams _ ")" {
                           return { params: params, modifier: modifier };
                         }
                       / "(" _ modifier:FuncTypeExprModifier _ ")" {
                           return { params: [], modifier: modifier };
                         }
                       / "(" _ params:FuncTypeExprParams _ ")" {
                           return { params: params, modifier: { nodeThis: null, nodeNew: null } };
                         }
                       / "(" _ ")" {
                           return { params: [], modifier: { nodeThis: null, nodeNew: null } };
                         }


// We can specify either "this:" or "new:".
// See https://github.com/google/closure-compiler/blob/
//       91cf3603d5b0b0dc289ba73adcd0f2741aa90d89/src/
//       com/google/javascript/jscomp/parsing/JsDocInfoParser.java#L2158-L2171
FuncTypeExprModifier = modifierThis:("this" _ ":" _ TypeExpr) {
                         return { nodeThis: modifierThis[4], nodeNew: null };
                       }
                     / modifierNew:("new" _ ":" _ TypeExpr) {
                         return { nodeThis: null, nodeNew: modifierNew[4] };
                       }


// Variadic type is only allowed on the last parameter.
FuncTypeExprParams = paramsWithComma:(TypeExpr _ "," _)* lastParam:SuffixVariadicTypeExpr {
                     var params = paramsWithComma.map(function(tokens) {
                       var operand7 = tokens[0];
                       return operand7;
                     });
                     return params.concat([lastParam]);
                   }



/*
 * Record type expressions.
 *
 * Examples:
 *   - {}
 *   - {length}
 *   - {length:number}
 *   - {toString:Function,valueOf:Function}
 *   - {'foo':*}
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
RecordTypeExpr = "{" _ firstEntry:RecordEntry? restEntriesWithComma:(_ "," _ RecordEntry)* _ "}" {
                 var entries = buildByFirstAndRest(firstEntry, restEntriesWithComma, 3);

                 return {
                   type: NodeType.RECORD,
                   entries: entries
                 };
               }


RecordEntry = key:RecordKey valueWithColon:(_ ":" _ TypeExpr)? {
              var value = valueWithColon ? valueWithColon[3] : null;

              return {
                type: NodeType.RECORD_ENTRY,
                key: key,
                value: value
              };
            }


RecordKey = '"' key:$([^"]*) '"' {
              return key;
            }
          / "'" key:$([^']*) "'" {
              return key;
            }
          / JsIdentifier



/*
 * Generic type expressions.
 *
 * Examples:
 *   - Function<T>
 *   - Array.<string> (Legacy Closure Library style and JSDoc3 style)
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 *   - http://usejsdoc.org/tags-type.html
 */
GenericTypeExpr = operand:NamepathExpr _ syntax:GenericTypeStartToken _
                  objects:GenericTypeExprObjectivePart _ GenericTypeEndToken {
                  return {
                    type: NodeType.GENERIC,
                    subject: operand,
                    objects: objects,
                    meta: { syntax: syntax },
                  };
                }


GenericTypeExprObjectivePart = first:TypeExpr restsWithComma:(_ "," _ TypeExpr)* {
                               var objects = buildByFirstAndRest(first, restsWithComma, 3);
                               return objects;
                             }


GenericTypeStartToken = GenericTypeEcmaScriptFlavoredStartToken
                      / GenericTypeTypeScriptFlavoredStartToken


GenericTypeEcmaScriptFlavoredStartToken = ".<" {
                                          return GenericTypeSyntax.ANGLE_BRACKET_WITH_DOT;
                                        }


GenericTypeTypeScriptFlavoredStartToken = "<" {
                                          return GenericTypeSyntax.ANGLE_BRACKET;
                                        }


GenericTypeEndToken = ">"



/*
 * Parenthesis expressions.
 *
 * Examples:
 *   - (Foo|Bar)
 *   - (module: path/to/file).Module
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
ParenthesisTypeExpr = "(" _ wrapped:TypeExpr _ ")" {
                      return wrapped;
                    }



/*
 * Any type expressions.
 *
 * Examples:
 *   - *
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
AnyTypeExpr = "*" {
              return { type: NodeType.ANY };
            }



/*
 * Unknown type expressions.
 *
 * Examples:
 *   - ?
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
UnknownTypeExpr = "?" {
                  return { type: NodeType.UNKNOWN };
                }



/*
 * Value type expressions.
 *
 * Example:
 *   - 123
 *   - 0.0
 *   - -123
 *   - 0b11
 *   - 0o77
 *   - 0cff
 *   - "foo"
 *   - "foo\"bar\nbuz"
 *
 * Spec:
 *   - https://github.com/senchalabs/jsduck/wiki/Type-Definitions#type-names
 */
ValueExpr = StringLiteralExpr / NumberLiteralExpr


StringLiteralExpr = '"' value:$([^\\"] / "\\".)* '"' {
                    return {
                      type: NodeType.STRING_VALUE,
                      string: value.replace(/\\"/g, '"')
                    };
                  }


NumberLiteralExpr = value:(BinNumberLiteralExpr / OctNumberLiteralExpr / HexNumberLiteralExpr / DecimalNumberLiteralExpr) {
                    return {
                      type: NodeType.NUMBER_VALUE,
                      number: value
                    };
                  }


DecimalNumberLiteralExpr = $("-"? [0-9]+ ("." [0-9]+)?)


BinNumberLiteralExpr = $("-"? "0b"[01]+)


OctNumberLiteralExpr = $("-"? "0o"[0-7]+)


HexNumberLiteralExpr = $("-"? "0x"[0-9a-fA-F]+)



/*
 * External name expressions.
 *
 * Examples:
 *   - external:path/to/file
 *   - external:path/to/file.js
 *
 * Spec:
 *   - http://usejsdoc.org/tags-external.html
 */
ExternalNameExpr = "external" _ ":" _ value:NamepathExpr {
                   return {
                     type: NodeType.EXTERNAL,
                     value: value
                   };
                 }



/*
 * Module name expressions.
 *
 * Examples:
 *   - module:path/to/file
 *   - module:path/to/file.js
 *   - module:MyModule~Foo (TODO: support it)
 *
 * Spec:
 *   - http://usejsdoc.org/tags-module.html
 *   - http://usejsdoc.org/howto-commonjs-modules.html
 */
ModuleNameExpr = "module" _ ":" _ filePathExpr:FilePathExpr {
                 return {
                   type: NodeType.MODULE,
                   path: filePathExpr.path,
                 };
               }



FilePathExpr = filePath:$([a-zA-Z0-9_$./-]+) {
               return {
                 type: NodeType.FILE_PATH,
                 path: filePath,
               };
             }



/*
 * Nullable type expressions.
 *
 * Examples:
 *   - ?string
 *   - string? (deprecated)
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
NullableTypeExpr = operator:"?" operand:OptionalTypeExpr {
                     return {
                       type: NodeType.NULLABLE,
                       value: operand,
                     };
                   }
                 / OptionalTypeExpr


// Deprecated optional type operators should be placed before optional operators.
// https://github.com/google/closure-library/blob/
//   47f9c92bb4c7de9a3d46f9921a427402910073fb/closure/goog/net/tmpnetwork.js#L50
DeprecatedNullableTypeExpr = operand:Operand operator:"?"? {
                             // "Operand Operator?" is faster than "Operand Operator / Operand".
                             // Because the operand will not be tried twice when the suffix
                             // operator is failed.
                             return operator
                               ? {
                                   type: NodeType.NULLABLE,
                                   value: operand,
                                 }
                               : operand;
                           }



/*
 * Nullable type expressions.
 *
 * Examples:
 *   - !Object
 *   - Object! (deprecated)
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
NotNullableTypeExpr = operator:"!" operand:NullableTypeExpr {
                        return {
                          type: NodeType.NOT_NULLABLE,
                          value: operand,
                        };
                      }
                    / NullableTypeExpr


DeprecatedNotNullableTypeExpr = operand:DeprecatedNullableTypeExpr operator:"!"? {
                                // "Operand Operator?" is faster than "Operand Operator / Operand".
                                // Because the operand will not be tried twice when the suffix
                                // operator is failed.
                                return operator
                                  ? {
                                      type: NodeType.NOT_NULLABLE,
                                      value: operand,
                                    }
                                  : operand;
                              }



/*
 * Optional type expressions.
 *
 * Examples:
 *   - string=
 *   - =string (deprecated)
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 */
OptionalTypeExpr = operand:DeprecatedNotNullableTypeExpr operator:"="? {
                   // "Operand Operator?" is faster than "Operand Operator / Operand".
                   // Because the operand will not be tried twice when the suffix
                   // operator is failed.
                   return operator 
                     ? {
                         type: NodeType.OPTIONAL,
                         value: operand,
                       }
                     : operand;
                 }


DeprecatedOptionalTypeExpr = operator:"=" operand:NotNullableTypeExpr {
                               return {
                                 type: NodeType.OPTIONAL,
                                 value: operand,
                               };
                             }
                           / NotNullableTypeExpr





/*
 * Variadic type expressions.
 *
 * Examples:
 *   - ...string (only allow on the top level or the last function parameter)
 *   - string... (only allow on the top level)
 *
 * Spec:
 *   - https://developers.google.com/closure/compiler/docs/js-for-compiler#types
 *   - https://github.com/senchalabs/jsduck/wiki/Type-Definitions
 */
PrefixVariadicTypeExpr = operator:"..." operand:TypeExpr {
             return {
               type: NodeType.VARIADIC,
               value: operand,
               meta: { syntax: VariadicTypeSyntax.PREFIX_DOTS },
             };
           }
         / TypeExpr


SuffixVariadicTypeExpr = operand:PrefixVariadicTypeExpr operator:"..."? {
                         return operator
                           ? {
                               type: NodeType.VARIADIC,
                               value: operand,
                               meta: { syntax: VariadicTypeSyntax.SUFFIX_DOTS },
                             }
                           : operand;
                       }



/*
 * JSDoc style array of a generic type expressions.
 *
 * Examples:
 *   - string[]
 *   - number[][]
 *
 * Spec:
 *   - https://github.com/senchalabs/jsduck/wiki/Type-Definitions#the-basic-syntax
 */
// TODO: We should care complex type expression like "Some[]![]"
ArrayOfGenericTypeExprJsDocFlavored = operand:DeprecatedOptionalTypeExpr operators:"[]"* {
                                      return operators.reduce(function(prev, operator) {
                                        return {
                                          type: NodeType.GENERIC,
                                          subject: {
                                            type: NodeType.NAME,
                                            name: 'Array'
                                          },
                                          objects: [ prev ],
                                          meta: { syntax: GenericTypeSyntax.SQUARE_BRACKET },
                                        };
                                      }, operand);
                                    }



/*
 * Union type expressions.
 *
 * Examples:
 *   - number|undefined
 *   - Foo|Bar|Baz
 */
UnionTypeExpr = left:ArrayOfGenericTypeExprJsDocFlavored _ syntax:UnionTypeOperator _ right:TypeExpr {
                return {
                    type: NodeType.UNION,
                    left: left,
                    right: right,
                    meta: { syntax: syntax },
                };
              }

// https://github.com/senchalabs/jsduck/wiki/Type-Definitions#type-names
UnionTypeOperator = UnionTypeOperatorClosureLibraryFlavored
                  / UnionTypeOperatorJSDuckFlavored


UnionTypeOperatorClosureLibraryFlavored = "|" {
                                          return UnionTypeSyntax.PIPE;
                                        }


UnionTypeOperatorJSDuckFlavored = "/" {
                                  return UnionTypeSyntax.SLASH;
                                }
