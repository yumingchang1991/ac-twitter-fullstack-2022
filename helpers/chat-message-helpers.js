const { QueryTypes } = require('sequelize')
const { PublicMessage, User, sequelize } = require('../models')

const dataProcessingHelper = {
  flattenAndRemoveUndefined (target) {
    return target.map(array => array[0]).filter(flattenedItem => flattenedItem !== undefined)
  },
  integrateUserAndMessage (usersList, messageList, receiverId) {
    for (const user of usersList) {
      const isAnyMessageFromSender = messageList.some(message =>
        Number(message.sender) === Number(user.userId))

      const messageInfo = messageList.filter(message => {
        if (!isAnyMessageFromSender) {
          return Number(message.receiver) === Number(user.userId) && Number(message.sender) === Number(receiverId)
        }
        return Number(message.receiver) === Number(receiverId) && Number(message.sender) === Number(user.userId)
      })
      user.latestMessage = messageInfo[0] || undefined
    }
    return usersList
  }
}

const chatHelpers = {
  savePublicMessage (UserId, message) {
    return PublicMessage
      .create({
        UserId,
        message
      })
      .catch(err => {
        throw new Error(err)
      })
  },
  getPublicMessages (res) {
    PublicMessage
      .findAll({
        raw: true,
        nest: true,
        include: User
      })
      .then(messages => {
        const isSameDay = dateString => {
          const date = new Date(dateString)
          const now = new Date()
          if (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
          ) {
            return true
          }
          return false
        }
        const result = messages.map(m => ({
          avatar: m.User.avatar,
          message: m.message,
          createdAt: isSameDay(m.createdAt) ? new Date(m.createdAt).toLocaleTimeString() : new Date(m.createdAt).toLocaleString()
        }))
        res.json({ messages: result })
      })
      .catch(err => {
        throw new Error(err)
      })
  },
  async getPrivateMessages (senderId, receiverId) {
    const queryPrivateMessages = 'SELECT `sender`, `receiver`, `message`, `createdAt` FROM PrivateMessages WHERE (`sender` = ' + senderId + ' AND `receiver` = ' + receiverId + ') or (`sender` = ' + receiverId + ' AND `receiver` = ' + senderId + ') ORDER BY `createdAt` DESC;'
    const privateMessages = await sequelize.query(queryPrivateMessages, { type: QueryTypes.SELECT })
    return privateMessages
  },
  async getPrivateUsersList (targetUserId) {
    const queryPrivateMessages = '(SELECT sender AS `senderId`, Users.`name`, Users.`account`, Users.`avatar` FROM PrivateMessages LEFT JOIN Users ON `sender` = `Users`.`id` WHERE sender = ' + targetUserId + ' OR receiver = ' + targetUserId + ' ORDER BY PrivateMessages.`createdAt` DESC) UNION (SELECT receiver AS `senderId`, Users.`name`, Users.`account`, Users.`avatar` FROM PrivateMessages LEFT JOIN Users ON `receiver` = `Users`.`id` WHERE sender = ' + targetUserId + ' OR receiver = ' + targetUserId + ' ORDER BY PrivateMessages.`createdAt` DESC) ORDER BY `senderId` ASC;'
    const privateUsersList = await sequelize.query(queryPrivateMessages, { type: QueryTypes.SELECT })
    return privateUsersList
  },
  generateRoomName (senderId, receiverId) {
    // return value example: 'private-1-2'
    const PRIVATE = 'private'
    if (Number(senderId) > Number(receiverId)) {
      return `${PRIVATE}-${receiverId}-${senderId}`
    }
    return `${PRIVATE}-${senderId}-${receiverId}`
  },
  async appendLatestMessageToUser (receiverId, privateUsersList) {
    await Promise.all(Array.from(privateUsersList, (user, index) => {
      const queryPrivateMessageUsersList = 'SELECT CONCAT(SUBSTRING(`message`, 1, 17), "...") as `message`, `createdAt`, `sender`, `receiver` FROM PrivateMessages WHERE (`sender` = ' + user.userId + ' AND `receiver` = ' + receiverId + ') OR (`sender` = ' + receiverId + ' AND `receiver` = ' + user.userId + ') ORDER BY `createdAt` DESC;'
      return sequelize.query(queryPrivateMessageUsersList, { type: QueryTypes.SELECT })
    })).then(queryResults => {
      const cleanQueryResults = dataProcessingHelper.flattenAndRemoveUndefined(queryResults)
      const finalResult = dataProcessingHelper.integrateUserAndMessage(privateUsersList, cleanQueryResults, receiverId)
      return finalResult
    })
  },
  sortMessageDateFromLatest (a, b) {
    if (a.latestMessage && b.latestMessage) {
      return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt)
    }
    if (!a.latestMessage && b.latestMessage) return 1
    if (a.latestMessage && !b.latestMessage) return -1
    return 0
  }
}

module.exports = chatHelpers
