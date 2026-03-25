var Component = require('..').Component;

describe('Component', function(){

  describe('Component', function(){
    it('should create new when name set', function() {
      (function(){
        new Component();
      }).should.throwError(/not set/);

      (function(){
        new Component('');
      }).should.throwError(/not set/);

      (function(){
        new Component('wow');
      }).should.not.throwError(/not set/);
    })

    it('should create new when from less than to', function() {
      (function(){
        new Component('name');
      }).should.throwError(/less than/);

      (function(){
        new Component('name', 0, 0);
      }).should.throwError(/less than/);

      (function(){
        new Component('name', 10, 0);
      }).should.throwError(/less than/);

      (function(){
        new Component('name', 0, 255);
      }).should.not.throwError(/less than/);
    })

    it('should allow edge floats in from and to', function() {
      (function(){
        new Component('name', 0, 10.333).set(10.333);
      }).should.not.throwError(/less than/);
    })
  })

  describe('equals', function(){
    it('should success if that has same value, name and class', function () {
      new Component('name', 0, 255).equals(null).should.not.ok;

      new Component('name', 0, 10)
        .set(5)
        .equals(new Component('name', 0, 255)).should.not.ok;

      new Component('name1', 0, 10)
        .set(5)
        .equals(new Component('name2', 0, 255).set(5)).should.not.ok;

      new Component('name', 0, 10)
        .set(5)
        .equals(new Component('name', 0, 255).set(5)).should.ok;
    })
  })

  describe('set', function(){
    it('should set only numeric value', function() {
      (function(){
        new Component('name', 0, 255).set('px');
      }).should.throwError(/numeric/);

      (function(){
        new Component('name', 0, 255).set();
        new Component('name', 0, 255).set('');
        new Component('name', 0, 255).set('123 px');
        new Component('name', 0, 255).set('10%');
      }).should.not.throwError(/numeric/);

      new Component('name', 0, 255).set(' 10 %').get().should.be.equal(10);
    })

    it('should set value only between from and to', function () {
      (function(){
        new Component('name', 0, 255).set(-1);
        new Component('name', 0, 255).set(1000);
        new Component('name', 0, 255).set('255.00000000001');
      }).should.throwError(/between/);

      (function(){
        new Component('name', 0, 255).set(0);
        new Component('name', 0, 255).set(127);
        new Component('name', 0, 255).set(255);
        new Component('name', 0, 255).set('255.0000000000');
      }).should.not.throwError(/between/);
    })
  })

  describe('get', function(){
    it('should get value', function() {
      (null === new Component('name', 0, 255).get()).should.be.ok;
      new Component('name', 0, 255).set('  123px').get().should.be.exactly(123.0);
      new Component('name', 0, 255).set().get().should.be.exactly(0);
      new Component('name', 0, 255).set('').get().should.be.exactly(0);
    })
  })

});
