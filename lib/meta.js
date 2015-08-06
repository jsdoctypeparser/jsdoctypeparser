/**
 * Syntax type of generic types.
 * @enum {string}
 */
var GenericTypeSyntax = {
  // TypeScript and Closure Library
  ANGLE_BRACKET: 'ANGLE_BRACKET',

  // Legacy Closure Library
  ANGLE_BRACKET_WITH_DOT: 'ANGLE_BRACKET_WITH_DOT',

  // JSDoc and JSDuck
  SQUARE_BRACKET: 'SQUARE_BRACKET',
};


module.exports = {
  GenericTypeSyntax: GenericTypeSyntax,
};
