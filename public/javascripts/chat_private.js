const socket = io('/private-chatroom')
const NODES = {
  senderLink: document.getElementById('sender-link'),
  receiverName: document.getElementById('receiver-name'),
  receiverAccount: document.getElementById('receiver-account'),
  chatMessage: document.getElementById('private-message-input'),
  sendButton: document.querySelector('div.send-button'),
  privateMessageWrapper: document.getElementById('private-message-wrapper'),
  privateMessageList: document.getElementById('private-message-list'),
  privateMessageUsersList: document.getElementById('private-message-users-list')
}

const utility = {
  debounce: (func, timeout = 300) => {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => { func.apply(this, args) }, timeout)
    }
  }
}

const viewModel = {
  attachAvatarToData: (data, receiverId) => {
    const receiverImg = document.querySelector(`li[data-senderid="${receiverId}"] img`)
    if (receiverImg) data.avatar = receiverImg.src
  }
}

const viewController = {
  scrollToBottom (target) {
    target.scrollTo({
      top: target.scrollHeight,
      behavior: 'smooth'
    })
  },
  renderMessageBox (data) {
    if (!data.message || data.message.length === 0) return
    const isMessageFromCounterpart = Number(data.sender) === Number(NODES.senderLink.dataset.senderid)
    // data includes receiver, message, createdAt, receiver Avatar, isReceiverMe
    const messageBox = document.createElement('li')
    messageBox.classList.add('list-group-item', 'border-0', 'my-1', 'd-flex', 'flex-column')
    NODES.privateMessageList.appendChild(messageBox)

    // render information inside
    const outerMessageWrapper = document.createElement('div')
    outerMessageWrapper.classList.add('d-flex')
    messageBox.appendChild(outerMessageWrapper)

    // add sender Avatar
    if (isMessageFromCounterpart) {
      const senderImg = document.createElement('img')
      senderImg.src = data.avatar
      senderImg.classList.add('rounded-circle', 'me-2')
      senderImg.width = 40
      senderImg.height = 40
      outerMessageWrapper.appendChild(senderImg)
    }

    // add message
    const innerMessageWrapper = document.createElement('div')
    innerMessageWrapper.classList.add('flex-grow-1', 'd-flex', 'flex-column')
    outerMessageWrapper.appendChild(innerMessageWrapper)

    const spanMessage = document.createElement('span')
    const spanCreatedAt = document.createElement('span')
    innerMessageWrapper.appendChild(spanMessage)
    innerMessageWrapper.appendChild(spanCreatedAt)

    spanMessage.textContent = data.message
    spanMessage.classList.add('p-2')
    spanMessage.style.fontSize = '15px'
    spanMessage.style.borderRadius = '25px'
    if (isMessageFromCounterpart) {
      spanMessage.classList.add('bg-light', 'align-self-start')
    } else {
      spanMessage.classList.add('align-self-end')
      spanMessage.style.backgroundColor = 'RGBA(255, 102, 0, 0.5)'
    }

    spanCreatedAt.textContent = new Date(data.createdAt).toLocaleString()
    spanCreatedAt.style.fontSize = '13px'
    spanCreatedAt.style.color = '#657786'
    if (isMessageFromCounterpart) {
      spanCreatedAt.classList.add('text-start')
    } else {
      spanCreatedAt.classList.add('text-end')
    }

    viewController.scrollToBottom(NODES.privateMessageWrapper)
  },
  displayMessage (data) {
    viewModel.attachAvatarToData(data, Number(NODES.senderLink.dataset.senderid))
    viewController.renderMessageBox(data)
  },
  toggleSelectedUser (usersList) {
    if (!usersList) return
    const senderid = NODES.senderLink.dataset.senderid
    const users = usersList.querySelectorAll('li')
    for (const user of users) {
      if (user.dataset.senderid === senderid) {
        // change background color
        user.style.backgroundColor = 'RGBA(255, 102, 0, 0.1)'

        // remove unread circle
        const unreadCount = user.querySelector('span.count-unread-individual')
        if (unreadCount) unreadCount.remove()
      } else {
        user.style.backgroundColor = 'white'
      }
    }
  }
}

socket.on('connect', () => {
  // initialize
  viewController.scrollToBottom(NODES.privateMessageWrapper)
  viewController.toggleSelectedUser(NODES.privateMessageUsersList)

  // add event listeners
  NODES.chatMessage.addEventListener('keyup', sendChatMessage)
  NODES.sendButton.addEventListener('click', sendChatMessage)
  if (NODES.privateMessageUsersList) {
    NODES.privateMessageUsersList.addEventListener('click', renderHistoryMessages)
  }
  if (NODES.privateMessageWrapper) {
    NODES.privateMessageWrapper.addEventListener('scroll', utility.debounce(e => {
      const wrapper = NODES.privateMessageWrapper
      if (Math.ceil(wrapper.scrollTop) >= (wrapper.scrollHeight - wrapper.offsetHeight)) {
        socket.emit('read-private-messages', { senderId: Number(NODES.senderLink.dataset.senderid) })
      }
    }))
  }
})

socket.on('no-chat-history', () => {
  // send receiver information back to server
  const receiver = Number(NODES.senderLink.dataset.senderid)
  socket.emit('no-chat-history-frontend', { receiver })
})

socket.on('render-chat', data => {
  viewController.displayMessage(data)
  socket.emit('read-private-messages', { senderId: Number(NODES.senderLink.dataset.senderid) })
})

// function declaration

function renderHistoryMessages (e) {
  let target = e.target
  while (target.nodeName !== 'LI') {
    target = target.parentElement
  }
  const senderid = Number(target.dataset.senderid)
  const senderName = target.querySelector('div div span.sender-name').textContent
  const senderAccount = target.querySelector('div div span.sender-account').textContent
  axios
    .get('/api/users/chatroom/private/' + senderid)
    .then(res => {
      const historyMessages = res.data
      // change heading
      NODES.senderLink.href = `/users/${senderid}/tweets`
      NODES.senderLink.dataset.senderid = senderid
      NODES.receiverName.textContent = senderName
      NODES.receiverAccount.textContent = senderAccount

      // start render message
      NODES.privateMessageList.innerHTML = ''
      for (const message of historyMessages) {
        viewController.displayMessage(message)
      }

      // render the look & feel of selected user
      viewController.toggleSelectedUser(NODES.privateMessageUsersList)

      // mark messages as read
      socket.emit('read-private-messages', { senderId: Number(NODES.senderLink.dataset.senderid) })
    })
}

function sendChatMessage (e) {
  if (e.key === 'Enter' || e.type === 'click') {
    const message = NODES.chatMessage.value
    if (!message || message.length === 0) return
    socket.emit('send-chat', {
      receiver: Number(NODES.senderLink.dataset.senderid),
      message
    })
    NODES.chatMessage.value = ''
  }
}
