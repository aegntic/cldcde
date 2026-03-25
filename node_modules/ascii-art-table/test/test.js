(function (root, factory){
    if (typeof define === 'function' && define.amd){
        // AMD. Register as an anonymous module.
        define([
            'browser-request',
            'dirname-shim',
            '../table'
        ], function(request, shim, a){
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
    }else if (typeof module === 'object' && module.exports){
        module.exports = factory(
            require('../table'),
            require('fs'),
            require('should')
        );
    }else{
        throw new Error('global testing not supported!');
    }
}(this, function (table, fs, should) {
    var isNode = typeof module === 'object' && module.exports;

    function longestLineLength(str){
        return str.split("\n").map(function(str){
            return str.length || 0
        }).reduce(function(a, b){
            return Math.max(a, b)
        })
    }

    var tableData = [
        { a : 'a', b : 'b', c : 'c', d : 'd' },
        { a : 'e', b : 'f', c : 'g', d : 'h' },
        { a : 'i', b : 'j', c : 'k', d : 'l' },
        { a : 'm', b : 'n', c : 'o', d : 'p' },
        { a : 'q', b : 'r', c : 's', d : 't' }
    ];

    describe('AsciiArtTable', function(){
        describe('can render', function(){
            describe('a table', function(){
                it('with data', function(done){
                    table.create({
                        columns : ['a', 'b', 'c', 'd'],
                        data : tableData
                    }, function(rendered){
                        var sample =
                            "+-+-+-+-+"+"\n"+
                            "|a|b|c|d|"+"\n"+
                            "+-+-+-+-+"+"\n"+
                            "|a|b|c|d|"+"\n"+
                            "|e|f|g|h|"+"\n"+
                            "|i|j|k|l|"+"\n"+
                            "|m|n|o|p|"+"\n"+
                            "|q|r|s|t|"+"\n"+
                            "+-+-+-+-+"+"\n";
                        rendered.should.equal(sample);
                        done();
                    });
                });

                it('using headers', function(done){
                    table.create({
                        width : 80,
                        includeHeader: true,
                        data : [ {something : '1', another:'2', athird:'2'} ]
                    }, function(rendered){
                        longestLineLength(rendered).should.equal(26);
                        done();
                    });
                });

                it('using headers and justification', function(done){
                    table.create({
                        width : 80,
                        includeHeader: true,
                        justify: true,
                        data : [ {something : '1', another:'2', athird:'2'} ]
                    }, function(rendered){
                        longestLineLength(rendered).should.equal(80);
                        done();
                    });
                });

                it('using table styles', function(done){
                    table.create({
                        width : 80,
                        data : tableData,
                        bars : 'double',
                        headerStyle : 'yellow',
                        dataStyle : 'bright_white',
                        borderColor : 'gray'
                    }, function(rendered){
                        rendered.should.equal(
                            ("[90m╔═[90m╦═[90m╦═[90m╦═[90m╗[0m"+"\n"+
                            "[90m║[0m[33ma[0m[90m║[0m[33mb[0m[90m║"+
                            "[0m[33mc[0m[90m║[0m[33md[0m[90m║[0m"+"\n"+
                            "[90m╠═[90m╬═[90m╬═[90m╬═[90m╣[0m"+"\n"+
                            "[90m║[0m[97ma[0m[90m║[0m[97mb[0m"+
                            "[90m║[0m[97mc[0m[90m║[0m[97md[0m[90m║[0m"+"\n"+
                            "[90m║[0m[97me[0m[90m║[0m[97mf[0m"+
                            "[90m║[0m[97mg[0m[90m║[0m[97mh[0m[90m║[0m"+"\n"+
                            "[90m║[0m[97mi[0m[90m║[0m[97mj[0m"+
                            "[90m║[0m[97mk[0m[90m║[0m[97ml[0m[90m║[0m"+"\n"+
                            "[90m║[0m[97mm[0m[90m║[0m[97mn[0m"+
                            "[90m║[0m[97mo[0m[90m║[0m[97mp[0m[90m║[0m"+"\n"+
                            "[90m║[0m[97mq[0m[90m║[0m[97mr[0m"+
                            "[90m║[0m[97ms[0m[90m║[0m[97mt[0m[90m║[0m"+"\n"+
                            "[90m╚═[90m╩═[90m╩═[90m╩═[90m╝[0m"+"\n")
                        )
                        done();
                    });
                });

            });

        });
    });


    return {};
}));
//*/
