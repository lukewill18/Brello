'use strict';
const table = "teamUsers";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      teamId: { primaryKey: true, type: Sequelize.INTEGER,
      references: {
        model: "teams",
        key: "id"
      },
      onDelete: "cascade" },
      userId: { primaryKey: true, type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade" }
    });
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.dropTable(table);
  }
};
