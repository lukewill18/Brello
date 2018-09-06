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
        onDelete: "cascade" },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }).then(function() {
      return queryInterface.addIndex(table, ['joinedAt'], {indexName: 'teamUserJoinedAtIndex'});
    });
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.dropTable(table);
  }
};
