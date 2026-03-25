var should = require("should");
var util = require("util");
var strangler = require('./strangler');
var stream = require('stream');
var asynk = require('async');
var test = require('./test-utils');

//determines the random chunk sizes that get streamed during the test
test.segments(3, 8);
test.cases({
    simple : {
        text : 'something"not to split" to split',
        ideal : [ 'something"not to split"', 'to', 'split' ]
    },
    twoquotes : {
        text : 'something"not to split" "to split"',
        ideal : [ 'something"not to split"', '"to split"' ]
    },
    twoquoteswithescape : {
        text : 'something"not to\\" split" "to split"',
        ideal : [ 'something"not to\" split"', '"to split"' ]
    },
    unquoted : {
        text : 'something to split',
        ideal : [ 'something', 'to', 'split' ]
    },
    escaped : {
        text : 'something"not to sp\\\"lit" to split',
        ideal : [ 'something"not to sp\"lit"', 'to', 'split' ]
    }
});

describe('strangler', function(){

    describe('endsWith', function(){
        it('detects strings', function(){
            strangler.endsWith('#', '#').should.equal(true);
            strangler.endsWith('#', 'f').should.equal(false);
            strangler.endsWith('sd%2jjke', 'e').should.equal(true);
            strangler.endsWith('sd%2jjke', 'f').should.equal(false);
            strangler.endsWith('sd%2jjke', 'ke').should.equal(true);
            strangler.endsWith('sd%2jjke', 'kf').should.equal(false);
        });
    });

    describe('startsWith', function(){
        it('detects strings', function(){
            strangler.startsWith('#', '#').should.equal(true);
            strangler.startsWith('#', 'f').should.equal(false);
            strangler.startsWith('sd%2jjke', 's').should.equal(true);
            strangler.startsWith('sd%2jjke', 'f').should.equal(false);
            strangler.startsWith('sd%2jjke', 'sd').should.equal(true);
            strangler.startsWith('sd%2jjke', 'sf').should.equal(false);
        });
    });

    describe('startsWithAt', function(){
        it('detects strings', function(){
            strangler.startsWithAt('sd%2jjke', 3, '2').should.equal(true);
            strangler.startsWithAt('sd%2jjke', 3, 'f').should.equal(false);
            strangler.startsWithAt('sd%2jjke', 4, 'jj').should.equal(true);
            strangler.startsWithAt('sd%2jjke', 4, 'jf').should.equal(false);
        });
    });

    describe('multiLineAppend', function(){
        it('connects strings', function(){
            strangler.multiLineAppend(
                "fun\nthe", "in\nsun", ' '
            ).should.equal(
                "fun in\nthe sun"
            );
        });
    });

    describe('contains', function(){
        it('detects strings', function(){
            strangler.contains('sd%2jjke', '2').should.equal(true);
            strangler.contains('sd%2jjke', 'f').should.equal(false);
            strangler.contains('sd%2jjke', 'jj').should.equal(true);
            strangler.contains('sd%2jjke', 'jf').should.equal(false);
            strangler.contains('sd%2jjke', 'd%2').should.equal(true);
        });
    });

    describe('splitHonoringQuotes', function(){
        describe('splits quoted strings', function(){
            test.eachCase(function(testCase, key, done){
                it('for the '+key+' case', function(){
                    strangler.splitHonoringQuotes(
                        testCase.text, ' ', '\\'
                    ).should.deepEqual(testCase.ideal);
                });
                done();
            });
        });

        describe('terminates in groups', function(){
            test.eachCase(function(testCase, key, done){
                it('for the '+key+' case', function(){
                    strangler.splitHonoringQuotes(
                        testCase.text+"\n"+testCase.text, ' ', '\\', ["'", '"'], "\n"
                    ).should.deepEqual([testCase.ideal, testCase.ideal]);
                });
                done();
            });
        });
    });

    /*describe('decompose', function(){
        describe('splits quoted strings', function(){
            eachCase(function(testCase, key, done){
                it('for the '+key+' case', function(){
                    strangler.decompose(
                        testCase.text, ' ', '\\'
                    ).should.deepEqual(testCase.ideal);
                });
                done();
            });
        });
    });*/

    describe('StreamDecomposer', function(){
        describe('correctly processes a stream of data', function(){
            test.eachCase(function(testCase, key, done){
                var decomposer = new strangler.StreamDecomposer({
                    delimiter : ' ',
                    terminator : "\n",
                    escape : '\\'
                });
                it('for the '+key+' case', function(complete){
                    var tokens = [];
                    decomposer.on('token', function(token){
                        tokens.push(token);
                    });
                    decomposer.on('complete', function(parsed){
                        tokens.should.deepEqual(testCase.ideal);
                        complete();
                    });
                    test.dummyStream(
                        test.randomSplits(testCase.text)
                    ).pipe(decomposer.writer());
                });
                done();
            });
        });

        describe('correctly processes groups', function(){
            test.eachCase(function(testCase, key, done){
                var decomposer = new strangler.StreamDecomposer({
                    delimiter : ' ',
                    terminator : "\n",
                    escape : '\\'
                });
                it('for the '+key+' case', function(complete){
                    var tokens = [];
                    decomposer.on('row', function(row){
                        tokens.push(row.data);
                    });
                    decomposer.on('complete', function(parsed){
                        tokens.should.deepEqual([testCase.ideal, testCase.ideal]);
                        complete();
                    });
                    test.dummyStream(
                        test.randomSplits(testCase.text+"\n"+testCase.text)
                    ).pipe(decomposer.writer());
                });
                done();
            });
        });
    });

    describe('proto', function(){
        it('attaches to the string primitive', function(){
            strangler.proto();
            var str = 'anything';
            should.exist(str.contains);
            should.exist(str.endsWith);
            should.exist(str.startsWith);
            should.exist(str.startsWithAt);
            should.exist(str.splitHonoringQuotes);
            should.exist(str.multiLineAppend);
        });
    });

});
