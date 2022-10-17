'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class TweetNotification extends Model {
    static associate (models) {
      // associations can be defined here
      TweetNotification.belongsTo(models.User, { foreignKey: 'UserId' })
      TweetNotification.belongsTo(models.Tweet, { foreignKey: 'TweetId' })
    }
  }
  TweetNotification.init({
    UserId: DataTypes.INTEGER,
    TweetId: DataTypes.INTEGER,
    isRead: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'TweetNotification',
    tableName: 'TweetNotifications'
  })

  return TweetNotification
}
