var Hsl    = require('..').Hsl;

describe('Hsl', function(){

  describe('toRgb', function(){
    it('should convert to correct color in Rgb model', function() {
      var Rgb = require('..').Rgb;
      new Hsl(               ).toRgb().toString().should.equal(new Rgb(             ).toString());
      new Hsl(  0, 0.00, 1.00).toRgb().toString().should.equal(new Rgb(255, 255, 255).toString());
      new Hsl(  0, 0.00, 0.50).toRgb().toString().should.equal(new Rgb(128, 128, 128).toString());

      new Hsl(209, 0.25, 0.73).toRgb().toString().should.equal(new Rgb(169, 187, 204).toString());
      new Hsl(313, 1.00, 0.15).toRgb().toString().should.equal(new Rgb( 76,   0,  60).toString());
      new Hsl(119, 1.00, 0.15).toRgb().toString().should.equal(new Rgb(  1,  76,   0).toString());
    })
  })

  describe('component aliases (hue, saturation, lightness)', function(){
    it('should set component`s value where passed and return it if nothing passed', function() {
      new Hsl(180, 0.5, 0.5).hue(108).hue().should.be.equal(108);
      new Hsl(180, 0.5, 0.5).saturation('0.4').saturation().should.be.equal(0.4);
      new Hsl(180, 0.5, 0.5).lightness('0.5').lightness().should.be.equal(0.5);
    })
  })

  describe('toLab', function(){
    it('has toLab method non-directly', function() {
      new Hsl().toLab().toString().should.be.ok;
    })
  })


});
