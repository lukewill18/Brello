var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.get("/id/:name", function(req, res, next) { // get team id associated with team name
    const name = req.params.name;
    if(name === undefined || name.toString().trim() === "") 
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

router.get("/:id/users", function(req, res, next) {
    const teamId = req.params.id;
    const user_id = req.session.id;
    const query = `SELECT "u"."id", concat("u"."firstName", ' ', "u"."lastName") AS name
                        FROM "teamUsers" "tu"
                        INNER JOIN "users" "u" ON "u"."id" = "tu"."userId"
                        WHERE "tu"."teamId" = :teamId
                        AND EXISTS (SELECT "userId" FROM "teamUsers" WHERE "teamId" = :teamId AND "userId" = :userId);`;
    sequelize.query(query, {replacements: {teamId: teamId, userId: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Could not find users; invalid input or you do not belong to the specified team"));
    });
});

router.patch("/:id/users", function(req, res, next) {
    const teamId = req.params.id;
    const userToAdd = req.body.userId;
    const user_id = req.session.id;
    if(userToAdd === undefined || userToAdd.toString().trim() === "") 
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid user Id"));
    else {
        const checkAccess = `SELECT "userId" FROM "teamUsers" WHERE "teamId" = :teamId AND "userId" = :userId;`;
        sequelize.query(checkAccess, {replacements: {teamId: teamId, userId: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            if(response.length > 0) {
                const q1 = `SELECT "id", concat("firstName", ' ', "lastName") "name"
                                    FROM "users"
                                    WHERE "id" = :userToAdd;`;
                sequelize.query(q1, {replacements: {userToAdd: userToAdd}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
                    const q2 = `INSERT INTO "teamUsers"
                                    VALUES (:teamId, :userToAdd, :date);`;
                    const q1_response = response;
                    sequelize.query(q2, {replacements: {teamId: teamId, userToAdd: userToAdd, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                        res.json(q1_response[0]);   
                    }).catch(function(thrown) {
                        next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not insert this user into table"));
                    });                             
                }).catch(function(thrown) {
                    next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; no user found with such id"));
                });      
           }
            else {
                next(createError(HTTPStatus.UNAUTHORIZED, "User not allowed to access this team"));
            }
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not access team"));
        });

        
    }
});

/*
router.get("/", function(req, res, next) { // get all teams associated with user id
    const user_id = req.session.id;
    const query = `SELECT "t".* FROM "teamUsers" "tu"
                        INNER JOIN "teams" "t" ON "t"."id" = "tu"."teamId"
                        WHERE "tu"."userId" = :uid
                        ORDER BY "tu"."joinedAt" ASC;`;
    sequelize.query(teamUserQuery, {replacements: {uid: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        console.log(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid user ID"));
    });
});*/

router.post("/", function(req, res, next) {
    const team_name = req.body.name;
    const user_id = req.session.id;
    if(team_name === undefined || user_id === undefined || team_name.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid team name or user id"));
    }
    else {
        const query = `INSERT INTO "teams" VALUES (DEFAULT, :ownerid, :name) RETURNING *`;
        sequelize.query(query, {replacements: {ownerid: user_id, name: team_name.trim()}, type: sequelize.QueryTypes.INSERT}).then(function(response){
            const created_team = response[0][0];
            const query2 = `INSERT INTO "teamUsers" VALUES (:teamid, :userid, :date)`;
            sequelize.query(query2, {replacements: {teamid: created_team.id, userid: user_id, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                res.status(HTTPStatus.CREATED).json(created_team);
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Team could not be created"));
            });
        }).catch(function(thrown) {
            next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Team could not be created"));
        });
    }
});

module.exports = router;