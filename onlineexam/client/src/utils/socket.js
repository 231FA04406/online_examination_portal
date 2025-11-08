import { io } from 'socket.io-client'

let socket

export function getSocket() {
  if (!socket) {
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4001'
    socket = io(url, { transports: ['websocket'], withCredentials: false })
  }
  return socket
}
