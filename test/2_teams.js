var chai = require('chai');
var expect = chai.expect;
var chaiHttp = require('chai-http');
var HTTPStatus = require('http-status');
var app = require('../app');

chai.use(chaiHttp);

const sampleRegister2 = {
    first_name: "Sample",
      last_name: "User 2",
      email: "test2@sample.com",
      password: "password"
}

const sampleLogin = {
    email: "test@sample.com",
    password: "password"
}

var teamId;
var user2Id;

describe("Teams", function() {
    it('Successfully create a team', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/teams').send({name: "sample team"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.CREATED);
                        expect(res.body.name).to.eql("sample team");
                        teamId = res.body.id;
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to create a team with no name', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/teams').send({})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid team name or user id");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Get team ID associated with a team name', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.get('/teams/id/sample team')
                    .then(function(res) {
                        expect(res.body[0]).to.have.property('id');
                        expect(res.body[0].id).eql(teamId);
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });
    
      it('Create another user for testing', function(done) {
        chai.request(app)
          .post('/users/register')
          .send(sampleRegister2)
          .then(res => {
            expect(res).to.have.status(HTTPStatus.CREATED);
            expect(res.body).to.have.property('id');
            user2Id = res.body.id;
            done();
          })
          .catch(err => {
            done(err);
          });
      });

      it('Add a user to a team', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.patch('/teams/' + teamId.toString() + '/users').send({userId: user2Id})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.OK);
                        expect(res.body.id).to.eql(user2Id);
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to add a nonexistent user to a team', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.patch('/teams/' + teamId.toString() + '/users').send({userId: -1})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql('Invalid input; could not insert this user into table');
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Get all users in a team', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.get('/teams/' + teamId.toString() + '/users')
                    .then(function(res) {
                        expect(res.body).to.have.lengthOf(2);
                        expect(res.body[0].name).to.eql("Sample User");
                        expect(res.body[1].name).to.eql("Sample User 2");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Create a team board', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/boards').send({name: "sample team board", teamId: teamId})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.CREATED);
                        expect(res.body.title).to.eql("sample team board");
                        expect(res.body).to.have.property("ownerId");
                        expect(res.body.teamId).to.eql(teamId);
                        expect(res.body).to.have.property("createdAt");
                        expect(res.body).to.have.property("lastViewed");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
        });
});