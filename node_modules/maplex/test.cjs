var should = require("chai").should();
var Maplex = require('./maplex.cjs');

describe('Maplex', function(){
    describe('should map over simple arrays', function(){
        var arr1 = [1, 2, 3];
        var arr2 = [4, 5, 6];
        var arr3 = [7, 8, 9];

        it('in pairs', function(done){
            Maplex.map(arr1, arr2, function(item1, item2){
                return item1 + item2;
            }, function(mapped){
                should.exist(mapped);
                mapped.length.should.equal(3);
                should.exist(mapped[0]);
                mapped[0].should.equal(5);
                should.exist(mapped[1]);
                mapped[1].should.equal(7);
                should.exist(mapped[2]);
                mapped[2].should.equal(9);
                done();
            })
        });

        it('in threes', function(done){
            Maplex.map(arr1, arr2, arr3, function(item1, item2, item3){
                return item1 + item2 + item3;
            }, function(mapped){
                should.exist(mapped);
                mapped.length.should.equal(3);
                should.exist(mapped[0]);
                mapped[0].should.equal(12);
                should.exist(mapped[1]);
                mapped[1].should.equal(15);
                should.exist(mapped[2]);
                mapped[2].should.equal(18);
                done();
            })
        });

    });
});
