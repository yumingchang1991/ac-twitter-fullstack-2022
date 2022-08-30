const privateMessageService = require('../../services/privateMessage-service')

const chatController = {
  getChatroomPublic: (req, res, next) => {
    res.render('chatroom-public')
  },
  getChatroomPrivate: (req, res, next) => {
    const dataWarehouse = req.privateChatInitialization
    const privateUsersList = dataWarehouse.privateUsersList
    dataWarehouse.senderName = privateUsersList ? privateUsersList[0].name : ''
    dataWarehouse.senderAccount = privateUsersList ? privateUsersList[0].account : ''
    dataWarehouse.senderId = privateUsersList ? privateUsersList[0].userId : ''
    dataWarehouse.senderAvatar = privateUsersList ? privateUsersList[0].avatar : ''
    dataWarehouse.historyMessages?.forEach(message => {
      const time = new Date(message.createdAt)
      message.createdAt = time.toLocaleString()
    })
    res.render('chatroom-private', {
      ...dataWarehouse
    })
  }
}

module.exports = chatController
