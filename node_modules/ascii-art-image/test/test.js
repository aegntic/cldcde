/*var should = require("should");
var art = require('../ascii-art');
//art.fontPath
var difference = require('color-difference');
var fs = require('fs');*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([
            'browser-request', 'dirname-shim', '../image', 'color-difference'
        ], function(request, shim, a, difference){
            //console.log(cold);
            a.Figlet.fontPath = 'Fonts/'
            return factory(a, difference, {
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
        module.exports = factory(
            require('../image'),
            require('color-difference'),
            require('fs'),
            require('chai').should()
        );
    } else {
        throw new Error('global testing not supported!');
    }
}(this, function(Image, difference, fs, should){
    var isNode = typeof module === 'object' && module.exports;

    function testImage(options, callback, complete){
        var image = new Image(options);
        var file = options.filepath.split('/').pop().split('.');
        file.pop();
        file = '/images/'+file.join('.')+'.nfo';
        fs.readFile(__dirname+file, function(err, result){
            image.write(function(err, ascii){
                callback(err, ascii, result&&result.toString(), complete);
            });
        });
    }

    function testMask(options, callback, complete){
        var image = new Image(options);
        var file = options.filepath.split('/').pop().split('.');
        file.pop();
        file = '/images/'+file.join('.')+'.json';
        fs.readFile(__dirname+file, function(err, result){
            var compare = JSON.parse(result.toString())
            image.writeMask(function(err, mask){
                callback(err, mask, compare.mask, complete);
            });
        });
    }

    function testArt(options, callback, complete){
        var image = new Image(options);
        var file = options.filepath.split('/').pop().split('.');
        file.pop();
        file = '/images/'+file.join('.')+'.art.nfo';
        fs.readFile(__dirname+file, function(err, result){
            image.writeLineArt(function(err, lineart){
                callback(err, lineart, result, complete);
            });
        });
    }

    function testStipple(options, callback, complete){
        var image = new Image(options);
        var file = options.filepath.split('/').pop().split('.');
        file.pop();
        file = '/images/'+file.join('.')+'.art.nfo';
        fs.readFile(__dirname+file, function(err, result){
            image.writeStipple(function(err, lineart){
                callback(err, lineart, result, complete);
            });
        });
    }

    function testPoster(options, callback, complete){
        var image = new Image(options);
        var file = options.filepath.split('/').pop().split('.');
        file.pop();
        file = '/images/'+file.join('.')+'.poster.nfo';
        fs.readFile(__dirname+file, function(err, result){
            image.writePosterized(function(err, lineart){
                //fs.writeFile(__dirname+file, lineart, function(){ });
                callback(err, lineart, result, complete);
            });
        });
    }

    function imageIsValid(err, ascii, expected, done){
        if(err) console.log(err.stack);
        should.exist(ascii);
        should.exist(expected);
        var asciiLines = ascii.split("\n")
        var expectedLines = expected.split("\n");
        asciiLines.length.should.equal(expectedLines.length);
        //TODO: recapture final values once color fn stabilizes
        /*
        asciiLines.forEach(function(line, index){
            asciiLines[index].length.should(expectedLines[index].length);
        }); //*/
        //if(isNode) ascii.should.equal(expected);
        done();
    }

    function longestLineLength(str){
        return str.split("\n").map(function(str){
            return str.length || 0
        }).reduce(function(a, b){
            return Math.max(a, b)
        })
    }

    var parentDir = __dirname.split('/');
    parentDir.pop();
    parentDir = parentDir.join('/');
    parentDir = parentDir+'/node_modules/ascii-art-docs';

    //*
    describe('AsciiArt', function(){
        describe('can render', function(){

            describe('a Mask with', function(){

                describe('the "average" renderer ', function(){

                    it('from a JPEG with default settings', function(done){
                        this.timeout(5000);
                        testMask({
                            filepath: parentDir+'/Images/mucha-job.jpg',
                            width: 80
                        }, function(err, ascii, expected, done){
                            ascii.should.deep.equal(expected);
                            done();
                        }, done);
                    });
                });

            });

            describe('lineart with', function(){

                describe('the "average" renderer ', function(){

                    it('from a JPEG with default settings', function(done){
                        this.timeout(5000);
                        testStipple({
                            filepath: parentDir+'/Images/mucha-job.jpg',
                            width: 80,
                            threshold : 120
                        }, function(err, ascii, expected, done){
                            ascii.should.deep.equal(expected.toString());
                            done();
                        }, done);
                    });
                });

            });

            describe('a poster image with', function(){

                describe('the "average" renderer ', function(){

                    //needs a new asset generated, output has changed
                    it.skip('from a JPEG with default settings', function(done){
                        this.timeout(5000);
                        testPoster({
                            filepath: parentDir+'/Images/peewee.jpeg',
                            width: 80,
                            posterized: true,
                            stippled: 'black',
                            lineart: 'black',
                            threshold : 60,
                            //stroke:'black+bold',
                            //background : true,
                        }, function(err, ascii, expected, done){
                            ascii.should.deep.equal(expected.toString());
                            //fs.writeFile('./tmp.nfo', ascii, function(){ done() });
                            done();
                        }, done);
                    });
                });

            });

            describe('an Image with', function(){

                describe('the "average" renderer and ', function(){

                    it('is a JPEG with default settings', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/mucha-job.jpg',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn in variant1', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/cernettes.jpg',
                            alphabet:'variant1',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn in variant2', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/gob.jpg',
                            alphabet:'variant2',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn in variant3', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/beyonce-upgrade.jpg',
                            alphabet:'variant3',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn in variant4', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/metropolis.jpg',
                            alphabet:'variant4',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn in blocks', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/grendel.jpg',
                            alphabet:'blocks',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn in greyscale', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/zero-cool.jpg',
                            alphabet:'greyscale',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a GIF drawn in binary', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/gir.gif',
                            alphabet:'binary',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a PNG drawn with defaults', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/seven-proxies.png',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn with defaults', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/peewee.jpeg',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn with defaults', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/animal_muppet.jpg',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn with defaults', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/serious-business.jpg',
                            width: 80
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn in greyscale', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/zero-cool.jpg',
                            width: 80,
                            alphabet:'greyscale'
                        }, imageIsValid, done);
                    });

                    it('is a JPEG drawn with a custom difference algorithm', function(done){
                        this.timeout(5000);
                        testImage({
                            filepath: parentDir+'/Images/rene-cigler.jpg',
                            width: 80,
                            distance: function(r1, g1, b1, r2, g2, b2){
                                return difference.compare(
                                    '#'+r1.toString(16)+g1.toString(16)+b1.toString(16),
                                    '#'+r2.toString(16)+g2.toString(16)+b2.toString(16)
                                );
                            }
                        }, imageIsValid, done);
                    });
                });
            });
        });
    });


    return {};
}));
//*/
