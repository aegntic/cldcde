var should = require('chai').should();
var Graph = require('../graph');
var fs = require('fs');
var braille = require('ascii-art-braille');

var simple = fs.readFileSync(__dirname+'/data/simpleLineGraph.json');
var multi = fs.readFileSync(__dirname+'/data/multiLineGraph.json');
var binaryGrid = JSON.parse(fs.readFileSync(__dirname+'/data/binaryGrid.json'));
var simpleBraille = fs.readFileSync(__dirname+'/data/simple-braille.ansi').toString();

var seriesA = [
  { value: 2, date: '2019-11-25T01:55:45.000Z' },
  { value: 5, date: '2019-11-25T01:56:45.000Z' },
  { value: 3, date: '2019-11-25T01:58:45.000Z' },
  { value: 11, date: '2019-11-25T01:59:45.000Z' }
];

var seriesB = [
  { value: 10, date: '2019-11-25T01:55:45.000Z' },
  { value: 8, date: '2019-11-25T01:56:45.000Z' },
  { value: 4, date: '2019-11-25T01:58:45.000Z' },
  { value: 6, date: '2019-11-25T01:59:45.000Z' }
];


describe('ascii-art-graph', function(){
    it('renders a small single graph', function(done){
        var graph = new Graph.Timeseries({
            height : 20,
            width : 80,
            node : '@',
            line : '`',
            timeField : 'date',
            valueField : 'value'
        });
        graph.render({
            'timeseries' : seriesA
        }, function(err, result){
            should.not.exist(err);
            should.exist(result);
            result.should.equal(simple.toString());
            done();
        });
    });

    it('renders a small multi-series graph', function(done){
        var graph = new Graph.Timeseries({
            height : 20,
            width : 80,
            node : '@',
            line : '`',
            timeField : 'date',
            valueField : 'value',
            colors : ['red', 'blue']
        });
        graph.render({
            'timeseries-a' : seriesA,
            'timeseries-b' : seriesB
        }, function(err, result){
            should.not.exist(err);
            should.exist(result);
            result.should.equal(multi.toString());
            done();
        });
    });

    it('renders a small single mask', function(done){
        var graph = new Graph.Timeseries({
            height : 20,
            width : 80,
            node : '@',
            line : '`',
            timeField : 'date',
            valueField : 'value'
        });
        graph.mask({
            'timeseries' : seriesA
        }, function(err, result){
            should.not.exist(err);
            should.exist(result);
            result.should.deep.equal(binaryGrid);
            done();
        });
    });

    describe('renders in braille', function(){

        it('characters', function(done){
            // | 1 4 |
            // | 2 5 |
            // | 3 6 |
            // | 7 8 |
            braille.from('1234').should.equal('⡇');
            braille.from('12345678').should.equal('⣿');
            braille.from('').should.equal('⠀');
            braille.from('5678').should.equal('⢸');
            done();
        });

        it('renders a small braille output', function(done){
            var graph = new Graph.Timeseries({
                height : 20,
                width : 80,
                node : '@',
                line : '`',
                timeField : 'date',
                valueField : 'value'
            });
            graph.braille({
                'timeseries' : seriesA
            }, function(err, result){
                should.not.exist(err);
                should.exist(result);
                result.should.equal(simpleBraille);
                done();
            });
        });
    });
});
