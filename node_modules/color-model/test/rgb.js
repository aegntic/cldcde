var Rgb    = require('..').Rgb;
var HexRgb = require('..').HexRgb;

describe('Rgb', function(){

  describe('Rgb', function(){
    it('should allow to create empty color', function() {
      (function(){
        new Rgb();
      }).should.not.throwError(/not implemented/i);
    })

    it('by default create black color', function() {
      new Rgb().toString().should.be.equal('rgb(0, 0, 0)');
    })

    it('should allow only color values between 0 and 255', function () {
      (function(){
        new Rgb(-1);
      }).should.throwError(/between/i);
      (function(){
        new Rgb(255.5);
      }).should.throwError(/between/i);
      (function(){
        new Rgb(1000);
      }).should.throwError(/between/i);
    })
  })

  describe('toHex', function(){
    it('should clone from self HexRgb', function() {
      new Rgb(255, 255, 255).toHex().equals(new HexRgb('fff')).should.be.ok;
      new Rgb().toHex().equals(new HexRgb('000')).should.be.ok;
    })
  })

  describe('toHexString', function(){
    it('should directly return own hex representation', function() {
      new Rgb(255, 0, 0).toHexString().should.be.equal('#ff0000');
    })
  })

  describe('toXyz', function(){
    it('should convert to correct color in Xyz model', function() {
      var Xyz = require('..').Xyz;
      new Rgb(             ).toXyz().toString().should.equal(new Xyz(                         ).toString());
      new Rgb(255, 255, 255).toXyz().toString().should.equal(new Xyz(95.05,   100,     108.9  ).toString());
      new Rgb(128, 128, 128).toXyz().toString().should.equal(new Xyz(20.5175, 21.5861, 23.5072).toString());
      new Rgb(171, 205, 239).toXyz().toString().should.equal(new Xyz(54.2059, 58.5526, 90.1062).toString());

    })
  })

  describe('toHsl', function(){
    it('should convert to correct color in Hsl model', function() {
      var Hsl = require('..').Hsl;
      new Rgb(             ).toHsl().toString().should.equal(new Hsl(                ).toString());
      new Rgb(255, 255, 255).toHsl().toString().should.equal(new Hsl(  0, 0.00, 1.00).toString());
      new Rgb(128, 128, 128).toHsl().toString().should.equal(new Hsl(  0, 0.00, 0.50).toString());
      new Rgb(170, 187, 204).toHsl().toString().should.equal(new Hsl(210, 0.25, 0.73).toString());
      new Rgb( 78,   0,  63).toHsl().toString().should.equal(new Hsl(312, 1.00, 0.15).toString());
      new Rgb(  0,  76,   0).toHsl().toString().should.equal(new Hsl(120, 1.00, 0.15).toString());
    })
  })

  describe('component aliases (red, green, blue)', function(){
    it('should set component`s value where passed and return it if nothing passed', function() {
      new Rgb(10, 20, 30).red(15).red().should.be.equal(15);
      new Rgb(10, 20, 30).green('30').green().should.be.equal(30);
      new Rgb(10, 20, 30).blue('44').blue().should.be.equal(44);
    })
  })

});
