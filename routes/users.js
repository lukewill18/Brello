var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.post('/register/', function(req, res, next) {  
  const {first_name, last_name, email, password} = req.body;
  if(first_name.trim() === "" || last_name.trim() === "" || email.trim() === "" || password.trim() === "")
    next(createError(HTTPStatus.BAD_REQUEST, "One or more fields left blank"));
  else {
    sequelize.query(`INSERT INTO "users" VALUES (DEFAULT, :first, :last, :pass, :email) RETURNING id`, 
        {replacements: {first: first_name.trim(), last: last_name.trim(), pass: password.trim(), email: email.trim()}}).then(function(response) {
            req.session.id = response[0][0].id;
            res.status(HTTPStatus.CREATED).json(response[0][0]);
            //res.render("../views/boards", {});
          }).catch(function(err) {
            let error = err;
            switch (err.name) {
              case 'SequelizeUniqueConstraintError': {
                error = createError(HTTPStatus.CONFLICT, "Email already registered");
              }
              default:
                break;
            }
              next(error);
          });
  }
});

router.post("/login/", function(req, res, next) {
  const {email, password} = req.body;
  if(email.trim() === "" || password.trim() === "")
    next(createError(HTTPStatus.BAD_REQUEST, "One or more fields left blank"));
  else {
    sequelize.query(`SELECT "id" FROM "users" WHERE "email" = :email AND "password" = :password`, 
    {replacements: {email: email.trim(), password: password.trim()}}).then(function(response) {
      if(response[0].length > 0) {
        req.session.id = response[0][0].id;
        res.json(response[0][0]);
        //res.render("../views/boards", {});
      }
      else {
        next(createError(HTTPStatus.UNAUTHORIZED, "Email and password do not match"));
      }
    });
  }
});

module.exports = router;
