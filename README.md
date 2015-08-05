jsdoctypeparser
===============

[![Build Status](https://travis-ci.org/Kuniwak/jsdoctypeparser.svg?branch=master)](https://travis-ci.org/Kuniwak/jsdoctypeparser)
[![NPM version](https://badge.fury.io/js/jsdoctypeparser.svg)](http://badge.fury.io/js/jsdoctypeparser)

The parser can parse:

* [JSDoc type expressions](https://code.google.com/p/jsdoc-toolkit/wiki/TagParam)
  * `foo.bar`, `String[]`
* [Closure Compiler type expressions](https://developers.google.com/closure/compiler/docs/js-for-compiler)
  * `Array<string>`, `function(arg1, arg2): ret`
* [JSDuck type definitions](https://github.com/senchalabs/jsduck/wiki/Type-Definitions)
  * `Boolean/"top"/"bottom"`
* Complex type expressions
  * `Array<Array<string>>`, `function(function(Function))`


Live demo
---------

The [live demo](http://kuniwak.github.io/jsdoctypeparser/) is available.


Usage
-----

### Parsing

```javascript
var parse = require('jsdoctypeparser').parse;

var ast = parse('Array<MyClass>');
```

The `ast` becomes:

```json
{
  "type": "GENERIC",
  "subject": {
    "type": "NAME",
    "name": "Array"
  },
  "objects": [
    {
      "type": "NAME",
      "name": "MyClass"
    }
  ]
}
```


### Publishing

We can stringify the AST nodes by using `publish`.

```javascript
var publish = require('jsdoctypeparser').publish;

var ast = {
  type: 'GENERIC',
  subject: {
    type: 'NAME',
    name: 'Array'
  },
  objects: [
    {
      type: 'NAME',
      name: 'MyClass'
    }
  ]
};

var string = publish(ast);
```

The `string` becomes:

```json
"Array<MyClass>"
```


#### Custom publishing

We can change the stringification strategy by using the 2nd parameter of `publish(node, publisher)`.
The `publisher` MUST have handlers for all node types (see `lib/NodeType.js`).

And we can override default behavior by using `createDefaultPublisher`.


```javascript
const {publish, createDefaultPublisher} = require('jsdoctypeparser').publish;

const ast = {
  type: 'NAME',
  name: 'MyClass'
};

const defaultPublisher = createDefaultPublisher();
const customPublisher = Object.create(defaultPublisher, {
  NAME: (node, pub) => {
    return `<a href="./types/${node.name}.html">${node.name}</a>`;
  },
});

const string = publish(ast, customPublisher);
```

The `string` becomes:

```html
<a href="./types/MyClass.html">MyClass</a>
```


### Traversing

We can traverse the AST by using `traverse`.
This function take 3 parameters (a node and an onEnter handler, an onLeave handler).
The handlers take a visiting node.

```javascript
const {parse, traverse} = require('jsdoctypeparser');
const ast = parse('Array<{ key1: function(), key2: A.B.C }>');

funciton onEnter(node) {
  console.log('enter', node.type);
}

funciton onLeave(node) {
  console.log('leave', node.type);
}

traverse(ast, onEnter, onLeave);
```

The output will be:

```
enter GENERIC
enter RECORD
enter RECORD_ENTRY
enter FUNCTION
leave FUNCTION
leave RECORD_ENTRY
enter RECORD_ENTRY
enter MEMBER
enter MEMBER
enter NAME
leave NAME
leave MEMBER
leave MEMBER
leave RECORD_ENTRY
leave RECORD
leave GENERIC
```


AST Specifications
------------------

### `NAME`

Example:

```javascript
/**
 * @type {name}
 */
```

Structure:

```javascript
{
  "type": "NAME",
  "name": string
}
```


### `MEMBER`

Example:

```javascript
/**
 * @type {owner.name}
 * @type {superOwner.owner.name}
 */
```

Structure:

```javascript
{
  "type": "MEMBER",
  "name": string,
  "owner": node
}
```


### `INNER_MEMBER`

Example:

```javascript
/**
 * @type {owner~name}
 */
```

Structure:

```javascript
{
  "type": "INNER_MEMBER",
  "name": string,
  "owner": node
}
```



### `INSTANCE_MEMBER`

Example:

```javascript
/**
 * @type {owner#name}
 */
```

Structure:

```javascript
{
  "type": "INSTANCE_MEMBER",
  "name": string,
  "owner": node
}
```


### `UNION`

Example:

```javascript
/**
 * @type {left|right}
 * @type {(left|right)}
 * @type {left/right}
 */
```

Structure:

```javascript
{
  "type": "UNION",
  "left": node,
  "right": node
}
```


### `RECORD`

Example:

```javascript
/**
 * @type {{}}
 * @type {{ key: value }}
 * @type {{ key: value, anyKey }}
 */
```

Structure:

```javascript
{
  "type": "RECORD",
  "entries": [
    recordEntryNode,
    recordEntryNode,
    ...
  ]
}
```


### `RECORD_ENTRY`

Structure:

```javascript
{
  "type": "RECORD_ENTRY",
  "key": string,
  "value": node (or null)
}
```


### `GENERIC`

Example:

```javascript
/**
 * @type {Subject<Object, Object>}
 * @type {Object[]}
 */
```

Structure:

```javascript
{
  "type": "GENERIC",
  "subject": node,
  "objects": [
    node,
    node,
    ...
  ]
}
```


### `FUNCTION`

Example:

```javascript
/**
 * @type {function()}
 * @type {function(param, param): return}
 * @type {function(this: Context)}
 * @type {function(new: Class)}
 */
```

Structure:

```javascript
{
  "type": "FUNCTION",
  "params": [
    node,
    node,
    ...
  ],
  "returns": node (or null),
  "new": node (or null),
  "this": node (or null)
}
```


### `OPTIONAL`

Example:

```javascript
/**
 * @type {Optional=}
 */
```

Structure:

```javascript
{
  "type": "OPTIONAL",
  "value": node
}
```


### `NULLABLE`

Example:

```javascript
/**
 * @type {?Nullable}
 */
```

Structure:

```javascript
{
  "type": "NULLABLE",
  "value": node
}
```


### `NOT_NULLABLE`

Example:

```javascript
/**
 * @type {!NotNullable}
 */
```

Structure:

```javascript
{
  "type": "NOT_NULLABLE",
  "value": node
}
```


### `VARIADIC`

Example:

```javascript
/**
 * @type {...Variadic}
 */
```

Structure:

```javascript
{
  "type": "VARIADIC",
  "value": node
}
```


### `MODULE`

Example:

```javascript
/**
 * @type {module:path/to/file.js}
 */
```

Structure:

```javascript
{
  "type": "MODULE",
  "path": string
}
```


### `EXTERNAL`

Example:

```javascript
/**
 * @type {external:External}
 */
```

Structure:

```javascript
{
  "type": "EXTERNAL",
  "value": node
}
```


### `STRING_VALUE`

Example:

```javascript
/**
 * @type {"abc"}
 * @type {"can\"escape"}
 */
```

Structure:

```javascript
{
  "type": "STRING_VALUE",
  "string": string
}
```


### `NUMBER_VALUE`

Example:

```javascript
/**
 * @type {123}
 * @type {0b11}
 * @type {0o77}
 * @type {0xff}
 */
```

Structure:

```javascript
{
  "type": "NUMBER_VALUE",
  "number": string
}
```


### `ANY`

Example:

```javascript
/**
 * @type {*}
 */
```

Structure:

```javascript
{
  "type": "ANY"
}
```


### `UNKNOWN`

Example:

```javascript
/**
 * @type {?}
 */
```

Structure:

```javascript
{
  "type": "UNKNOWN"
}
```


### Others

We can use a parenthesis to change operator orders.

```javascript
/**
 * @type {(module:path/to/file.js).foo}
 */
```


License
-------

[This script licensed under the MIT](http://kuniwak.mit-license.org).
