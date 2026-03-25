(function (root, factory) {
    if(typeof define === 'function' && define.amd){
        define([], function(){
            return factory(root);
        });
    }else if (typeof exports === 'object'){
        module.exports = factory(root);
    }else{
        root.stacktrace = factory(root);
    }
}(this, function(root){
    var canTrace = !!(new Error()).stack;
    if(root && !root['__dirname']){
        var stackTrace = function () {
            var s;
            try{
                throw new Error();
            }catch(ex){
                s = ex.stack;
            }
            var lines = s.split("\n");
            // 0 = message, 1 = stackTrace
            lines.shift(); lines.shift();
            var result;
            if(!canTrace){
                result = lines.map(function(line){
                    line = line.substring(0, line.lastIndexOf(':'));
                    line = line.substring(0, line.lastIndexOf(':'));
                    if(line.indexOf('@') !== -1){
                        line = line.substring(line.indexOf('@'));
                    }
                    if(line.lastIndexOf('?') !== -1){
                        line = line.substring(0, line.lastIndexOf('?'));
                    }
                    var urlTest = (/([a-zA-Z]+:\/\/.*?)\/(.*)/g).exec(line);
                    var domain;
                    if(urlTest){
                        domain = urlTest[1];
                        directory = urlTest[2];
                    }
                    return {
                        file : line,
                        directory : directory,
                        //line : parts[1],
                        //column : parts[2],
                        domain : domain
                    }
                });
            }else{
                result = lines.map(function(line){
                    if(line.indexOf('(native)') != -1){
                        return {
                            file : '[browser core]',
                            directory : '-',
                            domain : line.replace(' at ', '').replace('(native)').trim()
                        }
                    }
                    var parts = (RegExp(' (?:at(?: .*?)? |\\\()(.*):([0-9]+):([0-9]+)', 'g').exec(line));
                    //console.log(parts, line);
                    var sep = parts[1].lastIndexOf('/');
                    var directory = parts[1].substring(0, sep);
                    var urlTest = (/([a-zA-Z]+:\/\/.*?)\/(.*)/g).exec(directory);
                    var domain;
                    //console.log('parts', parts)
                    if(urlTest){
                        domain = urlTest[1];
                        directory = urlTest[2];
                    }
                    return {
                        file : parts[1].substring(sep+1),
                        directory : directory,
                        line : parts[1],
                        column : parts[2],
                        domain : domain
                    }
                });
            }
            return result;
        }
 
        Object.defineProperty(root, "__filename", {
            __proto__: null, // no inherited properties
            get : function(){
                var stack = stackTrace();
                stack.shift();
                return stack[0].file;
            }
        });
        
        Object.defineProperty(root, "__dirname", {
            __proto__: null, // no inherited properties
            get : function(){
                var stack = stackTrace();
                stack.shift();
                return stack[0].directory;
            }
        });
        
        Object.defineProperty(root, "__stacktrace", {
            __proto__: null, // no inherited properties
            get : function(){
                var stack = stackTrace();
                stack.shift();
                return stack;
            }
        });
        
        return stackTrace;
    }
}));