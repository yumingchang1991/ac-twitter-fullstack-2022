const { createServer } = require('http')
const { Server } = require('socket.io')
const passport = require('passport')
const { socketioMiddleware } = require('../_helpers')
const chatHelpers = require('../helpers/chat-message-helpers')
const TEXT = {
  MYSTERIOUS_USER: 'mysterious user'
}
const connectedUsers = []

module.exports = (app, PORT, expressSession) => {
  const httpServer = createServer(app)
  const io = new Server(httpServer)

  io.use(socketioMiddleware(expressSession))
    .use(socketioMiddleware(passport.initialize()))
    .use(socketioMiddleware(passport.session()))

  io.on('connection', socket => {
    addConnectedUsers(socket, connectedUsers)

    io.emit('user-join-chat', {
      name: socket.request.user?.name || TEXT.MYSTERIOUS_USER,
      usersCount: io.engine.clientsCount,
      connectedUsers
    })

    socket.on('send-chat', message => {
      chatHelpers.savePublicMessage(socket.request.user.id, message)
      io.emit('render-chat', {
        socketId: socket.id,
        message,
        name: socket.request.user?.name || TEXT.MYSTERIOUS_USER,
        avatar: socket.request.user?.avatar
      })
    })

    socket.on('disconnecting', () => {
      removeConnectedUsers(socket, connectedUsers)
      io.emit('user-leave-chat', {
        name: socket.request.user?.name || TEXT.MYSTERIOUS_USER,
        usersCount: io.engine.clientsCount,
        leavingId: socket.request.user?.id,
        connectedUsers
      })
    })
  })

  httpServer.listen(PORT, () => console.log(`http server is listening on port${PORT}`))
}

function addConnectedUsers (socket, connectedUsers) {
  const socketId = socket.id
  const sessionId = socket.request.sessionID
  const userObj = socket.request.user
  if (userObj) {
    const result = {
      sessionId,
      socketId,
      userId: userObj.id,
      account: userObj.account,
      name: userObj.name,
      avatar: userObj.avatar
    }
    if (!connectedUsers.some(user => user.id === result.userId)) {
      return connectedUsers.push(result)
    }
    for (const user of connectedUsers) {
      if (user.id === result.userId) {
        user.socketId = result.socketId
        user.sessionId = result.sessionId
        break
      }
    }
  }
}

function removeConnectedUsers (socket, connectedUsers) {
  let currentIndex = 0
  for (const user of connectedUsers) {
    if (user.socketId === socket.id) {
      connectedUsers.splice(currentIndex, 1)
    }
    currentIndex++
  }
}
