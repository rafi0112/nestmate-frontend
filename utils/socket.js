import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;

// create ONE socket instance
export const socket = io(SOCKET_URL, {
  transports: ["websocket"], // faster
  autoConnect: true,
});