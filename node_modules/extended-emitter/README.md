extended-emitter.js
===================

[![NPM version](https://img.shields.io/npm/v/extended-emitter.svg)](https://www.npmjs.com/package/extended-emitter)
[![npm](https://img.shields.io/npm/dt/extended-emitter.svg)](https://www.npmjs.com/package/extended-emitter)

[//]: # (Old travis link went here, replace with actions based build)

Everything you expect from `require('events').EventEmitter` in both the browser and client, plus:
- `criteria` : use a sift expression to work on a subset of the events
- `.allOff()` : removes all events from this emitter
- `.emitter` : the internal emitter used, in case you need direct access.

import
------
**CommonJS**
```javascript
const { Emitter } = require('extended-emitter');
const emitter = new Emitter();
```
**ES6 imports**
```javascript
import { Emitter } from 'extended-emitter';
const emitter = new Emitter();
```

optional criteria
-----------------
you can now using [mongo-style](https://docs.mongodb.com/manual/reference/operator/query/) queries (supported by [sift](https://www.npmjs.com/package/sift)) to subscribe to specific events (in this context `.once()` means meeting the criteria, not just firing an event of that type).

```javascript
emitter.on('my_object_event', {
    myObjectId : object.id
}, function(){
    //do stuff here
});

// or

emitter.once('my_object_event', {
    myObjectId : object.id,
    myObjectValue : {
    	$gt : 20,
    	$lt : 40
    }
}, function(){
    //do stuff here
});
```

.when()
-------

and there's also the addition of a `when` function which can take ready-style functions, real promises or events, making it easy to delay or wait for a state, without resorting to chaining.

### async
```javascript
await emitter.when([$(document).ready, 'my-init-event', 'my-load-event']);
```

### callbacks
```javascript
emitter.when([$(document).ready, 'my-init-event', 'my-load-event'], function(){
	//do stuff
});
```

.onto()
-------
Often you want an object to implement emitters, and while it's easy enough to wrap them, why not just have that done for you and avoid the boilerplate?

```javascript
emitter.onto(MyClass.prototype);
emitter.onto(MyInstance);
emitter.onto(MyObject);
```

or in the constructor:

```javascript
(new Emitter()).onto(this);
```

Testing
-------

Run the tests at the project root with:

```bash
npm run import-test
npm run require-test
```

Enjoy,

-Abbey Hawk Sparrow
