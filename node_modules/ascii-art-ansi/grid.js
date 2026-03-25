(function (root, factory){
    if(typeof define === 'function' && define.amd){
        // AMD. Register as an anonymous module.
        define(['./ansi'], factory);
    }else if (typeof module === 'object' && module.exports){
        module.exports = factory(require('./ansi'));
    }else{
        // Browser globals (root is window)
        root.AsciiArtAnsiGrid = factory(window.AsciiArtAnsi);
    }
}(this, function(ansi){
    var Canvas = function(str, len){
        var size = len || 1;
        this.data = [];
        var ob = this;
        var row = 0;
        var w = 0;
        this.height = 1;
        ansi.map(str, function(chr, styles, p, pos, shortCircuit){
            if(chr == "\n" ){
                row++;
                ob.height++;
                if(ob.width < w || !ob.width) ob.width = w;
                w=0;
            }else{
                if(!ob.data[row]) ob.data[row] = [];
                if(pos % size === 0){
                    ob.data[row].push({
                        chr:chr, styles:styles.slice()
                    });
                }else{
                    ob.data[row][ob.data[row].length-1].chr += chr;
                }
                w++;
            }
        }, true);
        this.height = this.data.length;
        //console.log('loaded ['+this.height+' x '+this.width+']')
        //console.log(this.data)
        //console.log(this.data.map(row => row.map(item => item.styles.length)))
    }

    Canvas.prototype.canvasSize = function(height, width){
        this.height = height;
        this.width = width;
    }

    Canvas.prototype.toString = function(){
        var result = '';
        var item;
        outer:for(var y=0; y < this.height; y++){
            for(var x=0; x < this.width; x++){
                if(!this.data[y]){
                    continue outer;
                }
                item = this.data[y][x] || {chr:' '};
                result += ansi.codeRender(item.styles)+item.chr;
            }
            result += "\033[0m\n";
        }
        return result;
    }

    Canvas.prototype.setValue = function(x, y, value, isAStyleMerge){
        if(x > this.width || !this.data[y]){
            //throw new Error('set outside bounds('+x+', '+y+')['+this.height+', '+this.width+']');
            return;
        }
        if(isAStyleMerge){
            value.styles = (this.data[y][x] && this.data[y][x].styles)?
                this.data[y][x].styles.concat(value.styles):
                value.styles;
        }
        this.data[y][x] = value;
    }

    var dimensions = function(model){
        var w = 0;
        var result = 0;
        var h = 0;
        ansi.map(model, function(c){
            if(c === "\n"){
                h++;
                if(w > result){
                    result = w;
                }
                w=0;
            }else w++;
        }, true);
        return {
            height : h,
            width : result
        };
    }

    var isEmpty = function(chr){
        return (!chr.trim() || chr.trim() === '⠀');
    }

    Canvas.prototype.drawOnto = function(str, offX, offY, isTransparent, mergeStyles){
        if(offX < 0 || offY < 0){ //negatives for positioning from opposite margin
            var dims = dimensions(str);
            if(offX < 0) offX = this.width + offX - dims.width +1;
            if(offY < 0) offY = this.height + offY - dims.height +1;
        }
        if(offX === null) offX = 0;
        if(offY === null) offY = 0;
        var x = 0;
        var y = 0;
        var ob = this;
        ansi.map(str, function(chr, styles, p, pos, shortCircuit){
            if(ob.debug) console.log(chr, offX+x, offY+y, offX, x, offY, y);
            if(chr === "\n" ){
                y++;
                x=0;
            }else{
                //if(ob.debug) console.log(offX+x, offY+y, offX, x, offY, y)
                //*
                if(chr && (!(isTransparent && isEmpty(chr) ))) ob.setValue(offX+x, offY+y, {
                    chr:chr, styles:styles
                }, mergeStyles);
                //*/
                x++;
            }
        }, true);
    }

    return Canvas;
}));
