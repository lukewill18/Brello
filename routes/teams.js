var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var socket = require("../socket.js");
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
    const query = `SELECT "u"."id", concat("u"."firstName", ' ', "u"."lastName") AS name, FALSE AS "invited"
                        FROM "teamUsers" "tu"
                        INNER JOIN "users" "u" ON "u"."id" = "tu"."userId"
                        WHERE "tu"."teamId" = :teamId
                        AND EXISTS (SELECT "userId" FROM "teamUsers" WHERE "teamId" = :teamId AND "userId" = :userId)
                    UNION
                        (SELECT "i"."targetId", concat("u"."firstName", ' ', "u"."lastName") AS name, TRUE AS "invited"
                            FROM "invitations" "i"
                            INNER JOIN "users" "u" ON "u"."id" = "i"."targetId"
                            LEFT JOIN "teamUsers" "tu" ON "tu"."teamId" = :teamId
                            WHERE "i"."teamId" = :teamId AND "tu"."userId" = :userId)
                    ORDER BY "invited";`;
    sequelize.query(query, {replacements: {teamId: teamId, userId: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Could not find users; invalid input or you do not belong to the specified team"));
    });
});

router.get("/invitations", function(req, res, next) { //get all of your invitations
    const user_id = req.session.id;
    const query = `SELECT "i"."teamId", concat("u"."firstName", ' ', "u"."lastName") "name", "t"."name" "teamname"
                        FROM "invitations" "i"
                        INNER JOIN "users" "u" ON "u"."id" = "i"."inviterId"
                        INNER JOIN "teams" "t" ON "t".id = "i"."teamId"
                        WHERE "i"."targetId" = :id;`;
    sequelize.query(query, {replacements: {id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to retrieve invitations"));
    });
});

function checkInvitationAccess(req, res, next) { //check if user is not in team already / user has not been invited to team yet / inviter is in team 
    const teamId = req.params.id;
    const userToAdd = req.body.userId;
    const user_id = req.session.id;
    if(userToAdd === undefined || userToAdd.toString().trim() === "" || userToAdd.toString().trim() === user_id.toString().trim()) 
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid user Id"));
    else {
        const checkAccess = `SELECT "id" FROM "users"  
        WHERE EXISTS
                (SELECT * FROM "invitations"
                    WHERE "teamId" = :teamId AND "targetId" = :userToAdd)
        OR EXISTS
                (SELECT * FROM "teamUsers"
                    WHERE "teamId" = :teamId AND "userId" = :userToAdd)

        OR NOT EXISTS
                (SELECT * FROM "teamUsers"
                    WHERE "teamId" = :teamId AND "userId" = :id)
        LIMIT 1;`;
        sequelize.query(checkAccess, {replacements: {id: user_id, teamId: teamId, userToAdd: userToAdd}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            if(response.length > 0)
                next(createError(HTTPStatus.BAD_REQUEST, "Invalid invite: user is already in team, has already been invited, or inviter is not in team"));
            else
                next();
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUST, "Invalid user or team ID"));
        });
    }
}

router.post("/:id/invitation", checkInvitationAccess, function(req, res, next) {
    const teamId = req.params.id;
    const userToAdd = req.body.userId;
    const user_id = req.session.id;
    const query = `INSERT INTO "invitations"
                            VALUES (:id, :teamId, :userToAdd)
                            RETURNING *;`; 
    sequelize.query(query, {replacements: {id: user_id, teamId: teamId, userToAdd: userToAdd}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
        const target_sock = socket.getSockets()[userToAdd];
        const insertResponse = response[0];
        if(target_sock !== undefined) {
            sequelize.query(`SELECT concat("u"."firstName", ' ', "u"."lastName") "name", "t"."name" "teamname"
                                FROM "users" "u"
                                INNER JOIN "teams" "t" ON "t".id = :teamId
                                INNER JOIN "teamUsers" "tu" ON "tu"."teamId" = "t"."id"
                                WHERE "t"."id" = :teamId AND "tu"."userId" = :id AND "u"."id" = :id`, {replacements: {id: user_id, teamId: teamId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            if(response.length > 0)
                target_sock.emit("invitation", {inviter: response[0].name, teamId: teamId, teamname: response[0].teamname});
            }).catch(function(thrown) {
                next(createError(HTTPStatus.BAD_REQUEST, "No such team found available to given user"));
            });
        } 
        res.json(insertResponse);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Error creating invitation"));
    });
});

router.delete("/:id/invitation", function(req, res, next) {
    const user_id = req.session.id;
    const teamId = req.params.id;
    const query = `DELETE FROM "invitations"
                        WHERE "teamId" = :teamId AND "targetId" = :id`;
    sequelize.query(query, {replacements: {teamId: teamId, id: user_id}, type: sequelize.QueryTypes.DELETE}).then(function(response) {
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid team ID"));
    });
});

router.patch("/:id/users", function(req, res, next) {
    const teamId = req.params.id;
    const user_id = req.session.id;
    const checkInvite = `SELECT * FROM "invitations"
                            WHERE "teamId" = :teamId AND "targetId" = :id`;
    sequelize.query(checkInvite, {replacements: {teamId: teamId, id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length === 0)
            next(createError(HTTPStatus.UNAUTHORIZED, "User has not been invited to this team"));
        else {
            const removeInvite = `DELETE FROM "invitations"
                                    WHERE "teamId" = :teamId AND "targetId" = :id`;
            sequelize.query(removeInvite, {replacements: {teamId: teamId, id: user_id}, type: sequelize.QueryTypes.DELETE}).then(function(response) {
                const addUser = `INSERT INTO "teamUsers"
                                    VALUES (:teamId, :id, :date)
                                    RETURNING *`;
                sequelize.query(addUser, {replacements: {teamId: teamId, id: user_id, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, 
                    type: sequelize.QueryTypes.INSERT}).then(function(response) {
                        res.json(response[0][0]);
                    }).catch(function(thrown) {
                        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error adding user to team"));
                    });
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error removing invite from database"));
            });
        }
    });
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