const { addUser, getUsers, removeUser } = require('../helpers/socketio-helpers')

module.exports = io => {
  io.on('connection', socket => {
    console.log('a user is connected')

    socket.on('user connected', data => {
      const user = JSON.parse(data)
      user.id = socket.id
      addUser(user)
      io.emit('addUser', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}上線`)
    })

    socket.on('chat message', msg => {
      io.emit('chat message', msg)
    })

    socket.on('disconnect', () => {
      console.log('a user disconnect')
      removeUser(socket.id)
    })
  })
}
