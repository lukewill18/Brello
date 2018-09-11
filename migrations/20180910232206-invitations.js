'use strict';

const table = "invitations";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      inviterId: { primaryKey: true, type: Sequelize.INTEGER,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "cascade" },

      teamId: { primaryKey: true, type: Sequelize.INTEGER,
        references: {
          model: "teams",
          key: "id"
        },
        onDelete: "cascade" },
        
      targetId: { primaryKey: true, type: Sequelize.INTEGER,
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