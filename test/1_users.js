var chai = require('chai');
var expect = chai.expect;
var chaiHttp = require('chai-http');
var HTTPStatus = require('http-status');
var app = require('../app');

chai.use(chaiHttp);

const sampleRegister = {
    first_name: "Sample",
    last_name: "User",
    email: "test@sample.com",
    password: "password"
}

const invalidRegister = {
    last_name: "User",
    email: "a@b.com",
    password: "password"
}

const invalidLogin = {
    email: "test@sample.com",
    password: "pspawsord"
}

const invalidLogin2 = {
    password: "password"
}

describe('Users', function() {
    it('Successfully create a new user with name, email, and password', function(done) {
      chai.request(app)
        .post('/users/register')
        .send(sampleRegister)
        .then(res => {
          expect(res).to.have.status(HTTPStatus.CREATED);
          expect(res.body).to.have.property('id');
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('Fail to create a user with identical email', function(done) {
      chai.request(app)
        .post('/users/register')
        .send(sampleRegister)
        .then(res => {
          expect(res).to.have.status(HTTPStatus.CONFLICT);
          expect(res.body.error).to.equal("Email already registered");
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('Fail to create a user with missing field', function(done) {
        chai.request(app)
          .post('/users/register')
          .send(invalidRegister)
          .then(res => {
            expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
            expect(res.body.error).to.equal("One or more fields left blank");
            done();
          })
          .catch(err => {
            done(err);
          });
      });

      it('Fail to login by invalid password', function(done) {
        chai.request(app)
          .post('/users/login')
          .send(invalidLogin)
          .then(res => {
            expect(res).to.have.status(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error).to.equal("Email and password do not match");
            done();
          })
          .catch(err => {
            done(err);
          });
      });

      it('Fail to login by missing field', function(done) {
        chai.request(app)
          .post('/users/login')
          .send(invalidLogin2)
          .then(res => {
            expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
            expect(res.body.error).to.equal("One or more fields left blank");
            done();
          })
          .catch(err => {
            done(err);
          });
      });
});