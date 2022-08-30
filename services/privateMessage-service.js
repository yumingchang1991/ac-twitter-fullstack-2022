const { QueryTypes } = require('sequelize')
const { PrivateMessage, sequelize } = require('../models')

const privateMessageServices = {
  async getPrivateMessages (senderId, receiverId) {
    const queryPrivateMessages = 'SELECT `id`, `isRead`, `sender`, `receiver`, `message`, `createdAt` FROM PrivateMessages WHERE (`sender` = ' + senderId + ' AND `receiver` = ' + receiverId + ') or (`sender` = ' + receiverId + ' AND `receiver` = ' + senderId + ') ORDER BY `createdAt` ASC;'
    const privateMessages = await sequelize.query(queryPrivateMessages, { type: QueryTypes.SELECT })
    return privateMessages
  },
  async getPrivateUsersList (targetUserId) {
    const queryPrivateMessages = 'SELECT * FROM ((SELECT sender AS `userId`, Users.`name`, Users.`account`, Users.`avatar` FROM PrivateMessages LEFT JOIN Users ON`sender` = `Users`.`id` WHERE(sender = ' + targetUserId + ' OR receiver = ' + targetUserId + ') ORDER BY PrivateMessages.`createdAt` DESC) UNION (SELECT receiver AS`userId`, Users.`name`, Users.`account`, Users.`avatar` FROM PrivateMessages LEFT JOIN Users ON`receiver` = `Users`.`id` WHERE(sender = ' + targetUserId + ' OR receiver = ' + targetUserId + ') ORDER BY PrivateMessages.`createdAt` DESC)) as UnionTable WHERE UnionTable.`userId` <> ' + targetUserId + ' ORDER BY UnionTable.`userId` ASC;'
    const privateUsersList = await sequelize.query(queryPrivateMessages, { type: QueryTypes.SELECT })
    return privateUsersList
  },
  async addMessage (receiver, sender, message) {
    const newMessage = {}
    await PrivateMessage
      .create({
        receiver,
        sender,
        message,
        isRead: false
      })
      .then(a => {
        Object.assign(newMessage, a.toJSON())
      })
      .catch(err => {
        throw new Error(err)
      })
    return newMessage
  },
  async setMessagesRead (senderId, receiverId) {
    const queryString = 'UPDATE PrivateMessages AS a SET a.`isRead` = 1 WHERE a.`id` IN (SELECT`id` FROM (SELECT`id`, `sender`, `receiver`, `isRead` FROM PrivateMessages) AS b WHERE b.`sender` = ' + senderId + ' AND b.`receiver` = ' + receiverId + ' AND b.isRead = 0);'
    const [a, countUnreadPrivateMessages] = await sequelize.query(queryString, { type: QueryTypes.UPDATE })
    return countUnreadPrivateMessages
  },
  async countUnreadPrivateMessages (receiverId, senderId = null) {
    const queryString = {
      value: ''
    }
    if (senderId) {
      queryString.value = 'SELECT COUNT(`id`) AS `unreadCount` FROM PrivateMessages WHERE `receiver` = ' + receiverId + ' AND `sender` = ' + senderId + ' AND `isRead` = 0;'
    } else {
      queryString.value = 'SELECT COUNT(`id`) AS `unreadCount` FROM PrivateMessages WHERE`receiver` = ' + receiverId + ' AND `isRead` = 0;'
    }
    const results = await sequelize.query(queryString.value, { type: QueryTypes.SELECT })
    const countUnreadPrivateChat = results[0].unreadCount
    return countUnreadPrivateChat
  }
}

module.exports = privateMessageServices
