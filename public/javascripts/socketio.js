const mainSocket = io('/')

mainSocket.on('connect', () => {
  // 檢查未讀私人訊息及通知
  mainSocket.emit('message:checkRead')
  mainSocket.emit('notify:checkRead')

  // 監聽新增推文事件
  const forms = document.querySelectorAll('form')
  forms?.forEach(form => {
    form.addEventListener('submit', e => {
      mainSocket.emit(`submit:${e.target.id}`)
    })
  })
})

// 有未讀私人訊息
mainSocket.on('notify:private', notReadCounts => {
  const noti = document.querySelector('#private-noti')
  if (notReadCounts) {
    noti.textContent = notReadCounts
  } else {
    noti.textContent = Number(noti.textContent) + 1
  }
  noti.style.display = 'block'
})

// 無未讀私人訊息
mainSocket.on('notify:noneprivate', () => {
  const noti = document.querySelector('#private-noti')
  noti.style.display = 'none'
})

// 有未讀通知
mainSocket.on('notify:noti', () => {
  const noti = document.querySelector('#notification-noti')
  noti.style.display = 'block'
})

// 公開/私人聊天室 socket
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

    if (selfMsg) { // 若為自己傳送的訊息
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
    if (otherId) { // 與另一使用者私人聊天
      socket.emit('user:connected with other', JSON.stringify({ selfId, otherId }))
      socket.emit('message:read', JSON.stringify({ selfId, otherId }))
      chatForm.style.display = 'block'
      chatMessages.innerHTML = ''
    } else {
      socket.emit('user:connected', selfId)
    }
  })

  // 更新使用者名單
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

  // 私人歷史訊息
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

  // 公開聊天室歷史訊息
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

  // 廣播訊息
  socket.on('broadcast', msg => {
    const item = document.createElement('div')
    item.className = 'broadcast'
    item.textContent = msg
    chatMessages.appendChild(item)
    chatMessages.scrollTo(0, chatMessages.scrollHeight)
  })

  // 有新訊息時
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

  // 監聽訊息輸入框
  chatForm?.addEventListener('submit', event => {
    event.preventDefault()
    if (chatInput.value) {
      socket.emit('chat message', chatInput.value)
      chatInput.value = ''
    }
  })
} else if (location.pathname === '/notification') { // 通知頁
  const socket = io('/notification')
  const notiList = document.querySelector('#notification-list')

  socket.on('connect', () => {
    socket.emit('notify:getNotification')
  })

  socket.on('notify:noti', () => {
    // 等待通知存入資料庫
    setTimeout(() => {
      socket.emit('notify:getNotification')
    }, 5000)
  })

  // 顯示通知
  socket.on('notify:notifications', data => {
    const noti = document.querySelector('#notification-noti')
    noti.style.display = 'none'

    const notifications = JSON.parse(data)
    let list = ''
    notifications.forEach(notification => {
      // 已讀的顯示白底，未讀顯示顏色
      const backgroundColor = notification.isRead === 0 ? '#FFF7F0' : 'white'

      list += `
        <a href="/tweets/${notification.Tweet.id}/replies">
          <div class="border-bottom p-3" style="background-color: ${backgroundColor};">
            <img src="${notification.Tweet.User.avatar}" class="user-avatar mb-2" style="height: 50px; width: 50px; border: none;">
            <p class="font-bold">${notification.Tweet.User.name}有新的推文</p>
            <p style="color: var(--secondary);">${notification.Tweet.description}</p>
          </div>
        </a>
      `
    })

    notiList.innerHTML = list
  })
}
