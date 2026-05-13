import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import { API_BASE_URL } from '../utils/config';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    // Socket URL is API_BASE_URL without /api
    const socketUrl = API_BASE_URL.replace(/\/api$/, '');
    
    const newSocket = io(socketUrl, {
      transports: ['websocket'], // Faster and more stable in most cases
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      
      // Join user room if logged in
      if (user?._id) {
        newSocket.emit('join', user._id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle re-joining when user changes (login/logout)
  useEffect(() => {
    if (socket && isConnected && user?._id) {
      socket.emit('join', user._id);
    }
  }, [socket, isConnected, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
