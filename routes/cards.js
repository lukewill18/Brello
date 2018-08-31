var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var Sequelize = db.Sequelize;
var sequelize = db.sequelize;

var router = express.Router();

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
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid name or list ID"));
    else {
        let query = `INSERT INTO "cards" VALUES (DEFAULT, :id, :listid, DEFAULT, :name, '') RETURNING "id", "name";`;
        sequelize.query(query, {replacements: {id: user_id, listid: listId, name: name.trim()}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.json(response[0][0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid request; could not create card"));
        });
    }
});

module.exports = router;