(function (root, factory){
    if(typeof define === 'function' && define.amd){
        // AMD. Register as an anonymous module.
        define(['async'], factory);
    }else if (typeof module === 'object' && module.exports){
        module.exports = factory(require('async'));
    }else{
        // Browser globals (root is window)
        root.Maplex = factory(root.async);
    }
}(this, function(asynk){
    
var ready = function(mappables, cb){
    //todo: support
    //   - collections.js objects
    //   - Async Iteration
    //   - promises to any of the 3 supported
    setTimeout(function(){
        if(cb) cb();
    }, 0);
};
// TODO: rewrite to stream
var Maplex = function(){};

Maplex.convert = function(mappable){
    return mappable;
}

Maplex.map = function(){
    //console.log('INMAP', arguments[0], arguments[1])
    var mappables = Array.prototype.slice.call(arguments);
    var mapFn = mappables.pop();
    var completeFn;
    if(typeof mappables[mappables.length-1] === 'function'){
        completeFn = mapFn;
        mapFn = mappables.pop();
    }
    mappables = mappables.map( this.convert || Maplex.convert );
    //console.log('mappables', mappables);
    mappables = mappables.map( item => new Maplex.Iterable(item) );
    var row;
    var results = [];
    ready(mappables, function(){
        row = [];
        triggers = [];
        var isRowDone = function(row){
            //this can handle out of order insertion
            return row.reduce(
                ((agg, value) => agg + value != null?agg+1:agg), 0
            ) === mappables.length;
        }
        var itemsProxy = new Array(mappables[0].length);
        asynk.eachOf(itemsProxy, function(notForUse, itemIndex, allDone){
            asynk.eachOf(mappables, function(mappable, mappableIndex, done){
                mappable.next(function(item){
                    triggers.push(done);
                    row[mappableIndex] = item;
                    if(isRowDone(row)){
                        row.push(function(){ done() });
                        var result = mapFn.apply({}, row);
                        var dones = triggers;
                        row = [];
                        triggers = [];
                        if(completeFn){
                            results[itemIndex] = result;
                        }
                        dones.forEach( done => done());
                    }
                });
            }, function(){
                allDone();
            });
        }, function(){
            if(completeFn) completeFn(results);
        });
    });
}

Maplex.prototype = {
    convert : Maplex.convert,
    map : Maplex.map
}

Maplex.prototype.constructor = Maplex;

Maplex.Iterable = function(iterable){
    this.iterable = iterable;
    var ob = this;
    this.defaultItem = Maplex.Iterable.defaultItem;
    Object.defineProperty(this, 'length', {
        get: function() {
            return ob.size();
        },
        enumerable: true,
        configurable: true
    });
    this.build();
}

Maplex.Iterable.prototype.ready = function(cb){
    setTimeout(function(){
        cb();
    }, 0);
}

Maplex.Iterable.prototype.build = function(){
    var ob = this;
    asynk.eachOfSeries(this.iterable, function(item, index, done){
        ob.thisItem = item;
        ob.thisIndex = index;
        ob.thisDone = done;
    }, function(){
        this.isDone = true;
    });
}

Maplex.Iterable.prototype.size = function(){
    return this.iterable.length;
}
Maplex.Iterable.prototype.next = function(cb){
    var ob = this;
    var item = this.thisItem;
    var status = this.isDone
    setTimeout(function(){
        cb(status?false:(item)); //return this iteration
    }, 0);
    try{
        this.thisDone(); //trigger iterate
    }catch(ex){ //if it can't iterate deliver an empty char
        item = ob.defaultItem;
    }
}

Maplex.Maplex = Maplex;
return Maplex;

}));
