'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class PrivateMessage extends Model {
    static associate (models) {
      // PrivateMessage.belongsTo(models.User, { foreignKey: 'UserId' })
    }
  }
  PrivateMessage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    sender: DataTypes.INTEGER,
    receiver: DataTypes.INTEGER,
    message: DataTypes.TEXT,
    isRead: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'PrivateMessage',
    tableName: 'PrivateMessages'
  })
  return PrivateMessage
}
