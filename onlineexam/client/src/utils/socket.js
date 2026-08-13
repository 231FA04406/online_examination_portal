import { io } from 'socket.io-client'

let socket

function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '')
  }
  return 'http://localhost:4000'
}

export function getSocket() {
  if (!socket) {
    socket = io(getSocketUrl(), { transports: ['websocket'], withCredentials: false })
  }
  return socket
}
