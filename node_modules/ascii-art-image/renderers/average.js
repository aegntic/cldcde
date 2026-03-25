(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['ascii-art-ansi', 'ascii-art-ansi/color', 'ascii-art-braille'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('ascii-art-ansi'),
            require('ascii-art-ansi/color'),
            require('ascii-art-braille')
        );
    } else {
        root.AsciiArtAverageRenderer = factory(
            root.AsciiArtAnsi,
            root.AsciiArtAnsiColor,
            root.AsciiArtBraille
        );
    }
}(this, function (ansi, Color, braille) {
    var AsciiArt;
    var getValue = function(r, g, b){
        return (r+g+b)/3;
    }
    var result = { //characters based on a value scale + averaging
        setInstance: function(instance){
            AsciiArt = instance;
        },
        lineart : function(image, utils, callback){
            var originalWidth = image.options.width;
            var originalHeight = image.options.height;
            image.options.width = image.options.width * 2;
            image.options.height = image.options.height * 2;
            return result.mask(image, utils, function(err, mask){
                var rows = [];
                mask.forEach(function(value, index){
                    if(index % image.options.width === 0) rows.push([]);
                    rows[rows.length-1].push(value);
                });
                rows = rows.map(function(line){
                    return line.map(function(value){
                        return (value < (image.options.threshold || 50)) &&
                            (value > (image.options.floor || 0));
                    });
                });
                var result = braille.binary2DMapToBlocks(rows);
                image.options.width = originalWidth;
                image.options.height = originalHeight;
                callback(undefined, result.map(function(line){
                    if(image.options.stroke) line = line.map(function(char){
                        return ansi.codes(char, image.options.stroke)
                    })
                    return line.join('');
                }).join("\n"), result);
            });
        },
        stipple : function(image, utils, callback){
            var originalWidth = image.options.width;
            var originalHeight = image.options.height;
            image.options.width = image.options.width * 2;
            image.options.height = image.options.height * 4;
            return result.mask(image, utils, function(err, mask){
                var rows = [];
                mask.forEach(function(value, index){
                    if(index % image.options.width === 0) rows.push([]);
                    rows[rows.length-1].push(value);
                });
                rows = rows.map(function(line){
                    return line.map(function(value){
                        return (value < (image.options.threshold || 50)) &&
                        (value > (image.options.floor || 0));
                    });
                });
                var result = braille.binary2DMapToBraille(rows);
                image.options.width = originalWidth;
                image.options.height = originalHeight;
                callback(undefined, result.map(function(line){
                    if(image.options.stroke) line = line.map(function(char){
                        return ansi.codes(char, image.options.stroke)
                    })
                    return line.join('');
                }).join("\n"), result);
            });
        },
        mask : function(image, utils, callback){
            try{
                var width = image.options.width;
                var height = image.options.height;
                var distortion = 0.5;
                height = Math.floor(image.options.height*distortion);
                utils.imageFromCanvas(image.canvas, function(err, newImage){
                    var canvas = utils.canvas(width, height);

                    var context = canvas.getContext('2d');
                    context.drawImage(
                        newImage, 0, 0,
                        width, height
                    );
                    var data = context.getImageData(
                        0, 0,
                        width, height
                    ).data;
                    var result = [];
                    var currentColor;
                    for(var y=0; y < height; y++){
                        for(var x=0; x < width; x++){
                            var offset = y * width * 4 + x * 4;
                            var roffset = y * width + x;
                            var value = Math.floor(getValue(
                                data[offset],
                                data[offset+1],
                                data[offset+2]
                            ));
                            result[roffset] = value
                        }
                    }
                    if(callback) callback(undefined, result);
                });
            }catch(ex){
                if(callback) callback(ex);
            }
        },
        render : function(image, utils, callback){
            try{
                var width = image.options.width;
                var height = image.options.height;
                var distortion = 0.5;
                height = Math.floor(image.options.height*distortion);
                utils.imageFromCanvas(image.canvas, function(err, newImage){
                    var canvas = utils.canvas(width, height);

                    var context = canvas.getContext('2d');
                    context.drawImage(
                        newImage, 0, 0,
                        width, height
                    );
                    var data = context.getImageData(
                        0, 0,
                        width, height
                    ).data;
                    var result = '';
                    var currentColor;
                    for(var y=0; y < height; y++){
                        for(var x=0; x < width; x++){
                            var offset = y * width * 4 + x * 4;
                            var pixelData = [
                                data[offset],
                                data[offset+1],
                                data[offset+2]
                            ];
                            //console.log('px', pixelData);
                            var color = Color.code(pixelData);
                            if(image.options.background) color += Color.backgroundCode(pixelData);
                            var fraction = getValue(
                                data[offset],
                                data[offset+1],
                                data[offset+2]
                            )/255;
                            var charPosition = Math.floor(image.options.alphabet.length*fraction);
                            result += color + (image.options.alphabet[charPosition] || ' ');
                        }
                        result += Color.code()+"\n";
                        currentColor = undefined;
                    }
                    if(callback) callback(undefined, result);
                });
            }catch(ex){
                if(callback) callback(ex);
            }
        }
    };
    return result;
}));
