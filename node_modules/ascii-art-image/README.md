```
                   _  _                       _
                  (_)(_)                     | |
  __ _  ___   ___  _  _  ______   __ _  _ __ | |_
 / _` |/ __| / __|| || ||______| / _` || '__|| __|
| (_| |\__ \| (__ | || |        | (_| || |   | |_
 \__,_||___/ \___||_||_|         \__,_||_|    \__|
```

ascii-art-image.js
==================

[![NPM version](https://img.shields.io/npm/v/ascii-art-image.svg)]()
[![npm](https://img.shields.io/npm/dt/ascii-art-image.svg)]()
[![Travis](https://img.shields.io/travis/khrome/ascii-art-image.svg)]()


Installation
------------

npm install ascii-art-image


Usage
------

<a name="module_ascii_art_image_top"></a>
### require('ascii-art-image')
To do anything with it, you'll need to include the library:

```javascript
const Image = require('ascii-art-image');
```

* [ascii-art-image](#module_ascii_art_image) ⇒ <code>AsciiArtImage</code>
* [Image.create(ansi_string, handler)](#module_ascii_art_image.create) ⇒ <code>Promise</code>(If callback not provided)


<a name="module_ascii_art_image"></a>
### new Image(options)
the constructor takes an options argument

**Kind**: static property of <code>[ascii-art-image](#ascii-art-image)</code>

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | the set of options being passed |
| options.alphabet | <code>string</code> | characters used to draw the image. One of: `variant1`, `variant2`, `variant3`, `variant4`, `ultra-wide`, `wide`, `hatching`, `bits`, `binary`, `greyscale`, `blocks` |
| options.filepath | <code>string</code> | The path of the image |
| options.width | <code>Int</code> | The width to render the image |
| options.height | <code>Int</code> | The height to render the image |
| options.distance | <code>function</code> | a function which takes in 6 args (2x rgb) and returns a measure of distance between these two colors |

**Examples**


<a name="module_ascii_art_image.create"></a>
### Image.create(options, callback)
Map through an ansi string one character at a time, without any of those characters being styles.

**Kind**: static property of <code>[ascii-art-image](#ascii-art-image)</code>

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | the set of options being passed |
| options.alphabet | <code>string</code> | characters used to draw the image. One of: `variant1`, `variant2`, `variant3`, `variant4`, `ultra-wide`, `wide`, `hatching`, `bits`, `binary`, `greyscale`, `blocks` |
| options.filepath | <code>string</code> | The path of the image |
| options.width | <code>Int</code> | The width to render the image |
| options.height | <code>Int</code> | The height to render the image |
| options.distance | <code>function</code> | a function which takes in 6 args (2x rgb) and returns a measure of distance between these two colors |

**Examples**

for example, say we want to generate a copy of a metropolis poster:

![Image Output](http://patternweaver.com/Github/Ascii/docs/metropolis.jpg)

You just need to do something like this:

```js
var Image = require('ascii-art-image');

var image = new Image({
    filepath: '~/Images/metropolis.jpg',
    alphabet:'variant4'
});

image.write(function(err, rendered){
    console.log(rendered);
})
```

![Image Output](http://patternweaver.com/Github/Ascii/docs/metropolis.png)
