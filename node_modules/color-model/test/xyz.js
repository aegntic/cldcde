var Xyz = require('..').Xyz;
var Rgb = require('..').Rgb;
var Lab = require('..').Lab;

describe('Xyz', function(){

  describe('toRgb', function(){
    it('should convert to correct color in Rgb model', function() {
      new Xyz(                         ).toRgb().toString().should.equal(new Rgb(             ).toString());
      new Xyz(95.05,   100,     108.9  ).toRgb().toString().should.equal(new Rgb(255, 255, 255).toString());
      new Xyz(20.5175, 21.5861, 23.5072).toRgb().toString().should.equal(new Rgb(128, 128, 128).toString());
      new Xyz(54.2059, 58.5526, 90.1062).toRgb().toString().should.equal(new Rgb(171, 205, 239).toString());
    })
  })

  describe('toLab', function(){
    it('should convert to correct color in Lab model', function () {
      new Xyz(                         ).toLab().toString().should.equal(new Lab(                             ).toString());
      new Xyz(95.05,   100,     108.9  ).toLab().toString().should.equal(new Lab(100.0000,   0.0053,   -0.0104).toString());
      new Xyz(20.5175, 21.5861, 23.5072).toLab().toString().should.equal(new Lab(53.5851,    0.0027,   -0.0061).toString());
      new Xyz(54.2059, 58.5526, 90.1062).toLab().toString().should.equal(new Lab(81.0450,   -3.6562,  -20.4518).toString());

      new Xyz( 7.7192, 15.4383,   2.5731).toLab().toString().should.equal(new Lab(46.2288, -51.6991,   49.8975).toString());
      new Xyz(59.2900, 28.4800,  96.9800).toLab().toString().should.equal(new Lab(60.3199,  98.2542,  -60.8430).toString());
      new Xyz(18.0500,  7.2200,  95.0500).toLab().toString().should.equal(new Lab(32.3026,  79.1967, -107.8637).toString());
      new Xyz(77.0000, 92.7800,  13.8500).toLab().toString().should.equal(new Lab(97.1382, -21.5559,   94.4825).toString());
      new Xyz(53.8100, 78.7400, 106.9700).toLab().toString().should.equal(new Lab(91.1165, -48.0796,  -14.1381).toString());
    })
  })

  describe('component aliases (x, y, z)', function(){
    it('should return component`s value where nothing passed', function() {
      new Xyz(10, 20, 30).x().should.be.equal(10);
      new Xyz(10, 20, 30).y('').should.not.be.equal(0);
      new Xyz(10, 20, 30).z(null).should.not.be.equal(30);
      new Xyz(10, 20, 30).z(30).should.not.be.equal(30);
    })

    it('should set component`s value when value passed', function() {
      new Xyz(10, 20, 30).x('').toString().should.be.equal(new Xyz(0,  20, 30).toString());
      new Xyz(10, 20, 30).y(80).toString().should.be.equal(new Xyz(10, 80, 30).toString());
    })
  })

});
