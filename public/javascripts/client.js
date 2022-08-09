const path = window.location.pathname

if (path === '/signup' || path === '/setting') {
  addScript('/signup')
} else if (path === '/users/chatroom/public') {
  addScript('socketio')
  // initIo()
  addScript('/chatroom')
} else if (path.slice(0, 6) === '/users') {
  addScript('/users')
}

function addScript (route) {
  const BODY = document.getElementsByTagName('body')[0]
  const script = document.createElement('script')
  if (route === 'socketio') {
    // script.src = 'https://cdn.socket.io/4.5.0/socket.io.min.js'
    // script.integrity = 'sha384-7EyYLQZgWBi67fBtVxw60/OWl1kjsfrPFcaU0pp0nAh+i8FD068QogUvg85Ewy1k'
    // script.crossOrigin = 'anonymous'
  } else {
    script.src = `/javascripts${route}.js`
  }
  BODY.appendChild(script)
}

function initIo() {
  const BODY = document.getElementsByTagName('body')[0]
  const script = document.createElement('script')
  script.src = '../socket.io/socket.io.js'
  BODY.appendChild(script)
}
