'use strict';
const table = "cards";

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
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade",
      },
      listId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "lists",
          key: "id"
        },
        onDelete: "cascade"
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      }
    }).then(function() {
      return queryInterface.addIndex(table, ['name'], {indexName: 'cardNameIndex'});
    }).then(function() {
      return queryInterface.addIndex(table, ['order'], {indexName: 'cardOrderIndex'});
    }).then(function() {
      return queryInterface.addIndex(table, ['createdAt'], {indexName: 'cardCreatedAtIndex'});
    });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable(table);
  }
};
