'use client';

import { useSocket } from '@/context/SocketContext';
import { useEffect, useCallback } from 'react';

type EventHandler = (...args: any[]) => void;

export function useSocketEvents() {
  const { socket, isConnected } = useSocket();

  const emit = useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn('Socket not connected, cannot emit event:', event);
      }
    },
    [socket, isConnected]
  );

  const on = useCallback(
    (event: string, handler: EventHandler) => {
      if (!socket) return;

      socket.on(event, handler);

      return () => {
        socket.off(event, handler);
      };
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      if (socket && isConnected) {
        socket.emit('joinRoom', roomId);
      }
    },
    [socket, isConnected]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (socket && isConnected) {
        socket.emit('leaveRoom', roomId);
      }
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(
    (roomId: string, message: string, sender: string) => {
      if (socket && isConnected) {
        socket.emit('sendMessage', { roomId, message, sender });
      }
    },
    [socket, isConnected]
  );

  return {
    emit,
    on,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
  };
}
