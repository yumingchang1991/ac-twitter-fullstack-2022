const users = []

const addUser = user => {
  if (users.some(u => u.account === user.account)) {
    return
  }
  users.push(user)
  // console.log(users)
  return user
}

const removeUser = id => {
  const removeId = users.findIndex(user => user.id === id)
  const user = users[removeId]

  users.splice(removeId, 1)
  // console.log(user)
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
