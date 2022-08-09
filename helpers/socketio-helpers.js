const users = []

const addUser = user => {
  if (users.some(u => u.account === user.account)) {
    return
  }
  users.push(user)
  console.log(users)
}

const removeUser = id => {
  const removeId = users.findIndex(user => user.id === id)
  users.splice(removeId, 1)
  // console.log(users)
}

const getUsers = room => {
  return users
}

module.exports = {
  addUser,
  getUsers,
  removeUser
}
