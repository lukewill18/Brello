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
    const boardId = req.params.id;
    const query = `SELECT DISTINCT "b"."id" FROM "boards" b
                        INNER JOIN "users" u ON "u"."id" = "b"."ownerId"
                        LEFT JOIN "teamUsers" tu ON "b"."teamId" = "tu"."teamId"
                        WHERE (:id = "b"."ownerId" OR :id = "tu"."userId") AND ("b"."id" = :boardId);`;
    sequelize.query(query, {replacements: {id: user_id, boardId: boardId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length === 0)
            next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this board"));
        else   
            next();
    }).catch(function(thrown) {
        next(createError(HTTPStatus.UNAUTHORIZED, "User does not have access to this board"));
    });
}

router.get("/", function(req, res, next) {
    res.redirect("/boards");
});

router.get("/:id", verifyAccess, function(req, res, next) {
    const user_id = req.session.id;
    const query = `SELECT * FROM (
                        SELECT DISTINCT ON ("l") "l".*, json_agg(DISTINCT "c".*) cards
                        FROM "lists" "l"
                        LEFT JOIN "cards" c ON "l"."id" = "c"."listId"
                        INNER JOIN "boards" b ON "b"."id" = :boardid
                        WHERE "l"."boardId" = :boardid
                        GROUP BY "l"."id"
                        ) info
                        ORDER BY "order" ASC, "createdAt" ASC;`;
    sequelize.query(query, {replacements: {boardid: req.params.id, id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        for(let i = 0; i < response.length; ++i) {
            if(response[i].cards[0] === null) {
                response[i].cards = [];
            }
        }
        res.render("lists", {lists: response, board_id: req.params.id})
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid board ID"));
    });
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
        sequelize.query(query, {replacements: {id: user_id, boardid: boardId, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z'), listname: listname}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.json(response[0][0]);
        }).catch(function(thrown) {
            console.log(thrown);
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid listname or board ID"));
        });
    }
});

router.patch("/:id/order/", verifyAccess, function(req, res, next) {
    const {listId, newOrder} = req.body;
    if(listId === undefined || newOrder === undefined || listId.toString().trim() === "" || newOrder.toString().trim() === "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid listname or board ID"));
    else {
        const query = `UPDATE "lists"
                            SET "order" = :newOrder
                            WHERE "id" = :listId
                            RETURNING "order";`;
        sequelize.query(query, {replacements: {newOrder: newOrder, listId: listId}, type: sequelize.QueryTypes.UPDATE}).then(function(response) {
            res.json(response);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid order or list ID"));
        });
    }
});

module.exports = router;