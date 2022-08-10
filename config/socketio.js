const dayjs = require('dayjs')
const { addUser, getUsers, removeUser } = require('../helpers/socketio-helpers')

module.exports = io => {
  io.on('connection', socket => {
    console.log('a user is connected')

    socket.on('user connected', data => {
      const user = JSON.parse(data)
      user.id = socket.id

      socket.userdata = addUser(user)
      io.emit('updateUserList', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}上線`)
    })

    socket.on('chat message', msg => {
      const time = dayjs(new Date()).format('a HH:mm')

      socket.emit('chat message', JSON.stringify({ ...socket.userdata, msg, selfMsg: true, time }))
      socket.broadcast.emit('chat message', JSON.stringify({ ...socket.userdata, msg, time }))
    })

    socket.on('disconnect', () => {
      console.log('a user disconnect')
      const user = removeUser(socket.id)

      io.emit('updateUserList', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}離線`)
    })
  })
}
