var    Rgb = require('..').Rgb;
var HexRgb = require('..').HexRgb;

describe('HexRgb', function(){

  describe('HexRgb', function(){
    it('should create color from correct HEX string', function() {

      (function(){
        new HexRgb('qwerty');
      }).should.throwError(/unknown/i);
      (function(){
        new HexRgb('#aaabbbc');
      }).should.throwError(/unknown/i);

      (function(){
        new HexRgb('#fff');
        new HexRgb('#aaabbb');
      }).should.not.throwError();

      new HexRgb('#fff').equals(new Rgb(255, 255, 255)).should.be.ok;
    })

    it('should allow to parse HEX without #', function () {
      (function(){
        new HexRgb('fffccc');
      }).should.not.throwError();

      new HexRgb('fffccc').equals(new Rgb(255, 252, 204)).should.be.ok;
    })

    it('should allow to parse HEX of 3 or 6 lentgh', function() {
      new HexRgb('ccc').equals(new HexRgb('#cccccc')).should.be.ok;
    })
  })

  describe('toString', function(){
    it('should return own representation in HEX format', function() {
      new HexRgb('#aabbcc').toString().should.be.equal('#aabbcc');
      new HexRgb('#abc')   .toString().should.be.equal('#aabbcc');
      new HexRgb('aabbcc') .toString().should.be.equal('#aabbcc');
      new HexRgb('abc')    .toString().should.be.equal('#aabbcc');
      new HexRgb('abc').red(170.00000033).toString().should.be.equal('#aabbcc');
    })
  })

  describe('toRgb', function(){
    it('should return self as Rgb', function() {
      new HexRgb('#aabbcc').toRgb().toHexString().should.be.equal('#aabbcc');
      new HexRgb('#abc')   .toRgb().toHexString().should.be.equal('#aabbcc');
      new HexRgb('aabbcc') .toRgb().toHexString().should.be.equal('#aabbcc');
      new HexRgb('abc')    .toRgb().toHexString().should.be.equal('#aabbcc');
    })
  })

});
