'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
          return queryInterface.sequelize.query(`ALTER TABLE "boards" ADD COLUMN "titleVector" tsvector;`
      ).then(function() {
          return queryInterface.sequelize.query(`UPDATE "boards" SET "titleVector" = to_tsvector('english', "title")`);
      }).then(function() {
          return queryInterface.sequelize.query(`CREATE INDEX "title_search_index" ON "boards" USING GIN ("titleVector")`);
      }).then(function() {
          return queryInterface.sequelize.query(`ALTER TABLE "cards" ADD COLUMN "nameVector" tsvector;`);
      }).then(function() {
          return queryInterface.sequelize.query(`UPDATE "cards" SET "nameVector" = to_tsvector('english', "name")`);
      }).then(function() {
          return queryInterface.sequelize.query(`CREATE INDEX "name_search_index" ON "cards" USING GIN ("nameVector")`);
      });
  },

  down: (queryInterface, Sequelize) => {
  }
};
