const socket = io()

const chatForm = document.querySelector('#chat-form')
const chatInput = document.querySelector('#chat-input')
const onlineUsers = document.querySelector('#online-users')
const chatMessages = document.querySelector('#chat-messages')

socket.on('connect', () => {
  const id = document.querySelector('#self-id').textContent
  axios.get(`/api/users/${id}`)
    .then(res => {
      const user = (({ name, account, avatar }) => ({ name, account, avatar }))(res.data)
      socket.emit('user connected', JSON.stringify(user))
    })
})

socket.on('addUser', users => {
  let item = ''
  JSON.parse(users).forEach(user => {
    item += `
      <div>
        <img src="${user.avatar}" class="user-avatar" style="height: 50px; width: 50px;">
        <span>${user.name}</span>
        <span>@${user.account}</span>
      </div>
    `
  })
  onlineUsers.innerHTML = item
})

socket.on('broadcast', msg => {
  const item = document.createElement('li')
  item.className = 'broadcast'
  item.textContent = msg
  chatMessages.appendChild(item)
})

socket.on('chat message', msg => {
  const item = document.createElement('li')
  item.textContent = msg
  chatMessages.appendChild(item)
})

chatForm.addEventListener('submit', event => {
  event.preventDefault()
  if (chatInput.value) {
    socket.emit('chat message', chatInput.value)
    chatInput.value = ''
  }
})
