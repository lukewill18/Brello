var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var Sequelize = db.Sequelize;
var sequelize = db.sequelize;

var router = express.Router();

function verifyAccess(req, res, next) {
    const user_id = req.session.id;
    const listId = req.params.id;
    const query = `SELECT DISTINCT "l"."id" FROM "lists" "l"
                        INNER JOIN "boards" "b" ON "b"."id" = "l"."boardId"
                        INNER JOIN "users" "u" ON "b"."ownerId" = "u"."id"
                        LEFT JOIN "teamUsers" "tu" ON "b"."teamId" = "tu"."teamId"
                        WHERE (:id = "b"."ownerId" OR :id = "tu"."userId") AND ("l"."id" = :listId);`;
    sequelize.query(query, {replacements: {id: user_id, listId: listId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length === 0)
            next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this list"));
        else   
            next();
    }).catch(function(thrown) {
        next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this list"));
    });
}

router.get("/", function(req, res, next) {
    res.redirect("/boards");
});

router.post("/", function(req, res, next) {
    const user_id = req.session.id;
    const {listname, boardId} = req.body;
    if(listname === undefined || boardId === undefined || listname.toString().trim() === "" || boardId.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid listname or board ID"));
    else {
        const query = `INSERT INTO "lists"
                            VALUES (DEFAULT, :id, :boardid, NULL, :date, :listname)
                            RETURNING *`;
        sequelize.query(query, {replacements: {id: user_id, boardid: boardId, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z'), listname: listname}, 
                        type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.status(HTTPStatus.CREATED).json(response[0][0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid listname or board ID"));
        });
    }
});

router.patch("/:id/", verifyAccess, function(req, res, next) {
    const listId = req.params.id;
    const newName = req.body.name;
    if(newName === undefined || newName.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid new name"));
    else {
        const query = `UPDATE "lists"
                            SET "name" = :newName
                            WHERE "id" = :id
                            RETURNING "name";`;
        sequelize.query(query, {replacements: {newName: newName.trim(), id: listId}, type: sequelize.QueryTypes.UPDATE}).then(function(response) {
            res.json(response[0][0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Could not update list with given name"));
        });
    }
});

router.patch("/:id/cards/", verifyAccess, function(req, res, next) {
    const listId = req.params.id;
    const cards = req.body['cards[]'];
    if(cards === undefined || !Array.isArray(cards))
    {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid card array"));
    }
    else {
        let promises = [];
        for(let i = 0; i < cards.length; ++i) {
            const query = `UPDATE "cards"
                                SET "order" = :newOrder
                                WHERE "id" = :cardId AND "listId" = :listId`;
            promises.push(sequelize.query(query, {replacements: {newOrder: i, cardId: cards[i], listId: listId}, type: sequelize.QueryTypes.UPDATE}));
        }
        Promise.all(promises).then(function(resolves) {
            res.json(resolves);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not update card order"));
        });
        
    }
});

module.exports = router;