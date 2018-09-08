var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require('moment');
var db = require("../models/index.js");
var Sequelize = db.Sequelize;
var sequelize = db.sequelize;

var router = express.Router();

function verifyAccess(req, res, next) {
    const user_id = req.session.id;
    const cardId = req.params.id;
    const query = `SELECT DISTINCT "c"."id" FROM "cards" "c"
                    INNER JOIN "lists" "l" ON "l"."id" = "c"."listId"
                    INNER JOIN "boards" "b" ON "b"."id" = "l"."boardId"
                    INNER JOIN "users" "u" ON "b"."ownerId" = "u"."id"
                    LEFT JOIN "teamUsers" "tu" ON "b"."teamId" = "tu"."teamId"
                    WHERE (:id = "b"."ownerId" OR :id = "tu"."userId") AND ("c"."id" = :cardId);`;
    sequelize.query(query, {replacements: {id: user_id, cardId: cardId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length === 0)
            next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this card"));
        else   
            next();
    }).catch(function(thrown) {
        next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this card"));
    });

}

router.get("/:id", verifyAccess, function(req, res, next) {
    const cardId = req.params.id;
    let card = {
        id: null,
        name: null,
        listname: null,
        description: null,
        comments: [],
        labels: []
    }
    const err_invalid = createError(HTTPStatus.BAD_REQUEST, "Invalid request; could not find card");
    const q1 = `SELECT "c"."id", "c"."name", "c"."description", "l"."name" "listName" FROM "cards" "c"
                    INNER JOIN "lists" "l" ON "c"."listId" = "l"."id"
                    WHERE "c"."id" = :cardId;`;

    const q2 = `SELECT "l".* FROM "labels" l
                LEFT JOIN "cardLabels" cl ON "cl"."cardId" = :cardId
                WHERE "l"."id" = "cl"."labelId"
                ORDER BY "cl"."addedAt" ASC;`;

    const q3 = `SELECT *, (SELECT concat("firstName", ' ', "lastName") FROM "users"
                    WHERE "id" = "c"."userId") "name"
                    FROM "comments" c
                    WHERE "cardId" = :cardId
                    ORDER BY "datetime" DESC;`;
    sequelize.query(q1, {replacements: {cardId: cardId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        let relevant = response[0];
        card.id = relevant.id;
        card.description = relevant.description;
        card.name = relevant.name;
        card.listname = relevant.listName;
        sequelize.query(q2, {replacements: {cardId: cardId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            card.labels = response;
            sequelize.query(q3, {replacements: {cardId: cardId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
                card.comments = response;
                res.json(card);
            }).catch(function(thrown) {
                next(err_invalid);
        });
        }).catch(function(thrown) {
            next(err_invalid);
        });
        //res.json(relevant);
    }).catch(function(thrown) {
        next(err_invalid);
    });
});

router.post("/", function(req, res, next) {
    const {name, listId} = req.body;
    const user_id = req.session.id;
    if(name === undefined || listId === undefined || name.toString().trim() === "" || listId.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid name or list ID"));
    }
    else {
        let query = `INSERT INTO "cards" VALUES (DEFAULT, :id, :listid, NULL, :date, :name, '') RETURNING "id", "name";`;
        sequelize.query(query, {replacements: {id: user_id, listid: listId, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z'), name: name.trim()}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.status(HTTPStatus.CREATED).json(response[0][0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid request; could not create card"));
        });
    }
});

router.patch("/:id/description", verifyAccess, function(req, res, next) {
    const cardId = req.params.id;
    const newDesc = req.body.description;
    if(newDesc === undefined || newDesc.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Missing new description"));
    else {
        const query = `UPDATE "cards"
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
    const user_id = req.session.id;
    const cardId = req.params.id;
    const comment = req.body.comment;
    if(comment === undefined || comment.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Missing commment"));
    else {
        const query = `INSERT INTO "comments" VALUES (DEFAULT, :cardId, :userId, :date, :comment)
                        RETURNING *, (SELECT concat("firstName", ' ', "lastName") FROM "users"
                        WHERE "id" = :userId) "name";`;
        sequelize.query(query, {replacements: {cardId: cardId, userId: user_id, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z'), comment: comment},
        type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.status(HTTPStatus.CREATED).json(response[0][0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Could not insert comment"));
        });
        
    }
});

router.post("/:id/label", verifyAccess, function(req, res, next) {
    const cardId = req.params.id;
    const name = req.body.name;
    if(name === undefined || name.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Missing label name"));
    else {
        const q1 = `INSERT INTO "labels"
                    VALUES (DEFAULT, :name)
                    ON CONFLICT (name)
                    DO NOTHING
                    RETURNING *;`;
        sequelize.query(q1, {replacements: {name: name}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
            const q2 = `INSERT INTO "cardLabels" VALUES ((SELECT "id" FROM "labels" WHERE "name" = :name), :cardId, :date)
                        RETURNING *;`;
            sequelize.query(q2, {replacements: {name: name, cardId: cardId, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                res.status(HTTPStatus.CREATED).json(response[0][0]);
            }).catch(function(thrown) {
                next(createError(HTTPStatus.BAD_REQUEST, "Label already belongs to card"));
            });
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Label could not be created"));
        });        
    }
});

router.delete("/:id/label", verifyAccess, function(req, res, next) {
    const cardId = req.params.id;
    const labelId = req.body.labelId;
    if(labelId === undefined || labelId.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid label ID"));
    else {
        const query = `DELETE FROM "cardLabels"
                        WHERE "cardId" = :cardId AND "labelId" = :labelId;`;
        sequelize.query(query, {replacements: {cardId: cardId, labelId: labelId}, type: sequelize.QueryTypes.DELETE}).then(function(response) {
            res.json(response);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Label could not be deleted"));
        });
    }
});

router.patch("/:id/list", verifyAccess, function(req, res, next) {
    const cardId = req.params.id;
    const {oldListId, newListId} = req.body;
    if(oldListId === undefined || oldListId.toString().trim() === "" || newListId === undefined || newListId.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid list ID(s)"));
    else {
        const query = `UPDATE "cards"
                            SET "listId" = :newListId
                            WHERE "id" = :cardId AND (SELECT "boardId" FROM "lists" WHERE "id" = :newListId) = (SELECT "boardId" FROM "lists" WHERE "id" = :oldListId);`;
        sequelize.query(query, {replacements: {newListId: newListId, oldListId: oldListId, cardId: cardId}, type: sequelize.UPDATE}).then(function(response) {
            res.json(response);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "List could not be updated"));
        });
    }
});
module.exports = router;