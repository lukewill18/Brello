var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var db = require("../models/index.js");
var Sequelize = db.Sequelize;
var sequelize = db.sequelize;

var router = express.Router();

router.get("/", function(req, res, next) {
    const search = req.query.query;
    const user_id = req.session.id;
    if(search === undefined)
        next(createError(HTTPStatus.BAD_REQUEST, "No search query provided"));
    else {
        let matches = {};
        const cardQuery = `SELECT DISTINCT jsonb_build_object('id', "c"."id", 'name', "c"."name", 'boardId', "b"."id", 'boardTitle', "b"."title") "match", ts_rank_cd("c"."nameVector", to_tsquery('english', :search)) "rank"
                                FROM "cards" "c"
                                INNER JOIN "lists" "l" ON "l"."id" = "c"."listId"
                                INNER JOIN "boards" "b" ON "b"."id" = "l"."boardId"
                                LEFT JOIN "teams" "t" ON "t"."id" = "b"."teamId"
                                LEFT JOIN "teamUsers" "tu" ON "tu"."teamId" = "t"."id"
                                WHERE "c"."nameVector" @@ to_tsquery('english', :search) AND ("b"."ownerId" = :id OR "tu"."userId" = :id)
                                ORDER BY RANK DESC;`;
        const boardQuery = `SELECT DISTINCT jsonb_build_object('id', "b"."id", 'title', "b"."title") "match", ts_rank_cd("b"."titleVector", to_tsquery('english', :search)) "rank" FROM "boards" "b"
                                LEFT JOIN "teams" "t" ON "t"."id" = "b"."teamId"
                                LEFT JOIN "teamUsers" "tu" ON "tu"."teamId" = "t"."id"
                                WHERE "b"."titleVector" @@ to_tsquery('english', :search) AND ("b"."ownerId" = :id OR "tu"."userId" = :id)
                                ORDER BY RANK DESC;`;
        sequelize.query(cardQuery, {replacements: {search: search.split(" ").join("& "), id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(cardMatches) {
            matches.cards = cardMatches;
            sequelize.query(boardQuery, {replacements: {search: search.split(" ").join("& "), id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(boardMatches) {
                matches.boards = boardMatches;
                res.json(matches);
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error searching boards"));
            });
        }).catch(function(thrown) {
            next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error searching cards"));
        });
    }
});

module.exports = router;