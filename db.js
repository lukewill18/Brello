var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://project2:project2@localhost:5400/project2', {define: {timestamps: false}});

module.exports = sequelize;