const socket = io('/privateChat')

const selfId = document.querySelector('#self-id').textContent
const chatForm = document.querySelector('#chat-form')
const chatInput = document.querySelector('#chat-input')
const onlineUsers = document.querySelector('#online-users')
const chatMessages = document.querySelector('#chat-messages')
const chatMessagesContainer = document.querySelector('.chat-messages-container')

function renderMessage (avatar, msg, selfMsg = false, time) {
  const item = document.createElement('div')
  item.className = 'd-flex mb-2'
  if (selfMsg) {
    item.innerHTML = `
      <div class="msg-self" style="max-width: 80%;">
        <p class="chat-msg">${msg}</p>
        <p class="chat-time">${time}</p>
      </div>
    `
  } else {
    item.innerHTML = `
      <img src="${avatar}" class="user-avatar" style="height: 40px; width: 40px;">
      <div style="max-width: 80%;">
        <p class="chat-msg">${msg}</p>
        <p class="chat-time">${time}</p>
      </div>
    `
  }
  chatMessages.appendChild(item)
}

socket.on('connect', () => {
  axios.get(`/api/users/${selfId}`)
    .then(res => {
      const user = (({ id, name, account, avatar }) => ({ id, name, account, avatar }))(res.data)
      socket.emit('user connected', JSON.stringify(user))
    })
})

socket.on('updateUserList', users => {
  JSON.parse(users).forEach(user => {
    const item = document.createElement('div')
    item.className = 'user-list-card'
    item.dataset.id = user.id
    item.innerHTML = `
      <img src="${user.avatar}" class="user-avatar" style="height: 50px; width: 50px;">
      <span class="font-bold user-name">${user.name}</span>
      <span class="user-account">@${user.account}</span>
    `
    item.addEventListener('click', event => {
      chatForm.style.display = 'block'
      const id = event.target.dataset.id
      chatMessages.innerHTML = ''
      socket.emit('join room', id)
      socket.emit('get messages', id)
    })
    onlineUsers.appendChild(item)
  })
})

socket.on('history', data => {
  const { otherUser, messages } = JSON.parse(data)
  const header = document.querySelectorAll('.chat-header')[1]
  header.style.paddingTop = '15px'
  header.innerHTML = `
    <p class="user-name" style="margin: 0;">${otherUser.name}</p>
    <p class="user-account">@${otherUser.account}</p>
  `
  messages.forEach(value => {
    const date = document.createElement('div')
    date.className = 'chatroom-date'
    date.textContent = value.createdAt
    chatMessages.appendChild(date)

    value.messages.forEach(el => {
      renderMessage(otherUser.avatar, el.description, socket.id === el.socketId, el.time)
    })
  })

  chatMessagesContainer.scrollTo(0, chatMessages.scrollHeight)
})

socket.on('chat message', data => {
  const { avatar, msg, time, socketId } = JSON.parse(data)

  renderMessage(avatar, msg, socketId === socket.id, time)
  chatMessagesContainer.scrollTo(0, chatMessages.scrollHeight)
})

chatForm?.addEventListener('submit', event => {
  event.preventDefault()
  if (chatInput.value) {
    socket.emit('chat message', chatInput.value)
    chatInput.value = ''
  }
})
