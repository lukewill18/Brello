var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var Sequelize = db.Sequelize;
var sequelize = db.sequelize;

var router = express.Router();

router.get("/", function(req, res, next) {
    res.redirect("/boards");
});

router.get("/:id", function(req, res, next) {
    let user_id = req.session.id;
    let query = `SELECT DISTINCT "l".*
                    FROM "lists" "l"
                    INNER JOIN "boards" b ON "b"."id" = :boardid
                    LEFT JOIN "teamUsers" tu ON "tu"."teamId" = "b"."teamId"
                    WHERE ("l"."ownerId" = :id OR "tu"."userId" = :id) AND "l"."boardId" = :boardid
                    ORDER BY "order" ASC`;
    sequelize.query(query, {replacements: {boardid: req.params.id, id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("lists", {lists: response, board_id: req.params.id})
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid board ID"));
    });
});

router.post("/", function(req, res, next) {
    let user_id = req.session.id;
    let query = `INSERT INTO "lists"
                    VALUES (DEFAULT, :id, :boardid, DEFAULT, :listname)
                    RETURNING *`;
    let {listname, boardId} = req.body;
    if(listname == undefined || boardId == undefined || listname.trim() == "" || boardId.trim() == "")
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid listname or board ID"));
    else {
        sequelize.query(query, {replacements: {id: user_id, boardid: boardId, listname: listname}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.json(response[0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid listname or board ID"));
        });
    }
});

module.exports = router;