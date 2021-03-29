const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete1', 'root', 'kartik1998@', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;
