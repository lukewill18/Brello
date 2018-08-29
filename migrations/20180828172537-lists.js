'use strict';
const table = "lists";  
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      boardId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "boards",
          key: "id"
        },
        onDelete: "cascade"
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },

    });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable(table);
  }
};
