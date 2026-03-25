(function (root, factory){
    if(typeof define === 'function' && define.amd){
        // AMD. Register as an anonymous module.
        define([
            'ascii-art-ansi',
            'ascii-art-braille',
            'd3',
            'json2csv',
            'async-arrays',
            'ascii-art-ansi/grid'
        ], factory);
    }else if (typeof module === 'object' && module.exports){
        module.exports = factory(
            require('ascii-art-ansi'),
            require('ascii-art-braille'),
            require('d3'),
            require('json2csv'),
            require('async-arrays'),
            require('ascii-art-ansi/grid')
        );
    }else{
        // Browser globals (root is window)
        root.AsciiArtGraph = factory(
            root.AsciiArtAnsi,
            root.AsciiArtBraille,
            root.d3,
            root.json2csv,
            root.AsyncArrays,
            root.AsciiArtAnsiGrid
        );
    }
}(this, function(ansi, braille, d3, j2c, arrays, Grid){
    var toCSV = j2c && j2c.parse;

    var ObjectMap = function(obj, mapFn){
        var mapped = {};
        Object.keys(obj).forEach(function(key, index){
            mapped[key] = mapFn(obj[key], key, index);
        });
        return mapped;
    };

    var circles = {};
    circles.solidColors = {
        'white+9px' : '⚪', 'white+10px' : '⚪',
        'black+9px' : '⚫', 'black+10px' : '⚫',
        'red+9px' : '🔴', 'red+10px' : '🔴',
        'blue+9px' : '🔵', 'blue+10px' : '🔵',
        'orange+9px' : '🟠', 'orange+10px' : '🟠',
        'yellow+9px' : '🟡', 'yellow+10px' : '🟡',
        'green+9px' : '🟢', 'green+10px' : '🟢',
        'purple+9px' : '🟣', 'purple+10px' : '🟣',
        'brown+9px' : '🟤', 'brown+10px' : '🟤',
    };
    circles.solid = {
        '1px' : '.',
        '2px' : '.',
        '3px' : '.',
        '4px' : '•',
        '5px' : '•',
        '6px' : '●',
        '7px' : '●',
        '8px' : '⬤',
        '9px' : '⬤',
        '10px' : '⬤'
    };
    circles.outline = {
        '1px' : '𛲅',
        '2px' : '𛲅',
        '3px' : '𛲅',
        '4px' : '𐩒',
        '5px' : '𐩒',
        '6px' : '◯',
        '7px' : '◯',
        '8px' : '⭘',
        '9px' : '⭘',
        '10px' : '⭘'
        };
    circles.makeCircle = function(size, color, isFilled){
        var chr = 'O';
        if(isFilled){
            if(circles.solidColors[color+'+'+size])
                chr = circles.solidColors[color+'+'+size];
            else
                chr = circles.solid[size];

        }else{
            chr = circles.outline[size];
        }
        return ansi.codes(chr, color, true);
    }

    var Axes = function(options){
        this.options = options || {};
    }

    Axes.prototype.render = function(series, cb){
        var options = this.options;
        var height = options. height || 40;
        var width = options.width || 80;
        var minX = options.xLabelWidth || 10;
        var minY = options.yLabelWidth || 10;

    };

    var Timeseries = function(options){
        if(!options.node) options.node = '*';
        if(!options.line) options.line = '`';
        if(!options.d3Conversion) options.d3Conversion = function(history){
            var allHistory = Object.keys(history).reduce(function(agg, key){
                return agg.concat(history[key]);
            }, [])
            var flatData = toCSV(allHistory, {
                flatten: true,
            });
            return flatData;
        }
        this.options = options || {};
    }

    Timeseries.prototype.mask = function(series, cb){
        this.render(series, function(err, results, grid){
            cb(undefined, grid.map(function(row){
                return row.map(function(chr){
                    return (chr === ' ')?false:true;
                });
            }));
        })
    }

    Timeseries.prototype.braille = function(series, cb){
        var ob = this;
        var originalHeight = this.options.height;
        this.options.height = this.options.height * 4
        var originalWidth = this.options.width;
        this.options.width = this.options.width * 2;
        this.mask(series, function(err, mask){
            ob.options.height = originalHeight;
            ob.options.width = originalWidth;
            if(err) return cb(err);
            var result = braille.binary2DMapToBraille(mask);
            cb(undefined, result.map(function(line){
                return line.join('')
            }).join("\n"), result);
        })
    }

    Timeseries.prototype.render = function(series, cb){
        //todo: support arg overrides in render
        var options = this.options;
        var height = options. height || 40;
        var width = options.width || 100;
        var series;
        var xParse = options.xParse || d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ");
        var yParse = options.yParse || function(i){return i};
        var flattened = Object.assign(
            (d3.csvParse(options.d3Conversion(series), d3.autoType)).map(
                function(item){
                    return {
                        date: item[options.timeField || 'date'],
                        value: item[options.valueField || 'value']
                    }
                }
            ),
            {y: "$ Close"}
        );
        var x = d3.scaleUtc().domain(d3.extent(flattened, function(d){
                return d['date'];
            })).range([0, width]);
        var y = d3.scaleLinear()
            .domain([0, d3.max(flattened, function(d){
                return d['value']
            })]).nice()
            .range([0, height]);
        var grid = [];
        for(var h = height; h >= 0; h--){
            if(!grid[h]) grid[h] = [];
            for(var w = 0; w < width; w++){
                grid[h][w] = options.space || ' ';
            }
        }
        ObjectMap(series, function(data, key, index){
            var moments = data.map(function(item){
                var res = Math.floor(x(xParse(item[options.timeField || 'date'])));
                if(Number.isNaN(res)) throw new Error('x projection not real');
                return res;
            });
            var values = data.map(function(item){
                return Math.floor(y(yParse(item[options.valueField || 'value'])));
            });
            var previous;
            var previousValue;
            var first = moments[0];
            var inflections = moments.map(function(moment){
                return Math.floor(moment) - first;
            });
            var color = (options.colors && options.colors[index % options.colors.length]);
            var value;
            inflections.forEach(function(inflection, index){
                value = Math.floor(values[index])
                grid[value][inflection] = color?
                    ansi.codes(options.node, color, true):
                    options.node;
                var dx = (inflection - previous);
                var dy = (value - previousValue);
                var dd = dy/dx;
                if(previous !== undefined){
                    var can
                    for(var x=previous+1; x < inflection; x++){
                        can = previousValue + Math.floor((x - previous) * dd);
                        grid[can][x] = color?
                            ansi.codes(options.line, color, true):
                            options.line;
                    }
                }
                previousValue = value;
                previous = inflection
            });
        });
        if(cb) cb(undefined, grid.reverse().map(function(chars){
            return ' '+chars.join("")
        }).join("\n "), grid);
    }

    var Graph = {};
    Graph.Timeseries = Timeseries;
    Graph.Axes = Axes;
    Graph.NewTimeseries = function(){

    };
    var converters = {};
    var getNum = function(value){
        var num = '';
        try{
            num = parseFloat(value);
        }catch(ex){
            try{
                num = parseInt(value);
            }catch(ex){}
        }
        return num;
    }
    var getUnits = function(value, num){
        return typeof value === 'string'?
            value.substring(num.toString().length):
            '';
    }
    var screenWidth;
    var screenHeight;
    var terminalWidth;
    var terminalHeight;
    var unitsToChars = function(value, char, options, set){
        var num = getNum(value);
        var units = getUnits(value, num);
        if(!num) num = 0;
        if(!converters[units]) converters[units] = {};
        if(set){
            if(char === 'x'){
                screenWidth = num;
            }
            if(char === 'y'){
                screenHeight = num;
            }
            converters[units][char] = function(thisValue){
                var thisNum = getNum(thisValue);
                var thisUnits = getUnits(thisValue, thisNum);
                if(!thisNum) thisNum = 0;
                if(thisUnits && thisUnits !== units) console.warn(
                    'unit mismatch: '+thisUnits+' !== '+units
                );
                if(char === 'x'){
                    return Math.floor((thisNum) * ((options.cols || 80)/(num || 1)))
                }
                if(char === 'y'){
                    return Math.floor((thisNum) * ((options.rows || 60)/(num || 1)))
                }
                return thisNum;
            };
        }
        return converters[units][char](num);
    }
    Graph.NewTimeseries.prototype.render = function(series, opts, callback){
        var cb = typeof opts === 'function'?opts:callback;
        var options = typeof opts === 'function'?{}:opts;
        var data = series;
        var d3 = Graph.d3();
        var colors = options.colors || ['red', 'yellow', 'blue', 'green'];

        var width = unitsToChars(options.width, 'x', opts, true);
        var height = unitsToChars(options.height, 'y', opts, true);
        if(options.cols) terminalWidth = options.cols;
        if(options.rows) terminalHeight = options.rows;

        var allData = [];
        Object.keys(series).forEach(function(seriesName){
            series[seriesName].forEach(function(d){
                allData.push(d);
                d.date = new Date(d.date);
                d.value = d.complete;
            });
        });

        var x = d3.scaleTime()
            .range([0, width])
            .domain(d3.extent(allData, function(d){ return d.date; }));

        var y = d3.scaleLinear()
            .range([height, 0])
            .domain(d3.extent(allData, function(d) { return d.value; }));
        var xd = x.domain();
        var diff = xd[1].getTime()-xd[0].getTime();
        var domf = d3.timeFormat("%m-%d");
        var todf = d3.timeFormat("%d %H‥%M")

        var xAxis = d3.terminal.axis()
            .scale(x, y)
        	.tickFormat(function(date){
                if(diff > 1000 * 60 * 60 * 24){
                    return domf(date);
                }else{
                    return todf(date);
                }
            })
        	//makes the xAxis ticks a little longer than the xMinorAxis ticks
            .tickSize(10)
            .orient("bottom");

        var yAxis = d3.terminal.axis()
            .scale(y, x)
            .orient("left");

        var line = d3.terminal.line()
            .x(function(d){ return Math.floor(x(d.date)) })
            .y(function(d){ return Math.floor(y(d.value)) });
        var marker = d3.terminal.circle()
            .x(function(d){ return Math.floor(x(d.date)) })
            .y(function(d){ return Math.floor(y(d.value)) });

        var svg = d3.select("::screen::")
            .attr("width", width + (options.margin?(
                (options.margin.left || 0) + (options.margin.right || 0)
            ):0))
            .attr("height", height +(options.margin?(
                (options.margin.top || 0) + (options.margin.bottom || 0)
            ):0));
        /*var parseDate = d3.time.format("%Y-%m-%d %X");
        var formatTime = d3.time.format("%e %b %-I:%M %p");
        var formatCount = d3.format(",");*/

        //*
        svg.append("g")
            .attr("class", "x axis")
            .attr("height", 10)
            .call(xAxis)
        //*/
        //*
        svg.append("g")
            .attr("class", "y axis")
            .attr("width", 20)
            .call(yAxis)
        //*/

        Object.keys(series).forEach(function(seriesName, i){
            var data = series[seriesName];
            svg.append("path")
                .datum(data)
                .attr("class", "line")
                .attr('color', colors[i%colors.length])
                .attr("d", line);

            svg.append("circle")
                .datum(data)
                .attr("class", "circle")
                .attr('r', 5)
                .attr('color', colors[i%colors.length])
                .call(marker);
        });

        svg.render(function(err, rendered){
            if(err) console.log('ERR', err);
            callback(null, rendered);
        })

    };

    var newGrid = function(w, h, returnAsString, char){
        //support AR
        var width = w || terminalWidth || screenWidth;
        var height = h || terminalHeight || screenHeight;
        var grid = [];
        for(var h = height; h >= 0; h--){
            if(!grid[h]) grid[h] = [];
            for(var w = 0; w < width; w++){
                grid[h][w] = char || ' ';
            }
        }
        var result;
        if(returnAsString){
            result = grid.reduce(function(rows, row){
                rows.push(row.join(''));
                return rows;
            }, []).join("\n");
            return result;
        } else return grid;
    }
    var asyncComposite = function(renderables, fn, incomingGrid){
        try{
            var rendered = incomingGrid;
            arrays.forEachEmission(renderables, function(el, index, done){
                try{
                    el.render(function(err, result){
                        if(err) throw err;
                        try{
                            if(!rendered){
                                rendered = new Grid(result);
                            }else{
                                if(!incomingGrid){
                                    rendered.drawOnto(result, 0, 0, true);
                                } //else draw directly rendered into grid
                            }
                        }catch(ex){
                            console.log(ex)
                        }
                        done();
                    }, incomingGrid);
                }catch(ex){
                    fn(ex, rendered?rendered.toString():'')
                }
            }, function(){
                fn(null, rendered?rendered.toString():'')
            });
        }catch(ex){
            fn(ex);
        }
    };

    var initD3Object = function(type, ob){
        ob.offsets = {
            top : 0,
            bottom : 0,
            left : 0,
            right : 0
        }
        ob.type = type;
        ob.attrs = {};
    }

    var d3Group = function(group){
        initD3Object('g', this);
        this.group = group || []
    }
    d3Group.prototype.append = function(type){
        var el = new d3Element(type);
        el.parent = this.parent || this;
        this.add(el);
        return el;
    }
    d3Group.prototype.selectAll = function(type){
        var newGroup = new d3Group();
        newGroup.parent = this.parent;
        //newGroup.screen = this.screen;
        var ob = this;
        this.group.forEach(function(el){
            var newEl = el.append(type);
            newGroup.add(newEl);
            newEl.parent = ob;
        });
        return newGroup;
    }
    d3Group.prototype.attr = function(key, value){
        this.attrs[key] = value;
        this.group.forEach(function(el){
            el.attr(key, value);
        });
        return this;
    }
    d3Group.prototype.offset = function(type){
        var can = this;
        var result = this.offsets[type];
        while(can && can.parent !== undefined){
            can = can.parent;
            result += can.offsets[type];
        }
        return result;
    }
    d3Group.prototype.root = function(){
        var can = this;
        while(can && can.parent !== undefined){
            can = can.parent;
        }
        return can;
    }
    d3Group.prototype.call = function(callable){
        if(this.group) this.group.forEach(function(el){
            el.call(callable);
        });
        if(callable.callable) callable.callable(this);
        return this;
    }
    d3Group.prototype.dimensions = function(gn, dn, am){
        var groups = {};
        var dimensions = {};
        try{
            var ob = this;
            var groupNames = gn || ['center', 'left', 'right', 'top', 'bottom'];
            var defaultName = dn || 'center';
            var associationMap = am || {
                'left': 'width',
                'right':'width',
                'top':'height',
                'bottom':'height',
                'center' : function(groups, results){
                    results.width = ob.width()-results.left-results.right;
                    results.height = ob.height()-results.top-results.bottom;
                }
            };
            Object.keys(associationMap).forEach(function(key){
                if(typeof associationMap[key] !== 'function'){
                    var value = associationMap[key];
                    associationMap[key] = function(groups, results){
                        results[key] = groups[key].length?
                            Math.max.apply({}, groups[key].map(function(item){
                                return item.attrs[value];
                            })):
                            0;
                    }
                }
            });
            groupNames.forEach(function(groupName){
                groups[groupName] = ob.group.filter(function(item){
                    return item.slot === groupName || (
                        defaultName === groupName && !item.slot
                    );
                });
            });
            Object.keys(associationMap).forEach(function(key){
                associationMap[key](groups, dimensions);
            });

        }catch(ex){
            console.log('Error', ex)
        }
        var results = {
            dimensions: dimensions,
            groups: groups
        };
        return results;
    }
    d3Group.prototype.render = function(fn, incomingGrid){
        var centers = this.group.filter(function(item){
            return item.slot === 'center' || !item.slot;
        });
        var lefts = this.group.filter(function(item){
            return item.slot === 'left';
        });
        var rights = this.group.filter(function(item){
            return item.slot === 'right';
        });
        var tops = this.group.filter(function(item){
            return item.slot === 'top';
        });
        var bottoms = this.group.filter(function(item){
            return item.slot === 'bottom';
        });
        var ob = this;
        var l;
        var r;
        var t;
        var b;
        var w;
        var h;
        try{
            l = lefts.length?Math.max.apply({}, lefts.map(function(item){
                return item.attrs.width;
            })):0;
            r = rights.length?Math.max.apply({}, rights.map(function(item){
                return item.attrs.width;
            })):0;
            t = tops.length?Math.max.apply({}, tops.map(function(item){
                return item.attrs.height;
            })):0;
            b = bottoms.length?Math.max.apply({}, bottoms.map(function(item){
                return item.attrs.height;
            })):0;
            w = this.width()-l-r;
            h = this.height()-t-b;
        }catch(ex){

        }
        //console.log(bottoms);
        //console.log([l, w, r], [t, h, b], this);
        var dest = incomingGrid || new Grid(newGrid(l+r+w, t+b+h, true));
        // do not async hell this block, this *is* optimized
        // if wince when you look at it, if says more about you than the code
        asyncComposite(tops, function(err, top){
            asyncComposite(lefts, function(err, left){
                asyncComposite(rights, function(err, right){
                    asyncComposite(bottoms, function(err, bottom){
                        asyncComposite(centers, function(err, center){
                            dest.drawOnto(top, l, 0, true);
                            dest.drawOnto(bottom, l, t+h+1, true);
                            dest.drawOnto(left, 0, 0, true);
                            dest.drawOnto(right, l+w, t, true);
                            dest.drawOnto(center, l, t, true);
                            fn(err, dest.toString());
                        }, new Grid(newGrid(w, h, true)));
                    }, new Grid(newGrid(w, b, true))); // b
                }, new Grid(newGrid(r, h, true))); // r
            }, new Grid(newGrid(l, h, true))); //l
        }, new Grid(newGrid(w, t, true))); // t
    }
    d3Group.prototype.width = function(){
        return this.root().attrs.width - (this.offset('left') + this.offset('right'));
    }
    d3Group.prototype.height = function(){
        return this.root().attrs.height - (this.offset('top') + this.offset('bottom'));
    }
    d3Group.prototype.datum = function(list){
        this.group.forEach(function(el){
            el.datum(list);
        });
        return this;
    }
    d3Group.prototype.add = function(item, slot){
        item.slot = slot;
        this.group.push(item);
    }

    var d3Element = function(type){
        initD3Object(type, this);
    }
    //copy common fns
    d3Element.prototype.width = d3Group.prototype.width;
    d3Element.prototype.height = d3Group.prototype.height;
    d3Element.prototype.call = d3Group.prototype.call;
    d3Element.prototype.offset = d3Group.prototype.offset;
    d3Element.prototype.root = d3Group.prototype.root;
    d3Element.prototype.attr = function(key, value){
        try{
            this.attrs[key] = value;
            if(key === 'd' && value.callable) value.callable(this)
            if(this.type == 'circle' && key === 'r' ) this.attr('circle-width', (value * 2)+'px');
        }catch(ex){
            console.log(ex);
        }
        return this;
    }
    d3Element.prototype.append = function(){
        //todo
        return this;
    }
    d3Element.prototype.clone = function(path){
        var clone = new d3Element(this.type);
        clone.parent = this.parent;
        clone.attrs = JSON.parse(JSON.stringify(this.attrs));
        clone.offsets = JSON.parse(JSON.stringify(this.offsets));
        //clone.screen = this.screen;
        return clone;
    }
    d3Element.prototype.datum = function(data){
        var ob = this;
        var newGroup = new d3Group();
        var list = [];
        data.forEach(function(item, index){
            var copy = ob.clone();
            //won't work, make this work w/xy
            copy.previousItem = data[index-1];
            copy.item = item;
            copy.nextItem = data[index+1];
            newGroup.add(copy);
            list.push(copy);
        });
        this.internalDataNodes = list;
        return newGroup;
    }

    d3Element.prototype.render = function(fn, incomingGrid){
        //console.log(this);
        if(this.internalDataNodes){
            asyncComposite(this.internalDataNodes, function(err, result){
                fn(err, result);
            }, incomingGrid);
        }else{
            var grid = incomingGrid || (new Grid( newGrid(null, null, true) ));
            var d = this.root().dimensions();
            if(this.type === 'path'){
                if(this.item && this.previousItem){
                    var start = {
                        x : this.translateX(this.previousItem),
                        y : this.translateY(this.previousItem),
                    };
                    var stop = {
                        x : this.translateX(this.item),
                        y : this.translateY(this.item),
                    };
                    var offX = this.offset('left');
                    var offY = this.offset('top');
                    var delta = {};
                    delta.x = stop.x - start.x;
                    delta.y = stop.y - start.y;
                    var steps = Math.max(delta.x, delta.y);
                    var increment = {};
                    increment.x = delta.x/steps;
                    increment.y = delta.y/steps;
                    var x;
                    var y;
                    var color = this.attrs['color'];
                    for(var lcv=0; lcv < steps; lcv++){
                        x = Math.floor(start.x + (lcv*increment.x));
                        y = d.dimensions.height - Math.floor(start.y + (lcv*increment.y));
                        if(grid.data && grid.data[y] && grid.data[y][x+offX]){
                            if(color){
                                grid.data[y][x+offX].chr = ansi.codes('•', color, true);
                            }else{
                                grid.data[y][x+offX].chr = '•';
                            }
                        }
                    }
                }
            }
            if(this.type === 'circle'){
                if(this.item){
                    var d = this.root().dimensions();
                    var pos = {
                        x : this.translateX(this.item),
                        y : d.dimensions.height - this.translateY(this.item),
                    };
                    var offX = this.offset('left');
                    var offY = this.offset('top');
                    var size = this.attrs['circle-width'] || '10px';
                    if(grid.data && grid.data[pos.y] && grid.data[pos.y][pos.x+offX]){
                        var circ = circles.makeCircle(
                            size,
                            (this.attrs['color'] || 'red'),
                            true
                        );
                        grid.data[pos.y][pos.x+offX].chr = circ;
                    }
                }
            }
            setTimeout(function(){
                fn(null, grid.toString());
            }, 0);
        }
    }

    var d3Screen = function(){
        d3Group.apply(this, arguments);
        this.type = 'screen';
    }
    Object.keys(d3Group.prototype).forEach(function(key){
        d3Screen.prototype[key] = d3Group.prototype[key];
    })
    var theScreengleton = new d3Screen();
    var els = {};
    //experimental d3 compatability
    Graph.d3 = function(context){
        var els = {};
        return {
            d3:d3,
            select : function(selector){
                if(
                    Graph.retargetToScreen ||
                    (selector.toLowerCase() === '::screen::')
                ) return theScreengleton;
                else context.querySelectAll(selector);
            },
            scaleTime : d3.scaleTime,
            scaleLinear : d3.scaleLinear,
            format : d3.format,
            timeFormat : d3.timeFormat,
            extent : d3.extent,
            parseDate : (d3.parseDate || d3.utcParse),
            time :{
                hours : 'hours',
                minutes : 'minutes',
                seconds : 'seconds',
                days : 'days',
                weeks : 'weeks',
                months : 'months',
                format : function(){

                }
            },
            terminal : {
                axis : function(){
                    var orientation = 'left';
                    var is = {axis:true};
                    var numTicks = 5;
                    var scale;
                    var oppositeScale
                    var formatFn = function(v){
                        return v;
                    }
                    var setDims;
                    var axs = {
                        is : is,
                        scale: function(s, os){
                            scale = s;
                            oppositeScale = os;
                            return axs;
                        },
                        ticks: function(num){
                            if(arguments.length > 1) return axs;
                            numTicks = num;
                            return axs;
                        },
                        tickSize: function(){
                            return axs;
                        },
                        tickFormat: function(fn){
                            formatFn = fn;
                            return axs;
                        },
                        orient: function(value){
                            if(value) orientation = value;
                            return axs;
                        },
                        callable : function(canvas){
                            //squirrelly... audit this
                            canvas.slot = orientation;
                            var range = scale.range();
                            var positioning = (
                                orientation==='top'?
                                'bottom':
                                (orientation==='bottom'?'top':orientation)
                            );
                            var oppo = orientation==='left'?'bottom':'left';
                            var size = 0;
                            var defaultSize = 10;
                            //canvas.offsets[orientation] = size;
                            canvas.isAxis = true;
                            var horizontal = ['left', 'right'];
                            var w, h;
                            var target = canvas.parent;
                            //seemingly swapped?
                            axs.layout = horizontal.indexOf(orientation) === -1?
                                'horizontal':
                                'vertical';
                            var redomain;
                            if(axs.layout === 'horizontal'){
                                var h = canvas.height();
                                redomain = [0, h-canvas.attrs.height-1];
                            }else{
                                var w = canvas.width();
                                redomain = [0, w-canvas.attrs.width-1];
                            }
                            oppositeScale = oppositeScale.range(redomain);
                            target.offsets[oppo] = size;
                            if(!(h !== null && w !== null)) throw Error('!!!');
                            //target.flushDimensions(w, h);
                            var a = (canvas.attrs.width !== undefined?canvas.attrs.width:size);
                            var b = (canvas.attrs.height !== undefined?canvas.attrs.height:size);
                            var attrCopy = JSON.parse(JSON.stringify(canvas.attrs))
                            var root = canvas.root();
                            //canvas.flushDimensions(a, b);
                            //setDims();
                            canvas.render = function(fn, incomingGrid){
                                //console.log(this);
                                if(this.internalDataNodes){
                                    asyncComposite(this.internalDataNodes, function(err, result){
                                        fn(err, result);
                                    }, incomingGrid);
                                }else{
                                    //console.log('########', incomingGrid.toString(), '############')
                                    var grid = (new Grid( newGrid(this.attrs.width, this.attrs.height, true) ));
                                    var d = root.dimensions();
                                    var t=0;
                                    var l=0;
                                    var ob = this.offset('bottom');
                                    var ot = this.offset('top');
                                    var ol = this.offset('left');
                                    var or = this.offset('right');
                                    var writeText = function(text, x, y, grid, orientation){
                                        var txt = text.toString();
                                        if(orientation === 'vertical'){
                                            for(var lcv = x; lcv <x+txt.length; lcv++ ){
                                                if(grid.data[y] && grid.data[y][lcv]){
                                                    grid.data[y][lcv].chr = txt[lcv-x];
                                                }
                                            }
                                        }else{
                                            for(var lcv = y; lcv < y+txt.length; lcv++ ){
                                                if(grid.data[lcv] && grid.data[lcv][x]){
                                                    grid.data[lcv][x].chr = txt[lcv-y];
                                                }
                                            }
                                        }
                                    }
                                    if(scale && numTicks){
                                        if(numTicks > this.attrs.height){
                                            throw new Error('too many ticks for height');
                                        }
                                        var start = scale.domain()[0];
                                        var stop = scale.domain()[1];
                                        var ticks = [];
                                        if(start.getTime){
                                            var numCompute = numTicks-2;
                                            var diff = stop.getTime() - start.getTime();
                                            var inc = diff / numCompute;
                                            ticks.push(start);
                                            for(var lcv=0; lcv< numCompute; lcv++){
                                                var newDate = new Date();
                                                newDate.setTime(stop.getTime() + lcv*(inc));
                                                ticks.push(newDate);
                                            }
                                            ticks.push(stop);
                                        }else{
                                            ticks = scale.ticks(numTicks);
                                        }
                                        //console.log('D', d)
                                        var gapsPerTick = (
                                            axs.layout==='horizontal'?
                                            (d.dimensions.width+7): //WTF?!
                                            (d.dimensions.height-2) //WTF?!
                                        )/numTicks;
                                        var fullGapsPerTick = Math.floor(gapsPerTick);
                                        var partialGapsPerTick = gapsPerTick - fullGapsPerTick;
                                        var accumulator = 0;
                                        var offset = 0;
                                        ticks.reverse().forEach(function(tick, index){
                                            if(Math.floor(accumulator)){
                                                var extra = Math.floor(accumulator);
                                                accumulator -= extra;
                                                offset += extra;
                                            }
                                            var xx = axs.layout!=='horizontal'?0:index+offset;
                                            var yy = axs.layout!=='horizontal'?index+offset:1;
                                            writeText(formatFn(tick), xx, yy, grid, axs.layout);
                                            accumulator += partialGapsPerTick;
                                            accumulator +=  Math.floor(gapsPerTick)
                                        })
                                        var diff = start.getTime
                                        //console.log('TICKS', ticks);
                                    }
                                    if(axs.layout !== 'horizontal'){
                                        var h = root.attrs.height;
                                        for(var lcv=0; lcv <= h; lcv++){
                                            l = this.attrs.width-1;
                                            grid.data[lcv][l].chr = '|';
                                        }
                                    }else{
                                        var w = d.dimensions.width;
                                        t = 0;
                                        for(var lcv=0; lcv < w; lcv++){
                                            //the next row past the last row of the graph
                                            grid.data[t][lcv].chr = "-";
                                        }
                                    }
                                    if(incomingGrid){
                                        if(axs.layout === 'horizontal'){
                                            incomingGrid.drawOnto(
                                                grid.toString(),
                                                0,
                                                0
                                            )
                                        }else{
                                            incomingGrid.drawOnto(
                                                grid.toString(),
                                                0,
                                                0
                                            )
                                        }
                                    }
                                    setTimeout(function(){
                                        fn(null, incomingGrid?incomingGrid.toString():grid.toString());
                                    }, 0);
                                }
                            };
                            return axs;
                        }
                    }
                    return axs;
                },
                line : function(){
                    var tr = {};
                    var res = {
                        x : function(fn){
                            tr.x = fn;
                            return res;
                        },
                        y : function(fn){
                            tr.y = fn;
                            return res;
                        },
                        callable : function(canvas){
                            canvas.translateX = tr.x;
                            canvas.translateY = tr.y;
                            return res;
                        }
                    }
                    return res;
                },
                circle : function(){
                    var tr = {};
                    var res = {
                        x : function(fn){
                            tr.x = fn;
                            return res;
                        },
                        y : function(fn){
                            tr.y = fn;
                            return res;
                        },
                        callable : function(canvas){
                            canvas.translateX = tr.x;
                            canvas.translateY = tr.y;
                            return res;
                        }
                    }
                    return res;
                }
            }
        }
    };
    //allows all element selections to retarget the screen, if set
    Graph.retargetToScreen = false;
    Graph.create = function(options, callback){
        if(!callback){
            return Graph.newReturnContext(options);
        }else{
            var graph = new Graph[options.graphType || 'Timeseries'](options);
            graph[options.renderMethod || 'render'](options.data, function(err, text){
               callback(text);
            });
        }
    }
    Graph.newReturnContext = function(options){
        return new Promise(function(resolve, reject){
            try{
                Graph.create(options, function(rendered){
                    resolve(rendered);
                });
            }catch(ex){
                reject(ex);
            }
        });
    }
    return Graph;

    //UTIL
}));
