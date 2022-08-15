const mainSocket = io('/')
if (location.pathname === '/chatroom' || location.pathname.slice(0, 12) === '/privateChat') {
  let socket = null
  if (location.pathname === '/chatroom') {
    socket = io('/chatroom', { forceNew: true })
  } else if (location.pathname.slice(0, 12) === '/privateChat') {
    socket = io('/privateChat', { forceNew: true })
  }
  const otherId = location.pathname.slice(13)

  const chatForm = document.querySelector('#chat-form')
  const chatInput = document.querySelector('#chat-input')
  const onlineUsers = document.querySelector('#online-users')
  const onlineUsersCount = document.querySelector('#online-users-count')
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
    const selfId = document.querySelector('#self-id').textContent

    if (otherId) {
      socket.emit('user:connected with other', JSON.stringify({ selfId, otherId }))
      chatForm.style.display = 'block'
      chatMessages.innerHTML = ''
    } else {
      socket.emit('user:connected', selfId)
    }
  })

  socket.on('user:updateList', users => {
    let item = ''
    JSON.parse(users).forEach(user => {
      item += `
        <a href="/privateChat/${user.id}">
          <div class="user-list-card ${user.id == otherId ? 'active' : ''}">
            <img src="${user.avatar}" class="user-avatar" style="height: 50px; width: 50px;">
            <span class="font-bold user-name">${user.name}</span>
            <span class="user-account">@${user.account}</span>
          </div>
        </a>
      `
    })
    if (onlineUsersCount) {
      onlineUsersCount.textContent = `(${JSON.parse(users).length})`
    }
    onlineUsers.innerHTML = item
  })

  socket.on('history:private', data => {
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

  socket.on('history:public', data => {
    JSON.parse(data).forEach(value => {
      const date = document.createElement('div')
      date.className = 'chatroom-date'
      date.textContent = value.createdAt
      chatMessages.appendChild(date)

      value.messages.forEach(el => {
        renderMessage(el.sender.avatar, el.description, socket.id === el.socketId, el.time)
      })
    })
    const item = document.createElement('p')
    item.className = 'broadcast'
    item.textContent = '----------新訊息----------'
    chatMessages.appendChild(item)
  })

  socket.on('broadcast', msg => {
    const item = document.createElement('div')
    item.className = 'broadcast'
    item.textContent = msg
    chatMessages.appendChild(item)
    chatMessages.scrollTo(0, chatMessages.scrollHeight)
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
}

mainSocket.on('notify:private', () => {
  const noti = document.querySelector('#private-noti')
  noti.style.display = 'block'
})
