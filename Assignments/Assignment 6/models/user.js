const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const User = sequelize.define('user', {  
  email: {
    type: Sequelize.STRING,    
    allowNull: false,
    primaryKey: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  resetToken: Sequelize.STRING,
  resetTokenExpiration: Sequelize.DATE
});

module.exports = User;
