var Lab = require('..').Lab;
var Rgb = require('..').Rgb;

describe('Lab', function(){

  function extremeRgb(callback) {
    for (var r = 0, rMax = 255; r <= rMax; r+=rMax) {
    for (var g = 0, gMax = 255; g <= gMax; g+=gMax) {
    for (var b = 0, bMax = 255; b <= bMax; b+=bMax) {
      var rgb = new Rgb(r, g, b);
      callback(rgb);
    }}}
  };
  
  describe('toXyz', function(){
    it('should convert to correct color in Xyz model')
  })

  describe('component aliases (L, a, b)', function(){
    it('should set component`s value where passed and return it if nothing passed', function() {
      new Lab(10, 20, 30).lightness(15).lightness().should.be.equal(15);
      new Lab(10, 20, 30).a('30').a().should.be.equal(30);
      new Lab(10, 20, 30).b('44').b().should.be.equal(44);
    })
  })

  describe('limits', function(){
    it('should be enough to convert from RGB', function(){
      (function(){
        extremeRgb(function(rgb) {
          rgb.toLab();
        });
      }).should.not.throwError();
    })
  })

});
