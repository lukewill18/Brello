var chai = require('chai');
var expect = chai.expect;
var chaiHttp = require('chai-http');
var HTTPStatus = require('http-status');
var app = require('../app');
chai.use(chaiHttp);

const sampleLogin = {
    email: "test@sample.com",
    password: "password"
}

describe('Boards', function() {
    it('Successfully create a personal board', function(done) {
      var agent = chai.request.agent(app);
      agent
          .post('/users/login')
          .send(sampleLogin)
          .then(res => {
              expect(res).to.have.cookie('session');
              return agent.post('/boards').send({name: "sample board"})
                  .then(function(res) {
                      expect(res).to.have.status(HTTPStatus.CREATED);
                      expect(res.body.title).to.eql("sample board");
                      expect(res.body).to.have.property("ownerId");
                      expect(res.body.teamId).to.eql(null);
                      expect(res.body).to.have.property("createdAt");
                      expect(res.body).to.have.property("lastViewed");
                      done();
                  });
          })
          .catch(err => {
              done(err);
          });
    });

    it('Create another board for testing', function(done) {
      var agent = chai.request.agent(app);
      agent
          .post('/users/login')
          .send(sampleLogin)
          .then(res => {
              expect(res).to.have.cookie('session');
              return agent.post('/boards').send({name: "sample board 2"})
                  .then(function(res) {
                      expect(res).to.have.status(HTTPStatus.CREATED);
                      expect(res.body.title).to.eql("sample board 2");
                      expect(res.body).to.have.property("ownerId");
                      expect(res.body.teamId).to.eql(null);
                      expect(res.body).to.have.property("createdAt");
                      expect(res.body).to.have.property("lastViewed");
                      done();
                  });
          })
          .catch(err => {
              done(err);
          });
    });

    it('Fail to create a board with no name', function(done) {
      var agent = chai.request.agent(app);
      agent
      .post('/users/login')
          .send(sampleLogin)
          .then(res => {
              expect(res).to.have.cookie('session');
              return agent.post('/boards').send({})
                .then(res => {
                  expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                  expect(res.body.error).to.equal("Invalid input");
                  done();
                });
            })
            .catch(err => {
              done(err);
            });
    });

    it('Get all boards', function(done) {
      var agent = chai.request.agent(app);
      agent
          .post('/users/login')
          .send(sampleLogin)
          .then(res => {
              expect(res).to.have.cookie('session');
              return agent.get('/boards/all')
                  .then(function(res) {
                      expect(res).to.have.status(HTTPStatus.OK);
                      expect(res.body[0].teamId).eql(null);
                      expect(res.body[0].boards).to.have.lengthOf(2);
                      expect(res.body[0].boards[0].title).to.eql("sample board");
                      expect(res.body[0].boards[1].title).to.eql("sample board 2");
                      expect(res.body[1].teamId).to.not.eql(null);
                      expect(res.body[1].boards).to.have.lengthOf(1);
                      expect(res.body[1].boards[0].title).to.eql("sample team board");
                      done();
                  });
          })
          .catch(err => {
              done(err);
          });
    });
    
    it('Get recent boards', function(done) {
      var agent = chai.request.agent(app);
      agent
          .post('/users/login')
          .send(sampleLogin)
          .then(res => {
              expect(res).to.have.cookie('session');
              return agent.get('/boards/recent')
                  .then(function(res) {
                      expect(res).to.have.status(HTTPStatus.OK);
                      expect(res.body).to.have.lengthOf(3);
                      expect(res.body[0].title).to.eql("sample board 2");
                      expect(res.body[1].title).to.eql("sample board");
                      expect(res.body[2].title).to.eql("sample team board");

                      done();
                  });
          })
          .catch(err => {
              done(err);
          });
    });

    it("Fail to create a board belonging to a team that doesn't exist", function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/boards').send({name: "sample team board", teamId: -100})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid team ID");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
    });
});