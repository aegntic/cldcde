var AbstractModel = require('..').AbstractModel;
var Xyz           = require('..').Xyz;
var Rgb           = require('..').Rgb;

describe('AbstractModel', function(){

  describe('toString', function(){
    it('should get representation of model as className(component1, component2, componentN)', function() {
      new Xyz(1,2,3).toString().should.be.equal('xyz(1, 2, 3)');
      new Xyz().toString().should.be.equal('xyz(0, 0, 0)');
      new Xyz(10.000001).toString().should.be.equal('xyz(10.000001, 0, 0)');
    })
  })

  describe('equals', function(){
    it('should success if that has same type and components values', function() {
      new Xyz(1,2,3).equals(new Xyz()).should.fail;
      new Xyz(1,2,3).equals(new AbstractModel()).should.fail;
      new Xyz(1,2,3).equals(new AbstractModel(1, 2, 3)).should.fail;

      new Xyz(1,2,3).equals(new Xyz(1,   2, 3)).should.ok;
      new Xyz('1',2,0).equals(new Xyz(1, '2bla')).should.ok;
      new Xyz().equals(new Xyz()).should.ok;
      new Xyz(0, 0, 0).equals(new Xyz()).should.ok;
    })
  })

  describe('toXyz', function(){
    it('must be implemented in any model directly or through another toBlabla method', function() {
      new Xyz(1,2,3).toXyz().equals(new Xyz(1,2,3)).should.ok;
    })

    it('by default throws "Not implemented" error', function() {
      (function(){
        new AbstractModel(1,2,3).toXyz();
      }).should.throwError(/not implemented/i);

      (function(){
        new Xyz(1,2,3).toXyz();
      }).should.not.throwError(/not implemented/i);
    })
  })

  describe('toLab', function(){
    it('must be in any model just through toXyz method', function() {
      (function(){
        new Xyz(1,2,3).toLab();
      }).should.not.throwError(/not implemented/i);

      new Xyz(1,2,3).should.have.property('toLab');
      new Rgb(1,2,3).toLab().should.exists;
    })
  })

  describe('component', function(){
    it('should return component`s value when component exists', function() {
      (function(){
        new Xyz().component('wtf');
      }).should.throwError(/not exists/i);

      (function(){
        new Xyz().component('x');
      }).should.not.throwError(/not exists/i);
    })

    it('should return component`s value by name when only name passed', function() {
      new Xyz(10, 20, 30).component('x').should.be.equal(10);
      new Xyz(10, 20, 30).component('x', '').should.not.be.equal(10);
      new Xyz(10, 20, 30).component('x', null).should.not.be.equal(10);
      new Xyz(10, 20, 30).component('x', 11).should.not.be.equal(10);
    })

    it('should set component`s value by name when name passed and value passed', function() {
      new Xyz(10, 20, 30).component('x', '').toString().should.be.equal(new Xyz(0, 20, 30).toString());
    })

    it('should return color model when name and value passed', function() {
      new Xyz(10, 20, 30).component('x', '').should.be.instanceOf(Xyz);
    })
  })

});
