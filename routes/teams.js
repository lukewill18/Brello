var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.get("/id/:name", function(req, res, next) { // get team id associated with team name
    let name = req.params.name;
    let user_id = req.session.id;
    if(name == undefined || name.trim() == "") 
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid input"));
    else {
        let q1 = `SELECT "id" FROM "teams" WHERE "name" = :name`;
        sequelize.query(q1, {replacements: {name: name}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            res.json(response);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid team name"));
        });
    }
});

router.get("/", function(req, res, next) { // get all teams associated with user id
    let user_id = req.session.id;
    if(user_id == undefined) {
        next(createError(HTTPStatus.UNAUTHORIZED, "No User ID found"));
    }
    let teamUserQuery = `SELECT "teamId" FROM "teamUsers" WHERE "userId" = :uid`;
    sequelize.query(teamUserQuery, {replacements: {uid: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length > 0) {
            let teamIds = response.map(function(t) {
                return t.teamId;
            });
            let teamQuery = `SELECT * FROM "teams" WHERE "id" IN (${teamIds.join(", ")})`
            sequelize.query(teamQuery, {type: sequelize.QueryTypes.SELECT}).then(function(response) {
                res.json(response);
            }).catch(function(thrown) {
                next(createError(HTTPStatus.NOT_FOUND, "Could not find any teams"));
            });
        }
        else {
            res.json([]);
        }
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid user ID"));
    });
});

router.post("/", function(req, res, next) {
    let team_name = req.body.name;
    let user_id = req.session.id;
    if(team_name == undefined || user_id == undefined || team_name.trim() == "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid team name or user id"));
    }
    else {
        let query = `INSERT INTO "teams" VALUES (DEFAULT, :name) RETURNING *`
        sequelize.query(query, {replacements: {name: team_name.trim()}, type: sequelize.QueryTypes.INSERT}).then(function(response){
            let created_team = response[0][0];
            let query2 = `INSERT INTO "teamUsers" VALUES (:teamid, :userid)`;
            sequelize.query(query2, {replacements: {teamid: created_team.id, userid: user_id}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                res.json(created_team);
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Team could not be created"));
            });
        }).catch(function(thrown) {
            next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Team could not be created"));
        });
    }
});

module.exports = router;