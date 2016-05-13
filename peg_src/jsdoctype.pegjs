{
  var lodash = require('lodash');
  var meta = require('../lib/SyntaxType.js');
  var GenericTypeSyntax = meta.GenericTypeSyntax;
  var UnionTypeSyntax = meta.UnionTypeSyntax;
  var VariadicTypeSyntax = meta.VariadicTypeSyntax;
  var NodeType = require('../lib/NodeType.js');

  var FunctionModifierType = {
    NONE: "NONE",
    CONTEXT: "CONTEXT",
    NEW: "NEW",
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


TypeExpr = Operand9


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


Operand = FuncTypeExpr
        / RecordTypeExpr
        / ParenthesisTypeExpr
        / AnyTypeExpr
        / UnknownTypeExpr
        / ModuleNameExpr
        / ValueExpr
        / ExternalNameExpr
        / TypeNameExpr



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
FuncTypeExpr = "function" _ paramsPart:FuncTypeExprParamsPart _ returnedTypePart:(":" _ Operand7)? {
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
FuncTypeExprModifier = modifierThis:("this" _ ":" _ Operand7) {
                         return { nodeThis: modifierThis[4], nodeNew: null };
                       }
                     / modifierNew:("new" _ ":" _ Operand7) {
                         return { nodeThis: null, nodeNew: modifierNew[4] };
                       }


FuncTypeExprParams = first:Operand7 restWithComma:(_ "," _ TypeExpr)* {
                     return buildByFirstAndRest(first, restWithComma, 3);
                   }



/*
 * Record type expressions.
 *
 * Examples:
 *   - {}
 *   - {length}
 *   - {length:number}
 *   - {toString:Function,valueOf:Function}
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


RecordEntry = key:JsIdentifier valueWithColon:(_ ":" _ Operand7)? {
              var value = valueWithColon ? valueWithColon[3] : null;

              return {
                type: NodeType.RECORD_ENTRY,
                key: key,
                value: value
              };
            }



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
ParenthesisTypeExpr = "(" _ wrapped:Operand7 _ ")" {
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
ExternalNameExpr = "external" _ ":" _ value:ExternalNameExprAddressExpr {
                   return {
                     type: NodeType.EXTERNAL,
                     value: value
                   };
                 }


// TODO: It should allow several member operators.
ExternalNameExprAddressExpr = TypeNameExpr



/*
 * Module name expressions.
 *
 * Examples:
 *   - module:path/to/file
 *   - module:path/to/file.js
 *
 * Spec:
 *   - http://usejsdoc.org/about-namepaths.html
 */
ModuleNameExpr = "module" _ ":" _ filePath:ModuleNameFilePathPart {
                 return {
                   type: NodeType.MODULE,
                   path: filePath
                 };
               }


ModuleNameFilePathPart = $([a-zA-Z_0-9_$./-]+)



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
NullableTypeOperator = "?"


DeprecatedNullableTypeOperator = NullableTypeOperator



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
NotNullableTypeOperator = "!"


DeprecatedNotNullableTypeOperator = NotNullableTypeOperator



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
OptionalTypeOperator = "="


DeprecatedOptionalTypeOperator = OptionalTypeOperator



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
PrefixVariadicTypeOperator = "..."


SuffixVariadicTypeOperator = PrefixVariadicTypeOperator



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
ArrayOfGenericTypeOperatorJsDocFlavored = "[" _ "]"



// OperandN is for operator precedence.
// See https://github.com/Kuniwak/jsdoctypeparser/issues/34

// Deprecated optional type operators should be placed before optional operators.
// https://github.com/google/closure-library/blob/
//   47f9c92bb4c7de9a3d46f9921a427402910073fb/closure/goog/net/tmpnetwork.js#L50
Operand1 = operand:Operand operator:DeprecatedNullableTypeOperator {
             return operator
               ? {
                   type: NodeType.NULLABLE,
                   value: operand,
                 }
               : operand;
           }
         / Operand


Operand2 = operand:Operand1 operator:DeprecatedNotNullableTypeOperator {
             return {
               type: NodeType.NOT_NULLABLE,
               value: operand,
             };
           }
         / Operand1


Operand3 = operand:Operand2 operator:OptionalTypeOperator {
             return {
               type: NodeType.OPTIONAL,
               value: operand,
             };
           }
         / Operand2


Operand4 = operator:NullableTypeOperator operand:Operand3 {
             return {
               type: NodeType.NULLABLE,
               value: operand,
             };
           }
         / Operand3


Operand5 = operator:NotNullableTypeOperator operand:Operand4 {
             return {
               type: NodeType.NOT_NULLABLE,
               value: operand,
             };
           }
         / Operand4



Operand6 = operator:DeprecatedOptionalTypeOperator operand:Operand5 {
             return {
               type: NodeType.OPTIONAL,
               value: operand,
             };
           }
         / Operand5


// TODO: We should care complex type expression like "Some[]![]"
Operand7 = operand:Operand6 operators:ArrayOfGenericTypeOperatorJsDocFlavored* {
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


Operand8 = operator:PrefixVariadicTypeOperator operand:Operand7 {
             return {
               type: NodeType.VARIADIC,
               value: operand,
               meta: { syntax: VariadicTypeSyntax.PREFIX_DOTS },
             };
           }
         / Operand7


Operand9 = operand:Operand8 operator:SuffixVariadicTypeOperator {
             return {
               type: NodeType.VARIADIC,
               value: operand,
               meta: { syntax: VariadicTypeSyntax.SUFFIX_DOTS },
             };
           }
         / Operand8
