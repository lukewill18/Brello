var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
let moment = require('moment');
var db = require("../models/index.js");
var Sequelize = db.Sequelize;
var sequelize = db.sequelize;

var router = express.Router();

function verifyAccess(req, res, next) {
    let user_id = req.session.id;
    let cardId = req.params.id;
    let query = `SELECT DISTINCT "c"."id" FROM "cards" "c"
                    INNER JOIN "lists" "l" ON "l"."id" = "c"."listId"
                    INNER JOIN "boards" "b" ON "b"."id" = "l"."boardId"
                    INNER JOIN "users" "u" ON "b"."ownerId" = "u"."id"
                    LEFT JOIN "teamUsers" "tu" ON "b"."teamId" = "tu"."teamId"
                    WHERE (:id = "b"."ownerId" OR :id = "tu"."userId") AND ("c"."id" = :cardId);`;
    sequelize.query(query, {replacements: {id: user_id, cardId: cardId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length == 0)
            next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this card"));
        else   
            next();
    }).catch(function(thrown) {
        next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this card"));
    });

}

router.get("/:id", function(req, res, next) {
    let user_id = req.session.id;
    let cardId = req.params.id;
    let query = `SELECT DISTINCT ON ("c") "c"."id", "c"."description", json_agg(DISTINCT "lab".*) "labels",
                    json_agg(DISTINCT jsonb_build_object('id', "com"."id", 'userFirst', "u"."firstName", 'userLast', "u"."lastName", 'date', "com"."datetime", 'body', "com"."body")) "comments"
                    FROM "cards" c
                    INNER JOIN "lists" l ON "l"."id" = "c"."listId"
                    INNER JOIN "boards" b ON "l"."boardId" = "b"."id"
                    LEFT JOIN "teamUsers" tu ON "tu"."teamId" = "b"."teamId"
                    LEFT JOIN "cardLabels" cl ON "c"."id" = "cl"."cardId"
                    LEFT JOIN "labels" lab ON "lab"."id" = "cl"."labelId"
                    LEFT JOIN "comments" com ON "com"."cardId" = "c"."id"
                    LEFT JOIN "users" "u" ON "u"."id" = "com"."userId"
                    WHERE "c"."id" = :cardId AND ("tu"."userId" = :id OR "b"."ownerId" = :id)
                    GROUP BY "c"."id";`;
    sequelize.query(query, {replacements: {cardId: cardId, id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        let relevant = response[0];
        if(relevant.comments[0].id == null)
            relevant.comments = [];
        if(relevant.labels[0] == null)
            relevant.labels = [];
        res.json(relevant);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid request; could not find card"));
    });
});

router.post("/", function(req, res, next) {
    let {name, listId} = req.body;
    let user_id = req.session.id;
    if(name == undefined || listId == undefined || name.trim() == "" || listId.trim() == "")
        {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid name or list ID"));
        }
    else {
        let query = `INSERT INTO "cards" VALUES (DEFAULT, :id, :listid, DEFAULT, :name, '') RETURNING "id", "name";`;
        sequelize.query(query, {replacements: {id: user_id, listid: listId, name: name.trim()}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.json(response[0][0]);
        }).catch(function(thrown) {
            console.log(thrown);
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid request; could not create card"));
        });
    }
});

router.patch("/:id/description", verifyAccess, function(req, res, next) {
    let cardId = req.params.id;
    let newDesc = req.body.description;
    if(newDesc == undefined || newDesc.trim() == "")
        next(createError(HTTPStatus.BAD_REQUEST, "Missing new description"));
    else {
        let query = `UPDATE "cards"
                        SET "description" = :newDesc
                        WHERE "id" = :cardId
                        RETURNING "description";`;
        sequelize.query(query, {replacements: {newDesc: newDesc.trim(), cardId: cardId}, type: sequelize.QueryTypes.UPDATE}).then(function(response) {
            res.json(response[0][0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid request; could not update description"));
        });
    }
});

router.post("/:id/comment", verifyAccess, function(req, res, next) {
    let user_id = req.session.id;
    let cardId = req.params.id;
    let comment = req.body.comment;
    if(comment == undefined || comment.trim() == "")
        next(createError(HTTPStatus.BAD_REQUEST, "Missing commment"));
    else {
        let query = `INSERT INTO "comments" VALUES (DEFAULT, :cardId, :userId, :date, :comment)
                        RETURNING *, (SELECT concat("firstName", ' ', "lastName") FROM "users"
                        WHERE "id" = :userId) "name";`;
        sequelize.query(query, {replacements: {cardId: cardId, userId: user_id, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z'), comment: comment},
        type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.json(response[0][0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Could not insert comment"));
        });
        
    }
});

router.post("/:id/label", verifyAccess, function(req, res, next) {
    let cardId = req.params.id;
    let name = req.body.name;
    if(name == undefined || name.trim() == "")
        next(createError(HTTPStatus.BAD_REQUEST, "Missing label name"));
    else {
        let q1 = `INSERT INTO "labels"
                    VALUES (DEFAULT, :name)
                    ON CONFLICT (name)
                    DO NOTHING
                    RETURNING *;`;
        sequelize.query(q1, {replacements: {name: name}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
            let q2 = `INSERT INTO "cardLabels" VALUES ((SELECT "id" FROM "labels" WHERE "name" = :name), :cardId)
                        RETURNING *;`;
            sequelize.query(q2, {replacements: {name: name, cardId: cardId}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                res.json(response);
            }).catch(function(thrown) {
                console.log(thrown);
                next(createError(HTTPStatus.BAD_REQUEST, "label already belongs to card"));
            });
        }).catch(function(thrown) {
            console.log(thrown);
            next(createError(HTTPStatus.BAD_REQUEST, "label could not be created"));
        });

        
    }
});
module.exports = router;