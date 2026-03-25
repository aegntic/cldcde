/*var should = require("should");
var art = require('../ascii-art');
//art.fontPath
var difference = require('color-difference');
var fs = require('fs');*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['browser-request', 'dirname-shim', '../font', 'chai'], function(request, shim, a){
            //console.log(cold);
            a.Figlet.fontPath = 'Fonts/'
            return factory(a, {
                readFile : function(filename, cb){
                    request({
                        url: filename
                    }, function(err, req, data){
                        if(err) return cb(err);
                        else cb(undefined, data);
                    })
                }
            }, should);
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('../font'), require('fs'), require('chai'));
    } else {
        throw new Error('global testing not supported!');
    }
}(this, function (font, fs, chai) {
    var should = chai.should();
    var isNode = typeof module === 'object' && module.exports;


    describe('AsciiArtFont', function(){
        describe('can render', function(){
            it('a Figlet font', function(done){
                font.create('blargh', 'Doom', function(err, rendered){
                    var sample =
                    " _      _                      _     "+"\n"+
                    "| |    | |                    | |    "+"\n"+
                    "| |__  | |  __ _  _ __   __ _ | |__  "+"\n"+
                    "| '_ \\ | | / _` || '__| / _` || '_ \\ "+"\n"+
                    "| |_) || || (_| || |   | (_| || | | |"+"\n"+
                    "|_.__/ |_| \\__,_||_|    \\__, ||_| |_|"+"\n"+
                    "                         __/ |       "+"\n"+
                    "                        |___/        "+"\n";
                    should.not.exist(err);
                    should.exist(rendered);
                    rendered.should.equal(sample);
                    done();
                });
            });
        });
    });


    return {};
}));
//*/
