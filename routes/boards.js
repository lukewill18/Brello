var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.get("/", function(req, res, next) {
    let uid = req.session.id;
    sequelize.query(`SELECT * FROM boards WHERE "ownerId" = ':id'`, {replacements: {id: uid}}).then(function(response) {
        res.json(response[0]);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "ID must be an integer"));
    });
});

module.exports = router;