var asynk = require('async');
var util = require("util");
var stream = require('stream');
var cases = {};
module.exports.cases = function(newCases){
    cases = newCases;
};

module.exports.eachCase = function(cb, final){
    asynk.forEachOfSeries(
        Object.keys(cases),
        function(key, index, done){ return cb(cases[key], key, done) },
        final
    );
};

var largestSegment;
var smallestSegment;

module.exports.segments = function(min, max){
        largestSegment = max;
        smallestSegment = min;
};

module.exports.randomSplits = function(str){
    var parts = [];
    var size;
    while(str.length > largestSegment){
        size = Math.floor(
            Math.random() * (largestSegment - smallestSegment)
        )+smallestSegment;
        parts.push(str.substring(0, size));
        str = str.substring(size);
    }
    parts.push(str);
    return parts;
};

module.exports.dummyStream = function(dataList){
    var TestStream = function(){ stream.Readable.call(this) };
    util.inherits(TestStream, stream.Readable);
    TestStream.prototype._read = function (numBytes){
        var stillReading = true;
        var data;
        while(stillReading){
            data = dataList.length?dataList.shift():null;
            stillReading = this.push(data);
            if(!dataList.length) stillReading = false;
        }
    };
    return new TestStream();
};
