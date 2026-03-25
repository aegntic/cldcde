<a name="module_strangler"></a>
strangler.js
===============

[![NPM version](https://img.shields.io/npm/v/strangler.svg)]()
[![npm](https://img.shields.io/npm/dt/strangler.svg)]()
[![Travis](https://img.shields.io/travis/khrome/strangler.svg)]()

It's a string wrangler, and not nearly as dangerous as it sounds. A set of string utilities which expand those in [string-tools](https://www.npmjs.com/package/string-tools) with additional features.

Usage
-----
Often I do string parsing and I like some convenience functions to help out.

you can either retain an instance and use it that way:

    var stringTool = require('strangler');
    stringTool.contains(string, substring);

or you can just attach to the prototype (this can be OK in an app, but **is a bad idea in a library**):

    require('string-tools').proto();
	string.contains(substring);

* [string-tools](https://www.npmjs.com/package/string-tools) + [strangler](#module_strangler)
  * [.proto()](#module_strangler.proto)
  * [.contains(str, target)](#module_strangler.contains) ⇒ <code>boolean</code>
  * [.beginsWith(str, target)](#module_strangler.beginsWith) ⇒ <code>boolean</code>
  * [.endsWith(str, target)](#module_strangler.endsWith) ⇒ <code>boolean</code>
  * [.splitHonoringQuotes(str, [delimiter], [quotes])](#module_strangler.splitHonoringQuotes) ⇒ <code>Array</code>
  * [.decompose(str, [delimiter], [quotes])](#module_strangler.decompose) ⇒ <code>Array</code>
  * [.multiLineAppend(str, appendStr)](#module_strangler.multiLineAppend) ⇒ <code>string</code>

<a name="module_string-tools.symbol"></a>
### proto()
assign these utilities to String.prototype and throw caution to the wind...

**Kind**: static property of <code>[strangler](#module_strangler)</code>
<a name="module_strangler.contains"></a>
### .contains(str, candidate) ⇒ <code>boolean</code>
Tests whether the string contains a particular substring or set of substrings

**Kind**: static method of <code>[strangler](#module_strangler)</code>

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | input string to test |
| candidate | <code>string</code> or <code>Array</code> | the substring to test |


**Example**
```js
'elongated'.contains('gate'); //returns true;
'elongated'.contains(['long', 'gate']); //returns true;
'elongated'.contains(['wall']); //returns false;
```

<a name="module_strangler.beginsWith"></a>
### .beginsWith(str, candidate) ⇒ <code>boolean</code>
Tests whether the string begins with a particular substring

**Kind**: static method of <code>[strangler](#module_strangler)</code>

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | input string to test |
| candidate | <code>string</code> | the substring to test |


**Example**
```js
'max'.beginsWith('m'); //return true;
```

<a name="module_strangler.endsWith"></a>
### .endsWith(str, candidate) ⇒ <code>boolean</code>
Tests whether the string ends with a particular substring

**Kind**: static method of <code>[strangler](#module_strangler)</code>

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | input string to test |
| candidate | <code>string</code> | the substring to test |


**Example**
```js
'max'.endsWith('x'); //return true;
```

<a name="module_strangler.splitHonoringQuotes"></a>
### .splitHonoringQuotes(str, [delimiter], [escape], [quotes], [terminator]) ⇒ <code>Array</code>
like String.split(), but it will honor the opening and closing of quotes, so a delimiter inside a quote won't blow it up.

**Kind**: static method of <code>[strangler](#module_strangler)</code>

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>string</code> | | input string to split |
| delimiter | <code>string</code> | ',' | the pattern to split on |
| escape | <code>char</code> | | the character to use as an escape value |
| quotes | <code>Array</code> | ["'", '""'] | the quotes to respect |
| terminator | <code>char</code> | | the character to split groups |


**Example**
```js
'a, b, c="r, u, d", d'.splitHonoringQuotes(',');
```
returns

```js
['a', ' b', ' c="r, u, d"', ' d']
```

<a name="module_strangler.decompose"></a>
### .decompose(str, [delimit], [quotes]) ⇒ <code>Array</code>
like String.split(), but it will honor the opening and closing of quotes, so a delimiter inside a quote won't blow it up, rather than using a fixed delimiter, you can provide a RegExp to split on. Not as fast as `splitHonoringQuotes`, but much more flexible.

**Kind**: static method of <code>[strangler](#module_strangler)</code>

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>string</code> | | input string to split |
| delimiter | <code>RegExp</code> | ',' | the pattern to split on |
| quotes | <code>Array</code> | ["'", '""'] | the quotes to respect |

<a name="module_strangler.multiLineAppend"></a>
### .multiLineAppend(str, appendStr, [joinStr]) ⇒ <code>string</code>
returns the two strings which are appended together in a line by line fashion.

**Kind**: static method of <code>[strangler](#module_strangler)</code>

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| str | <code>string</code> |  | multiline string prefix |
| appendStr | <code>string</code> |  | multiline string suffix |
| joinStr | <code>string</code> |  | the chars to stick between them |

**Example**

```js
var firsts = 'this \
attaches \
the ';
var seconds = 'one \
to \
other'
firsts.multiLineAppend(seconds);
```
returns

```js
'this one\
attaches to\
the other'
```

strangler.StreamDecomposer
--------------------------
<a name="module_strangler.StreamDecomposer"></a>
### .StreamDecomposer([options]) ⇒ <code>Class</code>
This class allows you to parse a large string as and to generate events during parse to prevent storing the results in memory. It is an EventEmitter and will generate `token` events for each token it finds and if `options.terminator` is set it will generate `cell` and `row` events.

**Kind**: constructor of <code>[strangler.StreamDecomposer](#module_strangler.StreamDecomposer)</code>

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options.delimiter | <code>char</code> |  | the character to split individual pieces of data on |
| options.terminator | <code>char</code> |  | the character to split groups of data on |
| options.escape | <code>char</code> |  | the character to escape on |
| options.quotes | <code>Array</code> |  | list of characters to quote with |

<a name="module_strangler.StreamDecomposer.writable"></a>
### .StreamDecomposer.writable ⇒ <code>stream.Writable</code>
Generate a writable stream to pipe a readable stream into in order to parse.

**Kind**: method of <code>[strangler](#module_strangler.StreamDecomposer)</code>

returns [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable)

Testing
-------
just run

    mocha

Enjoy,

-Abbey Hawk Sparrow
