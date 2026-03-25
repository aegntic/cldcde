Maplex
======

A multiplexed mapper

I do a huge amount of work just via map/filter/reduce in js, but the one pattern that has never fit cleanly into this pattern is wanting to produce a single map output from many different parallel arrays, asynchronously (and thus, innately yeilding). This does that.

Usage
-----

```js
    import { Maplex } from 'maplex';
    // or
    const { Maplex } = require('maplex');
    Maplex.map(arrayA, ... arrayN, function(itemA, ... itemN){
        //do your work here and store it in finalItem
        return finalItem;
    }, function(result){
        //do something with your mapped value
    });
```

If you omit the completion function the results are not gathered, which is useful in streaming cases.

Testing
-------

Just run `mocha`


Enjoy,

-Abbey Hawk Sparrow
