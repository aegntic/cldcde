(function (root, factory){
    if(typeof define === 'function' && define.amd){
        define(['ascii-art-ansi'], factory);
    }else if (typeof module === 'object' && module.exports){
        module.exports = factory(require('ascii-art-ansi'));
    }else{
        root.AsciiArtUTF = factory(root.AsciiArtAnsi);
    }
}(this, function(ansi){
    var unicodeSplit = function(str){
        var result = [];
        for(var c of str) result.push(c);
        return result;
    }
    var fonts = {
        'default' : {
            upper : unicodeSplit('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
            lower : unicodeSplit('abcdefghijklmnopqrstuvwxyz'),
            numbers : unicodeSplit('0123456789')
        },
        'script' : {
            upper : unicodeSplit('𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵'),
            lower : unicodeSplit('𝒶𝒷𝒸𝒹ℯ𝒻𝓰𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏')
        },
        'script+bold' : {
            upper : unicodeSplit('𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩'),
            lower : unicodeSplit('𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃')
        },
        'gothic' : {
            upper : unicodeSplit('𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℐ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ'),
            lower : unicodeSplit('𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷')
        },
        'gothic+bold' : {
            upper : unicodeSplit('𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅'),
            lower : unicodeSplit('𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟')
        },
        'serif' : { //copy of bold, for now
            upper : unicodeSplit('𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙'),
            lower : unicodeSplit('𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳'),
            numbers : unicodeSplit('𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗')
        },
        'serif+bold+italic' : {
            upper : unicodeSplit('𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁'),
            lower : unicodeSplit('𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛')
        },
        'serif+bold' : { //copy of bold, for now
            upper : unicodeSplit('𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙'),
            lower : unicodeSplit('𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳'),
            numbers : unicodeSplit('𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗')
        },
        'serif+italic' : { //copy of bold, for now
            upper : unicodeSplit('𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍'),
            lower : unicodeSplit('𝑎𝑏𝑐𝑑𝑒𝑓𝑔𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧')
        },
        'monospace' : { //copy of bold, for now
            upper : unicodeSplit('𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉'),
            lower : unicodeSplit('𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣'),
            numbers: unicodeSplit('𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿')
        },
        'sansserif' : { //copy of bold, for now
            upper : unicodeSplit('𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹'),
            lower : unicodeSplit('𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓'),
            numbers : unicodeSplit('𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫')
        },
        'sansserif+bold+italic' : { //copy of bold, for now
            upper : unicodeSplit('𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕'),
            lower : unicodeSplit('𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯')
        },
        'sansserif+bold' : { //copy of bold, for now
            upper : unicodeSplit('𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭'),
            lower : unicodeSplit('𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇'),
            numbers : unicodeSplit('𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵')
        },
        'sansserif+italic' : { //copy of bold, for now
            upper : unicodeSplit('𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡'),
            lower : unicodeSplit('𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻')
        },
        'doublestrike' : { //copy of bold, for now
            upper : unicodeSplit('𝔸𝔹𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏Yℤ'),
            lower : unicodeSplit('𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫'),
            numbers: unicodeSplit('𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡')
        }
    }

    var siggy = {
        //todo: make this usable for others
        A : unicodeSplit('Ʌ'),
        b : unicodeSplit('㇋ㄋ𐡎'),
        e : unicodeSplit('꠵'),
        y : unicodeSplit('𐍅'),
        S : unicodeSplit('S'),
        p : unicodeSplit('Ꮅ'),
        a : unicodeSplit('᭴᥈'),
        r : unicodeSplit('ᖇママ'),
        o : unicodeSplit('𐍈Ꙩ'),
        w : unicodeSplit('ꛃᜦ')
    };

    var randomLetter = function(letter, lookup){
        if(!lookup[letter]) return letter;
        // in order to get an even-ish spread, increase the range by one, and cap the value
        var index = Math.min(
            Math.floor((lookup[letter].length+1)*Math.random()),
            lookup[letter].length-1
        );
        return lookup[letter][index];
    }

    var getCharFor = function(chr, font, styles){
        if(isAlphabeticChar(chr) || isNumericChar(chr)){
            var type = isNumericChar(chr)?'number':(chr === chr.toLowerCase()?'lower':'upper');
            var isBold = styles.indexOf('bold') !== -1 || styles.indexOf('1') !== -1;
            var isItalic = styles.indexOf('italic') !== -1 || styles.indexOf('3') !== -1;
            var pos;
            switch(type){
                case 'number': pos = fonts.default.numbers.indexOf(chr); break;
                case 'upper': pos = fonts.default.upper.indexOf(chr); break;
                case 'lower': pos = fonts.default.lower.indexOf(chr); break;
            }
            if(isBold && isItalic && fonts[font+'+bold+italic']){
                if(
                    fonts[font+'+bold+italic'][type] &&
                    fonts[font+'+bold+italic'][type][pos]
                ) return fonts[font+'+bold+italic'][type][pos];
            }
            if(isBold && fonts[font+'+bold']){
                if(
                    fonts[font+'+bold'][type] &&
                    fonts[font+'+bold'][type][pos]
                ) return fonts[font+'+bold'][type][pos];
            }
            if(isItalic && fonts[font+'+italic']){
                if(
                    fonts[font+'+italic'][type] &&
                    fonts[font+'+italic'][type][pos]
                ) return fonts[font+'+italic'][type][pos];
            }
            if(fonts[font]){
                if(
                    fonts[font][type] &&
                    fonts[font][type][pos]
                ) return fonts[font][type][pos];
            }
        }
        return chr;
    }

    var isAlphabeticChar = function(str){
        return str.length === 1 && str.match(/[a-z]/i);
    }

    var isNumericChar = function(n){
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    var utf = {
        font : function(str, font){
            return ansi.map(str, function(chr, codes){
                var result = getCharFor(chr, font, codes);
                return result;
            });
        },
        signature : function(str, alt){
            return ansi.map(str, function(chr, codes){
                return alt?randomLetter(chr, siggy):getCharFor(chr, 'script', codes);
            });
        }
    }
    return utf;
}));
