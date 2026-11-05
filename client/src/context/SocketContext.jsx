import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, onlineIds: new Set() });
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineIds, setOnlineIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    const s = io(import.meta.env.VITE_API_URL || undefined, {
      auth: { token: localStorage.getItem('sb_token') },
    });
    s.on('presence:list', (ids) => setOnlineIds(new Set(ids)));
    s.on('presence', ({ userId, online }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        online ? next.add(userId) : next.delete(userId);
        return next;
      })
    );
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?._id]);

  return <SocketContext.Provider value={{ socket, onlineIds }}>{children}</SocketContext.Provider>;
}
