'use strict';
const table = "boards";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade",
      },
      teamId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "teams",
          key: "id"
        },
        onDelete: "cascade",
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastViewed: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(table);
  }
};
