var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var Sequelize = db.Sequelize;
var sequelize = db.sequelize;
var sockets = require("../socket.js").sockets;

var router = express.Router();

router.get("/", function(req, res, next) {
    res.render("login", {});
});

module.exports = router;