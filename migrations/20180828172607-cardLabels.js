'use strict';
const table = "cardLabels";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      labelId: { primaryKey: true, type: Sequelize.INTEGER,
      references: {
        model: "labels",
        key: "id"
      },
      onDelete: "cascade" },

      cardId: { primaryKey: true, type: Sequelize.INTEGER,
        references: {
          model: "cards",
          key: "id"
        },
        onDelete: "cascade" }
    });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable(table);
  }
};
