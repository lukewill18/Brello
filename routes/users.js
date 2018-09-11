var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var bcrypt = require("bcrypt");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.post('/register/', function(req, res, next) {  
  const {first_name, last_name, email, password} = req.body;
  if(first_name === undefined || last_name === undefined || email === undefined || password === undefined ||
    first_name.toString().trim() === "" || last_name.toString().trim() === "" || email.toString().trim() === "" || password === "")
    next(createError(HTTPStatus.BAD_REQUEST, "One or more fields left blank"));
  else {
    bcrypt.hash(password, 10, function(err, hash) {
      if(err) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error hashing password"));
        return;
      }
      sequelize.query(`INSERT INTO "users" VALUES (DEFAULT, :first, :last, :pass, :email) RETURNING "id", concat("firstName", ' ', "lastName") "name"`, 
      {replacements: {first: first_name.trim(), last: last_name.trim(), pass: hash, email: email.trim()}}).then(function(response) {
          req.session.id = response[0][0].id;
          req.session.name = response[0][0].name;
          res.status(HTTPStatus.CREATED).json(response[0][0]);
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
    });
    
  }
});

router.post("/login/", function(req, res, next) {
  const {email, password} = req.body;
  if(email === undefined || password === undefined || email.toString().trim() === "" || password === "")
    next(createError(HTTPStatus.BAD_REQUEST, "One or more fields left blank"));
  else {
    sequelize.query(`SELECT "id", "password", concat("firstName", ' ', "lastName") "name" FROM "users" WHERE "email" = :email`, 
    {replacements: {email: email.trim()}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
      if(response.length === 0) {
        next(createError(HTTPStatus.BAD_REQUEST, "No account found with given email"));
      }
      else {
        bcrypt.compare(password, response[0].password, function(err, crypt_res) {
          if(err) {
            next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error decrypting password"));
            return;
          }
          if(crypt_res) {
            req.session.id = response[0].id;
            req.session.name = response[0].name;
            res.json({id: response[0].id});
          }
          else {
            next(createError(HTTPStatus.UNAUTHORIZED, "Email and password do not match"));
          }
        });
      }
    });
  }
});

router.get("/search/", function(req, res, next) {
  const name = req.query.name;
  const exclude = req.query.exclude.split(",");
  if(name === undefined)
    next(createError(HTTPStatus.BAD_REQUEST, "Invalid name"));
  else {
    if(exclude === undefined)
      exclude = -1;
    const query = `SELECT "id", concat("firstName", ' ', "lastName") AS name FROM "users"
                      WHERE concat("firstName", ' ', "lastName") LIKE concat('%', :name, '%');`;
    sequelize.query(query, {replacements: {name: name, exclude: exclude}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
      res.json(response.filter(function(u) {
        return exclude.indexOf(u.id.toString()) === -1;
      }));
    }).catch(function(thrown) {
      next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not search"));
    });
  }
});

module.exports = router;
