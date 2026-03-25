
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([
            'browser-request',
            'dirname-shim',
            '../ansi',
            '../color',
            'maplex'
        ], function(request, shim, a, c){
            a.Figlet.fontPath = 'Fonts/'
            return factory(a, c, maplex, {
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
        module.exports = factory(require('../ansi'), require('../color'), require('maplex'), require('fs'), require('should'));
    } else {
        throw new Error('global testing not supported!');
    }
}(this, function(ansi, color, maplex, fs, should){
    var isNode = typeof module === 'object' && module.exports;

    var parentDir = __dirname.split('/');
    parentDir.pop();
    parentDir = parentDir.join('/');
    var testSuite;

    var coloredHTMLColor = function(c){
        var index = color.ansi256.indexOf(c);
        return index !== -1 ? '\033[38;5;'+index+'m'+c+'\033[0m':'?'+c.substring(1);
    }

    var equalColors = function(a, b, noThrow){
        if(typeof a !== 'string') throw new Error('requires hex string!');
        if(typeof b !== 'string') throw new Error('requires hex string!');
        if(a.toLowerCase() != b.toLowerCase()){
            if(!noThrow) throw new Error(
                'expected '+
                coloredHTMLColor(a.toLowerCase())+
                ' to be '+
                coloredHTMLColor(b.toLowerCase())
            );
            return false;
        }else return true;
    }

    describe('Ascii Art Ansi Codes', function(){
        describe('when used in standard mode', testSuite = function(){

            var text = 'blargh';

            it('encoding mutates the string', function(){
                var rendered = ansi.Codes(text, 'red+blink+inverse');
                rendered.should.not.equal(text); //make sure string has been altered
            });

            it('256 color encoding mutates the string', function(){
                var original = color.is256;
                color.is256 = true;
                var rendered = ansi.Codes(text, '#6633CC');
                rendered.should.equal('\u001b[38;5;86m'+text);
                rendered.should.not.equal(text);
                color.is256 = original;
            });

            it('can strip a ansi string', function(){
                var rendered = ansi.Codes(text, 'red+blink+inverse');
                rendered.should.not.equal(text); //make sure string has been altered
                ansi.strip(rendered).should.equal(text);
            });

            it('substring matches built-in on text string', function(){
                var result = ansi.substring(text, 2, 4);
                result.length.should.equal(2);
                result.should.equal('ar');
            });

            it('substring matches built-in on ansi string', function(){
                var styles =
                    ansi.Codes(text.substring(0,3), 'red+blink+inverse')+
                    ansi.Codes(text.substring(3), 'blue+blink+inverse');
                var result = ansi.substring(styles, 2, 4);
                ansi.length(result).should.equal(2);
                ansi.strip(result).should.equal('ar');
            });

            it('can fetch a specific character in an ascii string', function(){
                ansi.charAt(
                    ansi.Codes(text, 'red+blink+inverse'),
                    4
                ).should.equal(text[4]);
            });

            it('can convert an ansi string to an array', function(){
                ansi.toArray(ansi.Codes(
                    text,
                    'red+blink+inverse'
                )).should.deepEqual(text.split(''));
            });

            it('length is correctly calculated', function(){
                var rendered = ansi.Codes(text, 'red+blink+inverse');
                rendered.length.should.not.equal(text.length);
                ansi.length(rendered).should.equal(text.length);
            });

            it('maps a normal string', function(){
                var rendered = 'SOMETHING';
                var values = rendered.split('');
                var lcv = 0;
                var result = ansi.map(rendered, function(chr, codes, rowcol, pos){
                    pos.should.equal(lcv);
                    chr.should.equal(values[pos]);
                    lcv++;
                    var ret = values[values.length-(pos+1)];
                    return ret;
                });
                result.should.equal(values.reverse().join(''))
                lcv.should.equal(rendered.length);
            });

            it('maps an ansi string', function(){
                var original = 'SOMETHING';
                var rendered = ansi.Codes('SOMETHING', 'red+blink+inverse');
                var values = original.split('');
                var lcv = 0;
                var result = ansi.map(rendered, function(chr, codes, rowcol, pos){
                    pos.should.equal(lcv);
                    chr.should.equal(values[pos]);
                    lcv++;
                    var ret = values[values.length-(pos+1)];
                    return ret;
                });
                result.should.equal(values.reverse().join(''))
                lcv.should.equal(original.length);
            });

            it('intersects 2 text strings', function(done){
                var a = '    THING';
                var b = 'SOME     ';
                var original = 'SOMETHING';
                ansi.intersect(a, b).then(function(intersected){
                    intersected.should.equal(original);
                    done();
                }).catch(function(err){
                    should.not.exist(err);
                });
            });

            it('intersects 2 ansi strings', function(done){
                var a = ansi.Codes('SOME     ', 'blue+blink+inverse');
                var b = ansi.Codes('    THING', 'red+blink+inverse');
                var original = 'SOMETHING';
                ansi.intersect(a, b).then(function(intersected){
                    intersected.should.equal(original);
                    done();
                }).catch(function(err){
                    should.not.exist(err);
                });
            });

            it('interstyle 2 text strings', function(done){
                var a = '    THING';
                var b = 'SOME     ';
                var original = 'SOMETHING';
                ansi.interstyle(a, b).then(function(intersected){
                    intersected.should.equal(original);
                    done();
                }).catch(function(err){
                    should.not.exist(err);
                });
            });

            it.skip('interstyle 2 ansi strings', function(done){
                var a = ansi.Codes('SOME     ', 'blue+blink+inverse');
                var b = ansi.Codes('    THING', 'red+blink+inverse');
                var original = 'SOMETHING';
                ansi.interstyle(a, b, function(err, intersected){
                    console.log(intersected, a, b);
                    should.not.exist(err);
                    intersected.should.not.equal(original);
                    ansi.strip(intersected).should.equal(original);
                    done();
                });
            });

        });

        describe('when used in 256 color mode', function(){
            before(function(){
                color.is256 = true;
            });

            describe('executes the standard testSuite', testSuite);

            after(function(){
                color.is256 = false;
            });
        });
    });

    describe('Ascii Art Ansi Colors', function(){

        it('color encode/decode is symmetric', function(done){
            ['#AC0243'].forEach(function(testColor){
                color.hex(
                    color.channels.web(testColor)
                ).should.equal(testColor.toLowerCase());
            });
            done();
        });

        it('colors match to offsets of their hex in standard', function(done){
            color.standardColors.forEach(function(testColor){
                var offset = testColor.substring(0,6)+(
                    testColor.substring(6,7) === '0'?'1':'e'
                );
                equalColors(testColor, color.for(offset) );
            });
            done();
        });

        it('colors match to offsets of their hex in 256', function(done){
            //color.debug = true;
            color.is256 = true;
            failed = 0;
            color.ansi256.forEach(function(testColor, i){
                var offset = testColor.substring(0,6)+(
                    testColor.substring(6,7) === '0'?'1':'e'
                );
                var eq = equalColors(testColor, color.for(offset), true);
                if(!eq) failed++;
            });
            failed.should.not.be.above(5);
            color.is256 = false;
            done();
        });
    });

    return {};
}));
//*/
