const notification = io('/notification')

notification.on('new-private-messages', data => {
  // for overall unread count
  const countUnreadPrivateChat = document.getElementById('count-unread-private-chat')
  renderUnreadNavigation(countUnreadPrivateChat)

  // for individual unread count
  const { senderId } = data
  if (window.location.pathname.startsWith('/users/chatroom/private')) {
    if (senderId) {
      const senderLink = document.getElementById('sender-link')
      if (Number(senderLink.dataset.senderid) === senderId) return

      const countUnreadIndividual = document.querySelector(`ul#private-message-users-list li[data-senderid="${senderId}"] span.count-unread-individual`)

      if (countUnreadIndividual) {
        countUnreadIndividual.textContent = Number(countUnreadIndividual.textContent) + 1
      } else {
        const countWrapper = document.querySelector(`ul#private-message-users-list li[data-senderid="${senderId}"] div.count-wrapper`)
        const countSpan = document.createElement('span')
        countWrapper.appendChild(countSpan)

        // styling
        countSpan.textContent = 1
        countSpan.classList.add('count-unread-individual', 'px-2', 'rounded-circle', 'd-flex', 'align-items-center')
        countSpan.style.fontSize = '11px'
        countSpan.style.backgroundColor = '#FF7700'
        countSpan.style.color = 'white'
      }
    }
  }
})

notification.on('private-messages-read', data => {
  const { countUnreadPrivateMessages, senderId } = data

  // for overall unread count
  const countUnreadPrivateChat = document.getElementById('count-unread-private-chat')
  if (countUnreadPrivateChat) {
    const newCount = Number(countUnreadPrivateChat.textContent) - Number(countUnreadPrivateMessages)
    if (newCount > 0) {
      countUnreadPrivateChat.textContent = newCount
    } else {
      countUnreadPrivateChat.remove()
    }
  }

  // for individual unread count
  const senderLink = document.getElementById('sender-link')
  if (senderLink) {
    const isActiveChat = Number(senderLink.dataset.senderid) === Number(senderId)
    if (isActiveChat) {
      const countUnreadIndividual = document.querySelector(`ul#private-message-users-list li[data-senderid="${senderId}"] span.count-unread-individual`)
      if (countUnreadIndividual) countUnreadIndividual.remove()
    }
  }
})

notification.on('connect', () => {
  console.log('notification is connected through notification.js')
})

notification.on('connect_error', data => {
  console.log('notification is facing connect error: ', data)
})

notification.on('disconnect', reason => {
  console.log('disconnt reason: ', reason)
})

function renderUnreadNavigation (countElement) {
  if (countElement) {
    const newCount = Number(countElement.textContent) + 1
    countElement.textContent = newCount
  } else {
    const privateChatLink = document.getElementById('private-chat-link')
    const newSpan = document.createElement('span')
    newSpan.textContent = 1
    newSpan.id = 'count-unread-private-chat'
    newSpan.classList.add('mx-1', 'px-1', 'rounded-circle')
    newSpan.style.fontSize = '10px'
    newSpan.style.backgroundColor = '#FF6600'
    newSpan.style.color = 'white'
    privateChatLink.appendChild(newSpan)
  }
}
