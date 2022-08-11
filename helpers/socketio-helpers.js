const users = []

const addUser = user => {
  if (users.some(u => u.account === user.account)) {
    return
  }
  users.push(user)
  // console.log(users)
  return user
}

const removeUser = socketId => {
  const removeId = users.findIndex(user => user.socketId === socketId)
  const user = users[removeId]

  users.splice(removeId, 1)
  return user
}

const getUsers = room => {
  return users
}

module.exports = {
  addUser,
  getUsers,
  removeUser
}
