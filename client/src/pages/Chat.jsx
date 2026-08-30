import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { messageAPI, userAPI } from "../services/api";

const Chat = () => {
  const { userId: recipientId } = useParams();
  const { socket, onlineUsers } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    userAPI.getById(recipientId).then((res) => setRecipient(res.data));
    messageAPI.getConversation(recipientId).then((res) => setMessages(res.data));
  }, [recipientId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      if (msg.sender === recipientId) setMessages((prev) => [...prev, msg]);
    };
    const handleSent = (msg) => setMessages((prev) => [...prev, msg]);
    const handleTypingStart = ({ userId: fromId }) => {
      if (fromId === recipientId) setIsTyping(true);
    };
    const handleTypingStop = ({ userId: fromId }) => {
      if (fromId === recipientId) setIsTyping(false);
    };

    socket.on("message:receive", handleReceive);
    socket.on("message:sent", handleSent);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("message:sent", handleSent);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, recipientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit("message:send", { recipientId, content: text.trim() });
    setText("");
    socket.emit("typing:stop", { recipientId });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit("typing:start", { recipientId });
  };

  const isOnline = onlineUsers.includes(recipientId);

  return (
    <div className="page chat-page">
      <h2>
        {recipient?.name || "Chat"}{" "}
        <span className={isOnline ? "status-online" : "status-offline"}>
          {isOnline ? "● online" : "● offline"}
        </span>
      </h2>
      <div className="chat-window">
        {messages.map((m) => (
          <div
            key={m._id}
            className={m.sender === user._id ? "message-bubble sent" : "message-bubble received"}
          >
            {m.content}
          </div>
        ))}
        {isTyping && <p className="typing-indicator">{recipient?.name} is typing...</p>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
