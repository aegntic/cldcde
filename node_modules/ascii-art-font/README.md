```
                   _  _                       _
                  (_)(_)                     | |
  __ _  ___   ___  _  _  ______   __ _  _ __ | |_
 / _` |/ __| / __|| || ||______| / _` || '__|| __|
| (_| |\__ \| (__ | || |        | (_| || |   | |_
 \__,_||___/ \___||_||_|         \__,_||_|    \__|
 ```

ascii-art-font.js
=================

[![NPM version](https://img.shields.io/npm/v/ascii-art-table.svg)]()
[![npm](https://img.shields.io/npm/dt/ascii-art-table.svg)]()
[![Travis](https://img.shields.io/travis/khrome/ascii-art-table.svg)]()

This module handles the installation, rendering and management of figlet fonts.

Figlet fonts are an ASCII art font standard, widely used for terminal output.

It looks something like this:

    ______                          _
    |  _  \                        | |
    | | | |  ___  _ __ ___    ___  | |
    | | | | / _ \| '_ ` _ \  / _ \ | |
    | |/ / |  __/| | | | | || (_) ||_|
    |___/   \___||_| |_| |_| \___/ (_)


Installation
------------

    npm install ascii-art-table


Usage
------

<a name="module_ascii_art_font"></a>
### require('ascii-art-font')
To do anything with it, you'll need to include the library:

```javascript
const Font = require('ascii-art-font');
```

* [ascii-art-font](#module_ascii_art_font)
    * [Font.create(string, font, handler)](#module_ascii_art_font.create) ⇒ Promise (if no callback)


<a name="module_ascii_art_font.create"></a>
### Font.create(text, styles, handler)
Map through an ansi string one character at a time, without any of those characters being styles.

**Kind**: static property of <code>[ascii-art-font](#ascii-art-ansi)</code>

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | the string to render in block form |
| styles | <code>string</code> | the styles to apply to all lines |
| callback | <code>function(err, result)</code> | the callback |

**Example**

    To set the directory of the fonts:

        Font.fontPath = 'Fonts';

    Then to render some text:

        Font.create('my text', 'Doom', function(rendered){
            //do stuff here
        });
