const privateMessageServices = require('../services/privateMessage-service')

const notification = {
  async countUnreadPrivateChat (req, res, next) {
  // req.notification.countUnreadPrivateChat
    const receiverId = req.user.id
    if (receiverId) {
      const countUnreadPrivateChat = await privateMessageServices.countUnreadPrivateMessages(receiverId, null)
      if (countUnreadPrivateChat && countUnreadPrivateChat > 0) {
        req.notification = { countUnreadPrivateChat }
        res.locals.notification = { countUnreadPrivateChat }
      }
    }
    return next()
  },
  async countUnreadPrivateChatIndividual (req, res, next) {
    if (req.privateChatInitialization) {
      const { privateUsersList } = req.privateChatInitialization
      if (privateUsersList) {
        const receiverId = req.user.id
        if (receiverId) {
          Promise
            .all(
              Array.from(privateUsersList, (user, index) => {
                const senderId = user.userId
                return privateMessageServices.countUnreadPrivateMessages(receiverId, senderId)
              })
            )
            .then(res => {
              let index = 0
              for (const user of privateUsersList) {
                if (res[index] > 0) {
                  user.unreadPrivateMessages = res[index]
                }
                index++
              }
              return next()
            })
        }
      }
    }
  }
}

module.exports = notification
