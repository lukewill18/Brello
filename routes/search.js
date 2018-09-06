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
        const query = `SELECT (SELECT json_agg(DISTINCT jsonb_build_object('id', "b"."id", 'title', "b"."title")) FROM "boards" "b"
                                        LEFT JOIN "teams" "t" ON "t"."id" = "b"."teamId"
                                        LEFT JOIN "teamUsers" "tu" ON "tu"."teamId" = "t"."id"
                                        WHERE "title" LIKE concat('%', :search, '%') AND ("b"."ownerId" = :id OR "tu"."userId" = :id)) boards,
                            json_agg(DISTINCT jsonb_build_object('id', "c"."id", 'name', "c"."name", 'boardId', "b"."id", 'boardTitle', "b"."title")) cards
                            FROM "cards" "c"
                            INNER JOIN "lists" "l" ON "l"."id" = "c"."listId"
                            INNER JOIN "boards" "b" ON "b"."id" = "l"."boardId"
                            LEFT JOIN "teams" "t" ON "t"."id" = "b"."teamId"
                            LEFT JOIN "teamUsers" "tu" ON "tu"."teamId" = "t"."id"
                            WHERE "c"."name" LIKE concat('%', :search, '%') AND ("b"."ownerId" = :id OR "tu"."userId" = :id);`;
        sequelize.query(query, {replacements: {search: search, id: user_id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            res.json(response[0]);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid search query"));
        });
    }
});

module.exports = router;