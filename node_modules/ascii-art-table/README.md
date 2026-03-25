                       _  _                       _
                      (_)(_)                     | |
      __ _  ___   ___  _  _  ______   __ _  _ __ | |_
     / _` |/ __| / __|| || ||______| / _` || '__|| __|
    | (_| |\__ \| (__ | || |        | (_| || |   | |_
     \__,_||___/ \___||_||_|         \__,_||_|    \__|

ascii-art-table.js
=================

[![NPM version](https://img.shields.io/npm/v/ascii-art-table.svg)]()
[![npm](https://img.shields.io/npm/dt/ascii-art-table.svg)]()
[![Travis](https://img.shields.io/travis/khrome/ascii-art-table.svg)]()

This module allows you to work with ansi strings in a style aware way, so you aren't constantly doing string manipulation and scanning when working with terminal strings. It offers a clean abstraction to build ascii-art utilities on top of.


Installation
------------

    npm install ascii-art-table


Usage
------

<a name="module_ascii_art_table"></a>
### require('ascii-art-table')
To do anything with it, you'll need to include the library:

```javascript
    const Table = require('ascii-art-table');
```

* [ascii-art-table](#module_ascii_art_table)
    * [Table.create(string, handler)](#module_ascii_art_table.create) ⇒ <code>string</code>
    * [new Table(options)](#module_ascii_art_table.constructor) ⇒ <code>string</code>
        * [.addRow(data)](#module_ascii_art_table.addrow) ⇒ <code>string</code>
        * [.setHeading(column1, ..., columnN)](#module_ascii_art_table.addcolumn) ⇒ <code>string</code>
        * [.addColumn(data)](#module_ascii_art_table.addcolumn) ⇒ <code>string</code>
        * [.write(width)](#module_ascii_art_table.write) ⇒ <code>string</code>

<a name="module_ascii_art_table.create"></a>
### Table.create(ansiString, handler)
Map through an ansi string one character at a time, without any of those characters being styles.
**Kind**: static property of <code>[ascii-art-table](#module_ascii_art_table)</code>

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | input string to map across |
| options.data | <code>Array of Arrays</code> | data to display |
| options.columns | <code>Array of Objects</code> | column configurations |
| options.bars | <code>String</code> | type: `single`, `double`, `block`, `angles` |

**Example**

We can produce ASCII/ANSI tables in a similar manner to [ascii-table](https://www.npmjs.com/package/ascii-table), but with colors and styles!

To produce a standard box style (and it will attempt to be smart about column widths **without** truncating ansi codes):
```js
        Table.create({
            width : 80,
            data : [ /* ... */ ]
        }, function(rendered){
            // use rendered text
        });
```
![Table Example](http://patternweaver.com/Github/Ascii/docs/ascii_table.png)

If you add some additional options you get:
```js
        Table.create({
            width : 80,
            data : [ /* ... */ ],
            verticalBar : ' ',
            horizontalBar : ' ',
            intersection : ' ',
            columns : [
                {
                    value : 'Product',
                    style : 'black+gray_bg'
                }, {
                    value : 'Maker',
                    style : 'white'
                }, {
                    value : 'Location',
                    style : 'white'
                }
            ]
        }, function(rendered){
            // use rendered text
        });
```
which will output:

![Styled Table Example](http://patternweaver.com/Github/Ascii/docs/ansi_table.png)

You can also play with border colorings and built-in borders (`single`, `double`, `block` and `angles`) using the UTF box drawing characters
```js
    Table.create({
        width : 80,
        data : [ /* ... */ ],
        bars : 'single',
        borderColor : 'bright_white'
    }, function(rendered){
        // use rendered text
    });
```
which will output:

![Styled Table Example](http://patternweaver.com/Github/Ascii/docs/single_table.png)

To define this manually it would look like:
```js
    Table.create({
        width : 80,
        data : [ /* ... */ ],
        bars : {
            'ul_corner' : '┏',
            'ur_corner' : '┓',
            'lr_corner' : '┛',
            'll_corner' : '┗',
            'bottom_t' : '┻',
            'top_t' : '┳',
            'right_t' : '┫',
            'left_t' : '┣',
            'intersection' : '╋',
            'vertical' : '┃',
            'horizontal' : '━',
        },
        borderColor : 'bright_white',
    }, function(rendered){
        // use rendered text
    });
```
Another example:

```js
    Table.create({
        width : 80,
        data : [ /* ... */ ],
        bars : 'double',
        headerStyle : 'yellow',
        dataStyle : 'bright_white',
        borderColor : 'gray'
    }, function(rendered){
        // use rendered text
    });
```
which will output:

![Styled Table Example](http://patternweaver.com/Github/Ascii/docs/double_table.png)
