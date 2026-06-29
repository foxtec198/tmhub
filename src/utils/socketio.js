import { io } from "socket.io-client"

export const socketio = io("http://localhost:8590", {
  reconnection: true,          // tenta reconectar automaticamente
  reconnectionAttempts: 10,    // número de tentativas
  reconnectionDelay: 2000,     // espera 2s entre tentativas
  reconnectionDelayMax: 5000,  // máximo de 5s entre tentativas
});