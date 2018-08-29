'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
    */
      return queryInterface.bulkInsert('Users', [{
        firstName: 'John',
        lastName: 'Doe',
        password: 'password',
        email: 'johndoe@gmail.com'
      }], {});
    
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.
    */
      return queryInterface.bulkDelete('Users', null, {});
  }
};
