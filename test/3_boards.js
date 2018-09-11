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

var sampleBoardId;
var sampleListId;
var sampleCardId;
var sampleLabelId;

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
                        sampleBoardId = res.body.id;  
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
                      console.log(res.body);
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

describe('Lists', function() {
    it('Successfully create a list', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/lists').send({boardId: sampleBoardId, listname: "sample list"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.CREATED);
                        expect(res.body.name).to.eql("sample list");
                        expect(res.body.order).to.eql(null);
                        expect(res.body).to.have.property("ownerId");
                        expect(res.body).to.have.property("createdAt");
                        expect(res.body).to.have.property("id");
                        sampleListId = res.body.id;
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to create a list with no name', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/lists').send({boardId: sampleBoardId})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid listname or board ID");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to create a list with an invalid board ID', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/lists').send({boardId: -100, listname: "list"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid listname or board ID");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Successfully edit a list name', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.patch('/lists/' + sampleListId.toString()).send({name: "sample list with a new name"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.OK);
                        expect(res.body.name).to.eql("sample list with a new name");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to edit a list by not supplying a new name', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.patch('/lists/' + sampleListId.toString()).send({})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid new name");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });
}); 

describe('Cards', function() {
    it('Successfully create a card', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards').send({listId: sampleListId, name: "sample card"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.CREATED);
                        expect(res.body.name).to.eql("sample card");
                        expect(res.body).to.have.property("id");
                        sampleCardId = res.body.id;
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

    it('Fail to create a card with no name', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards').send({listId: sampleListId})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid name or list ID");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
    });

    it('Fail to create a card with invalid list ID', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards').send({listId: -100, name: "card"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid request; could not create card");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
    });

    it('Successfully edit card description', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.patch('/cards/' + sampleCardId.toString() + '/description').send({description: "sample description"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.OK);
                        expect(res.body.description).to.eql("sample description");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to edit card description by not providing a new one', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.patch('/cards/' + sampleCardId.toString() + '/description').send({description: "   "})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Missing new description");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Successfully add a comment', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards/' + sampleCardId.toString() + '/comment').send({comment: "sample comment"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.CREATED);
                        expect(res.body.body).to.eql("sample comment");
                        expect(res.body.name).to.eql("Sample User");
                        expect(res.body).to.have.property("id");
                        expect(res.body).to.have.property("cardId");
                        expect(res.body).to.have.property("userId");
                        expect(res.body).to.have.property("datetime");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to add a comment by not providing a body', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards/' + sampleCardId.toString() + '/comment').send({comment: ""})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Missing commment");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to edit a card by not providing a valid card ID', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards/asdf/comment').send({comment: "asdf"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.UNAUTHORIZED);
                        expect(res.body.error).to.eql("User does not have access to this card");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Successfully add a label', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards/' + sampleCardId.toString() + '/label').send({name: "sample label"})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.CREATED);
                        expect(res.body).to.have.property("labelId");
                        sampleLabelId = res.body.labelId;
                        expect(res.body.cardId).to.eql(sampleCardId);
                        expect(res.body).to.have.property("addedAt");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to add a label by not providing a name', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.post('/cards/' + sampleCardId.toString() + '/label').send({})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Missing label name");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Successfully get all card information', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.get('/cards/' + sampleCardId.toString())
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.OK);
                        expect(res.body).to.have.property("id");
                        expect(res.body.name).to.eql("sample card");
                        expect(res.body.listname).to.eql("sample list with a new name");
                        expect(res.body.description).to.eql("sample description");
                        expect(res.body.comments).to.have.lengthOf(1);
                        expect(res.body.comments[0].body).to.eql("sample comment");
                        expect(res.body.labels).to.have.lengthOf(1);
                        expect(res.body.labels[0].name).to.eql("sample label");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Successfully delete a label', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.delete('/cards/' + sampleCardId.toString() + '/label').send({labelId: sampleLabelId})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.OK);
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });

      it('Fail to delete a label by not providing an ID', function(done) {
        var agent = chai.request.agent(app);
        agent
            .post('/users/login')
            .send(sampleLogin)
            .then(res => {
                expect(res).to.have.cookie('session');
                return agent.delete('/cards/' + sampleCardId.toString() + '/label').send({})
                    .then(function(res) {
                        expect(res).to.have.status(HTTPStatus.BAD_REQUEST);
                        expect(res.body.error).to.eql("Invalid label ID");
                        done();
                    });
            })
            .catch(err => {
                done(err);
            });
      });
});