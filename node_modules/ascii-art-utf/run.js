var utf = require('./utf');
var ansi = require('ascii-art-ansi');
console.log('!', utf.signature('Abbey Sparrow'));
console.log('!', utf.signature('Abbey Sparrow', true));
console.log('!', utf.font(ansi.codes('Abbey Sparrow', 'italic'), 'sansserif'));
