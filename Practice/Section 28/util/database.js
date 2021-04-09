const {Sequelize} = require('sequelize');

const sequelize = new Sequelize('nodecompleterest', 'root', 'kartik1998@', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;
