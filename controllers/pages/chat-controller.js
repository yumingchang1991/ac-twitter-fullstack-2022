const chatController = {
  getChatroomPublic: (req, res, next) => {
    res.render('chatroom-public')
  }
}

module.exports = chatController
