'use strict';
const table = "comments";
module.exports = {
  up: (queryInterface, Sequelize) => { 
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      cardId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "cards",
          key: "id"
        },
        onDelete: "cascade"
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade"
      },
      datetime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      body: {
        type: Sequelize.STRING,
        allowNull: false
      }
    }).then(function() {
      return queryInterface.addIndex(table, ['datetime'], {indexName: 'commentDatetimeIndex'});
    });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable(table);
    
  }
};
