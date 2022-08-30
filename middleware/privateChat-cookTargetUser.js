const { QueryTypes } = require('sequelize')
const { sequelize } = require('../models')
const privateMessageService = require('../services/privateMessage-service')

module.exports = async (req, res, next) => {
  const senderId = Number(req.user.id)
  const receiverId = req.body?.receiverId
  if (!receiverId) {
    // socket io won't have receiverId parsed in req.body
    req.privateChatInitialization.status = 'no-chat-history' // to make socket emit no-chat-history to frontend
    return next()
  }
  const { privateUsersList } = req.privateChatInitialization
  const privateMessages = await privateMessageService.getPrivateMessages(senderId, receiverId)
  // if chatroom NOT exists
  if (privateMessages.length === 0) {
    // if no message, it won't exist in privateUsersList so query this user and push it to the top of privateUsersList
    const queryString = 'SELECT Users.`id` as `userId`, Users.`name`, Users.`account`, Users.`avatar` FROM Users WHERE Users.`id` = ' + receiverId + ';'
    const targetUser = await sequelize.query(queryString, { type: QueryTypes.SELECT })
    targetUser[0].latestMessage = {
      message: null,
      sender: senderId
    }

    if (privateUsersList) {
      privateUsersList.unshift(targetUser[0])
    } else {
      req.privateChatInitialization.privateUsersList = targetUser
    }
    // delete historyMessages so handlebars renders no message
    delete req.privateChatInitialization.historyMessages
  } else if (privateMessages.length > 0) {
    // move that user to the first of privateUsersList
    let targetIndex = 0
    for (const user of privateUsersList) {
      if (user.userId === receiverId) {
        break
      }
      targetIndex++
    }
    const targetUser = privateUsersList.splice(targetIndex, 1)[0]
    privateUsersList.unshift(targetUser)

    // replace historyMessages with privateMessages we have here
    req.historyMessages = privateMessages
  }

  next()
}
