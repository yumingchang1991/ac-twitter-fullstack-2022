const socket = io()
const connectedUsersList = document.querySelector('ul#connected-users-list')
const chatMessageList = document.querySelector('ul#chat-message-list')
const chatMessage = document.querySelector('input#chatMessage')
const sendButton = document.querySelector('div.send-button')

socket.on('connect', handleConnect)
socket.on('user-join-chat', data => {
  chatMessageList.appendChild(createUserJoinMessage(data, true))
  chageUsersCount(data.usersCount)
  renderUsersList(data.connectedUsers, true)
})
socket.on('render-chat', data => {
  const messageElement = createChatMessageElement(socket, data)
  chatMessageList.appendChild(messageElement)
})
socket.on('user-leave-chat', data => {
  chatMessageList.appendChild(createUserJoinMessage(data, false))
  chageUsersCount(data.usersCount)
  renderUsersList(data.connectedUsers, false)
})

// sending message to server
chatMessage.addEventListener('keyup', sendChatMessage)
sendButton.addEventListener('click', sendChatMessage)

function handleConnect () {
  axios
    .get('/apis/users/chatroom/public/initialization')
    .then(res => {
      console.log(res.data)
    })
}

function sendChatMessage (e) {
  if (e.key === 'Enter' || e.type === 'click') {
    const messageToSend = chatMessage.value
    socket.emit('send-chat', messageToSend)
    chatMessage.value = ''
  }
}

function createUserJoinMessage (data, isJoin = true) {
  const li = document.createElement('li')
  li.classList.add('list-group-item', 'border-0', 'mx-auto')

  const span = document.createElement('span')
  span.textContent = `${data.name} ${isJoin ? '上線囉！👋' : '下線了...🐾'}`
  span.classList.add('badge', 'rounded-pill', 'text-bg-secondary')

  li.appendChild(span)

  return li
}

function chageUsersCount (usersCount) {
  const connectionCount = document.querySelector('span#connection-count')
  connectionCount.textContent = usersCount
}

function renderUsersList (latestUsers, isAdd = true) {
  const latestUserIds = latestUsers.map(user => Number(user.userId))
  const renderedUserElements = document.querySelectorAll('ul#connected-users-list li')
  const renderedUserIds = []
  const idToRemove = []
  const idToAdd = []

  for (const element of renderedUserElements) {
    renderedUserIds.push(Number(element.dataset.userid))
  }

  for (const latestId of latestUserIds) {
    if (!renderedUserIds.includes(latestId)) {
      idToAdd.push(latestId)
    }
  }

  for (const renderedId of renderedUserIds) {
    if (!latestUserIds.includes(renderedId)) {
      idToRemove.push(renderedId)
    }
  }

  if (idToAdd.length > 0) addUserListItems(idToAdd, latestUsers)

  if (idToRemove.length > 0) removeUserListItems(idToRemove, renderedUserElements)
}

function addUserListItems (idToAdd, usersArray) {
  for (const user of usersArray) {
    if (idToAdd.includes(user.userId)) {
      const userListItem = createUserListItem(user)
      connectedUsersList.appendChild(userListItem)
    }
  }
}

function createUserListItem (user) {
  const userListItem = document.createElement('li')
  userListItem.classList.add('list-group-item', 'list-group-item-action', 'border-0', 'border-bottom', 'rounded-0')
  userListItem.dataset.userid = user.userId

  const container = document.createElement('div')
  container.classList.add('d-flex', 'align-items-center')
  container.style.fontSize = '16px'

  const avatar = document.createElement('img')
  avatar.src = user.avatar
  avatar.width = 50
  avatar.height = 50
  avatar.classList.add('rounded-circle', 'me-2')

  const name = document.createElement('span')
  name.textContent = user.name
  name.style.fontWeight = 'bold'

  const account = document.createElement('span')
  account.textContent = `@${user.account}`
  account.classList.add('ms-2')
  account.style.color = '#6C757D'

  const linkToProfile = document.createElement('a')
  linkToProfile.href = `/users/${user.userId}/tweets`
  linkToProfile.classList.add('stretched-link')

  userListItem.appendChild(container)
  container.appendChild(avatar)
  container.appendChild(name)
  container.appendChild(account)
  container.appendChild(linkToProfile)

  return userListItem
}

function removeUserListItems (idToRemove, renderedListItems) {
  for (const node of renderedListItems) {
    if (idToRemove.includes(Number(node.dataset.userid))) {
      node.remove()
    }
  }
}

function createChatMessageElement (socket, data) {
  const isMe = socket.id === data.socketId
  const messageElement = document.createElement('li')
  messageElement.classList.add('list-group-item', 'border-0', 'd-flex', 'justify-content-start','align-items-start')
  messageElement.classList.add(isMe ? 'flex-row-reverse' : 'flex-row')
  // messageElement.textContent = `${data.name}: ${data.message}`

  const avatar = document.createElement('img')
  avatar.src = data.avatar
  avatar.width = 50
  avatar.height = 50
  avatar.classList.add('rounded-circle', 'me-2')

  const messageContainer = document.createElement('div')
  messageContainer.classList.add('d-flex', 'flex-column', 'justify-content-start')

  const message = document.createElement('span')
  message.textContent = data.message
  message.classList.add(isMe ? 'bg-warning' : 'bg-light')
  message.classList.add('p-3')
  message.style.fontSize = '15px'
  message.style.borderRadius = '50px'

  const now = document.createElement('span')
  now.textContent = new Date().toLocaleTimeString()
  now.classList.add('py-1', 'px-2', isMe ? 'text-end' : 'text-start')
  now.style.fontSize = '13px'
  now.style.color = '#657786'

  messageElement.appendChild(avatar)
  messageElement.appendChild(messageContainer)
  messageContainer.appendChild(message)
  messageContainer.appendChild(now)

  return messageElement
}
