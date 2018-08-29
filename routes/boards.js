var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
let moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;
var Sequelize = db.Sequelize;

var router = express.Router();

router.get("/", function(req, res, next) {
    res.render("boards", {});
});

router.get("/personal", function(req, res, next) {
    let uid = req.session.id;
    sequelize.query(`SELECT * FROM boards WHERE "ownerId" = :id`, {replacements: {id: uid}}).then(function(response) {
        res.json(response[0]);
    }).catch(function(thrown) {
        res.render("index", {});
        next(createError(HTTPStatus.BAD_REQUEST, "ID must be an integer"));
    });
});

router.get("/team/:id", function(req, res, next) {
    let uid = req.session.id;
    let teamId = req.params.id;
    if(teamId == undefined || teamId.trim() == "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid Team ID"));
    else {
        let query = `SELECT * FROM "boards" WHERE "teamId" = :teamId AND EXISTS (SELECT * FROM "teamUsers" WHERE "teamId" = :teamId AND "userId" = :uid)`;
        sequelize.query(query, {replacements: {teamId: teamId, uid: uid}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            res.json(response);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid Team ID"));
        });
    }
});

router.post("/", function(req, res, next) {
    let name = req.body.name;
    let teamId = req.body.teamId;
    let ownerId = req.session.id;
    if(ownerId == undefined || name == undefined || name.trim() == "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid input"));
    else {
        if(teamId != undefined) {
            let q1 = `SELECT * FROM "teamUsers" WHERE "teamId" = :teamId`;
            sequelize.query(q1, {replacements: {teamId: teamId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
                if(response.length > 0 && response.find(function(obj) {
                    return obj.userId == ownerId;
                }) != undefined) {
                    let query = `INSERT INTO "boards" VALUES (DEFAULT, NULL, :teamid, :title, :lastviewed) RETURNING *`;
                    sequelize.query(query, {replacements: {teamid: teamId, title: name.trim(), lastviewed: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                        res.json(response[0][0]);
                    }).catch(function(thrown) {
                        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Problem inserting board"));
                    });
                }
                else {
                    next(createError(HTTPStatus.BAD_REQUEST, "Invalid team ID"));
                }
            }).catch(function(thrown) {
                next(createError(HTTPStatus.BAD_REQUEST, "Invalid team ID"));
            });
        }
        else {
            let query = `INSERT INTO "boards" VALUES (DEFAULT, :ownerid, NULL, :title, :lastviewed) RETURNING *`;
            sequelize.query(query, {replacements: {ownerid: ownerId, title: name.trim(), lastviewed: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                res.json(response[0][0]);
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Problem inserting board"));
            });
        }
    }
});

module.exports = router;