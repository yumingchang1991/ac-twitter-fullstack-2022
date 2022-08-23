const mainSocket = io('/')

mainSocket.on('connect', () => {
  mainSocket.emit('message:checkRead')
})
mainSocket.on('notify:private', () => {
  const noti = document.querySelector('#private-noti')
  noti.style.display = 'block'
})
mainSocket.on('notify:noneprivate', () => {
  const noti = document.querySelector('#private-noti')
  noti.style.display = 'none'
})

if (location.pathname === '/chatroom' || location.pathname.slice(0, 12) === '/privateChat') {
  let socket = null
  if (location.pathname === '/chatroom') {
    socket = io('/chatroom', { forceNew: true })
  } else if (location.pathname.slice(0, 12) === '/privateChat') {
    socket = io('/privateChat', { forceNew: true })
  }
  const otherId = location.pathname.slice(13)

  const selfId = document.querySelector('#self-id').textContent
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
    if (otherId) {
      socket.emit('user:connected with other', JSON.stringify({ selfId, otherId }))
      socket.emit('message:read', JSON.stringify({ selfId, otherId }))
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
        <a href="/privateChat/${user.id}" data-id="${user.id}">
          <div class="user-list-card ${user.id == otherId ? 'active' : ''}">
            <img src="${user.avatar}" class="user-avatar" style="height: 50px; width: 50px;">
            <div class="ms-2 w-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="font-bold user-name m-0">${user.name}</span>
                  <span class="user-account">@${user.account}</span>
                </div>
                <span id="newest-msg-time">${user.time || ''}</span>
              </div>
              <p id="newest-msg">${user.description || ''}</p>
            </div>
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

    chatMessagesContainer.scrollTo(0, chatMessages.scrollHeight)
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
    if (otherId) {
      const userList = document.querySelector('#online-users')
      const userCard = document.querySelector('#online-users .active').parentElement
      const newestMsg = document.querySelector('#online-users .active #newest-msg')
      const newestTime = document.querySelector('#online-users .active #newest-msg-time')

      newestMsg.textContent = msg.length > 20 ? msg.substring(0, 20) + '...' : msg
      newestTime.textContent = '幾秒'
      userList.prepend(userCard)

      socket.emit('message:read', JSON.stringify({ selfId, otherId }))
    }
  })

  chatForm?.addEventListener('submit', event => {
    event.preventDefault()
    if (chatInput.value) {
      socket.emit('chat message', chatInput.value)
      chatInput.value = ''
    }
  })
}
