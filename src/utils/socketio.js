import { io } from "socket.io-client"

export const socketio = io(import.meta.env.VITE_SERVER)