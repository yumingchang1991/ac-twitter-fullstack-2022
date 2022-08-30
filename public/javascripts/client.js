const { pathname } = window.location

if (pathname !== '/signup' && pathname !== '/signin' && !pathname.startsWith('/admin')) {
  console.log('appending notification')
  addScript('/notification')
}

if (pathname === '/signup' || pathname === '/setting') {
  addScript('/signup')
} else if (pathname === '/users/chatroom/public') {
  addScript('/chat_public')
} else if (pathname.startsWith('/users/chatroom/private')) {
  addScript('/chat_private')
} else if (pathname.slice(0, 6) === '/users') {
  addScript('/users')
}

function addScript (route) {
  const BODY = document.getElementsByTagName('body')[0]
  const script = document.createElement('script')
  script.src = `/javascripts${route}.js`
  BODY.appendChild(script)
}
