const socket = io()

const chatForm = document.querySelector('#chat-form')
const chatInput = document.querySelector('#chat-input')
const onlineUsers = document.querySelector('#online-users')
const onlineUsersCount = document.querySelector('#online-users-count')
const chatMessages = document.querySelector('#chat-messages')

function renderMessage(avatar, msg, selfMsg, time) {
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
  const id = document.querySelector('#self-id').textContent
  axios.get(`/api/users/${id}`)
    .then(res => {
      const user = (({ id, name, account, avatar }) => ({ id, name, account, avatar }))(res.data)
      socket.emit('user connected', JSON.stringify(user))
    })
})

socket.on('history', data => {
  JSON.parse(data).forEach(value => {
    const date = document.createElement('div')
    date.className = 'broadcast'
    date.textContent = value.createdAt
    chatMessages.appendChild(date)

    value.messages.forEach(el => {
      renderMessage(el.sender.avatar, el.description, el.selfMsg, el.time)
    })
  })
})

socket.on('updateUserList', users => {
  let item = ''
  JSON.parse(users).forEach(user => {
    item += `
      <div class="user-list-card">
        <img src="${user.avatar}" class="user-avatar" style="height: 50px; width: 50px;">
        <span>${user.name}</span>
        <span>@${user.account}</span>
      </div>
    `
  })
  onlineUsersCount.textContent = `(${JSON.parse(users).length})`
  onlineUsers.innerHTML = item
})

socket.on('broadcast', msg => {
  const item = document.createElement('li')
  item.className = 'broadcast'
  item.textContent = msg
  chatMessages.appendChild(item)
  chatMessages.scrollTo(0, chatMessages.scrollHeight)
})

socket.on('chat message', data => {
  const { avatar, msg, selfMsg, time } = JSON.parse(data)
  renderMessage(avatar, msg, selfMsg, time)

  chatMessages.scrollTo(0, chatMessages.scrollHeight)
})

chatForm.addEventListener('submit', event => {
  event.preventDefault()
  if (chatInput.value) {
    socket.emit('chat message', chatInput.value)
    chatInput.value = ''
  }
})
