var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.post('/register/', function(req, res, next) {  
  let {first_name, last_name, email, password} = req.body;
  if(first_name.trim() == "" || last_name.trim() == "" || email.trim() == "" || password.trim() == "")
    next(createError(HTTPStatus.BAD_REQUEST, "One or more fields left blank"));
  else {
      sequelize.query(`SELECT "email" FROM "users" WHERE "email" = :email`, {replacements: {email: email.trim()}}).then(function(response) {
        if(response[0].length > 0) {
          next(createError(HTTPStatus.BAD_REQUEST, "Account already exists with given email"));
        }
        else {
          sequelize.query(`INSERT INTO "users" VALUES (DEFAULT, :first, :last, :pass, :email) RETURNING id`, 
        {replacements: {first: first_name.trim(), last: last_name.trim(), pass: password.trim(), email: email.trim()}}).then(function(response) {
            req.session.id = response[0][0].id;
            res.setHeader(HTTPStatus.CREATED).json(response[0][0]);
            //res.render("../views/boards", {});
          }).catch(function(err) {
              res.json(err);
          });
        }
      });
  }
});

router.post("/login/", function(req, res, next) {
  let {email, password} = req.body;
  if(email.trim() == "" || password.trim() == "")
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
