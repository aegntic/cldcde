#! /usr/bin/env node
var Image = require('./image');
var difference = require('color-difference');
var arrays = require('async-arrays');
var Color = require('ascii-art-ansi/color');
var fs = require('fs');

function moreAccurateColor(r1, g1, b1, r2, g2, b2){
    return difference.compare(
        '#'+r1.toString(16)+g1.toString(16)+b1.toString(16),
        '#'+r2.toString(16)+g2.toString(16)+b2.toString(16)
    );
}


var needsAccurateColor = [
    './Images/sewer-grate.jpg',
    './Images/max-headroom.jpg',
    './Images/truth.png',
    './Images/rene-cigler.jpg',
    './Images/tony_harrison.jpg'
];
var alternateAlphabets = {
    './Images/gir.gif':'binary',
    './Images/cernettes.jpg':'variant1',
    './Images/gob.jpg':'variant2',
    './Images/beyonce-upgrade.jpg':'variant3',
    './Images/metropolis.jpg':'variant4',
    './Images/grendel.jpg':'blocks',
    './Images/zero-cool.jpg':'greyscale'
};
var alternateDifference = {
    './Images/gir.gif':'euclideanDistance',
    './Images/cernettes.jpg':'ratioDistance',
    './Images/gob.jpg':'closestByIntensity',
    './Images/beyonce-upgrade.jpg':'ratioDistance',
    './Images/metropolis.jpg':'classicByValue',
    './Images/grendel.jpg':'closestByIntensity',
    './Images/zero-cool.jpg':'original'
};
var result = [];
var images = fs.readdirSync('./Images');
images = images.filter(function(image){
    return image[0] !== '.';
}).map(function(image){
    return './Images/'+image;
});
var count = 0;
arrays.forEachEmission(images, function(item, key, done){
    if(!(alternateAlphabets[item] || (needsAccurateColor.indexOf(item) !== -1))) return done();
    var options = { filepath: item };
    //if(needsAccurateColor.indexOf(item) !== -1) options.distance = moreAccurateColor;
    if(alternateAlphabets[item]) options.alphabet = alternateAlphabets[item];
    options.alphabet = 'solid';
    //Color.isTrueColor = true;
    //Color.is256 = true;
    var image = new Image(options);
    var file = options.filepath.split('/').pop();
    var pos = file.indexOf('.');
    var name = (pos===-1?file:file.substring(0, pos));
    var label = name.replace(/[_-]+/g, ' ').split(' ').map(function(str){
        return str[0].toUpperCase()+str.substring(1);
    }).join("        ");
    var complete = done;
    Color.useDistance(alternateDifference[item] || 'original')
    image.write(function(err, ascii){
        if(err) console.log(err);
        if(process.argv[2] === 'save'){
            fs.writeFile('./test/images/'+name+'.nfo', ascii, function(err){
                count++;
                complete();
            });
        }else{
            console.log(ascii)
            complete();
        }
    });
}, function(){
    console.log('DONE')
});
