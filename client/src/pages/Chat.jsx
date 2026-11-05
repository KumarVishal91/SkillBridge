import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Chat() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineIds } = useSocket();

  const [convos, setConvos] = useState([]);
  const [partnerName, setPartnerName] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const bottom = useRef(null);
  const typingTimer = useRef(null);

  const loadConvos = () => api.get('/messages').then((r) => setConvos(r.data));
  useEffect(() => { loadConvos(); }, [partnerId]);

  useEffect(() => {
    if (!partnerId) return setMessages([]);
    api.get(`/messages/${partnerId}`).then((r) => setMessages(r.data));
    api.get(`/users/${partnerId}`).then((r) => setPartnerName(r.data.name));
  }, [partnerId]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (m) => {
      const involves = [m.from, m.to].includes(partnerId);
      if (involves) setMessages((prev) => (prev.some((p) => p._id === m._id) ? prev : [...prev, m]));
      loadConvos();
    };
    const onTyping = ({ from, typing }) => from === partnerId && setTyping(typing);
    socket.on('message:new', onMsg);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onMsg);
      socket.off('typing', onTyping);
    };
  }, [socket, partnerId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('message:send', { to: partnerId, text });
    socket.emit('typing', { to: partnerId, typing: false });
    setText('');
  };

  const onChange = (e) => {
    setText(e.target.value);
    socket?.emit('typing', { to: partnerId, typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('typing', { to: partnerId, typing: false }), 1200);
  };

  return (
    <div className="chat">
      <aside className="card convos">
        <h3>Conversations</h3>
        {convos.length === 0 && <p className="muted small">No conversations yet. Message one of your matches!</p>}
        {convos.map((c) => (
          <div
            key={c.partnerId}
            className={`convo ${c.partnerId === partnerId ? 'active' : ''}`}
            onClick={() => navigate(`/chat/${c.partnerId}`)}
          >
            <b>{c.partnerName}</b> {onlineIds.has(c.partnerId) && <span className="dot" />}
            <div className="muted small ellipsis">{c.lastMessage}</div>
          </div>
        ))}
      </aside>

      <section className="card thread">
        {!partnerId ? (
          <p className="muted center">Select a conversation or message a match.</p>
        ) : (
          <>
            <div className="thread-head">
              <b>{partnerName}</b> {onlineIds.has(partnerId) ? <span className="dot" /> : <span className="muted small">offline</span>}
            </div>
            <div className="bubbles">
              {messages.map((m) => (
                <div key={m._id} className={`bubble ${m.from === user._id ? 'mine' : 'theirs'}`}>
                  {m.text}
                </div>
              ))}
              {typing && <div className="muted small">{partnerName} is typing…</div>}
              <div ref={bottom} />
            </div>
            <form className="row" onSubmit={send}>
              <input placeholder="Type a message…" value={text} onChange={onChange} />
              <button className="btn">Send</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
