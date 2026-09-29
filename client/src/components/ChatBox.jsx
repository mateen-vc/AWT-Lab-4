import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ProtocolBadge } from './ProtocolBadge';
import {
  Send,
  MessageSquare,
  User,
  ShieldCheck,
  Wifi,
  WifiOff,
  Minimize2,
  Clock,
} from 'lucide-react';

export const ChatBox = ({ roomId: propRoomId, initialOrder = null, onClose = null }) => {
  const { currentUser, isAgent } = useAuth();
  const {
    isConnected,
    activeSupportRoom,
    roomMessages,
    typingUsers,
    joinSupportRoom,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
  } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Determine current active room
  const targetRoomId =
    propRoomId ||
    activeSupportRoom ||
    (isAgent
      ? 'support:cust_01:agent_01'
      : `support:${currentUser?.id || 'cust_01'}:agent_01`);

  useEffect(() => {
    if (targetRoomId) {
      joinSupportRoom(targetRoomId);
    }
  }, [targetRoomId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages, typingUsers]);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Trigger typingStart
    sendTypingStart(targetRoomId);

    // Debounce typingStop
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTypingStop(targetRoomId);
    }, 1500);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !isConnected) return;

    sendMessage(inputMessage, targetRoomId);
    sendTypingStop(targetRoomId);
    setInputMessage('');
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if someone else is typing in this room
  const otherTypingList = Object.values(typingUsers).filter(
    (u) => u.userName !== currentUser?.name
  );

  return (
    <div className="flex flex-col h-[560px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Chat Header */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {isAgent ? 'AG' : 'CS'}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                isConnected ? 'bg-emerald-400 animate-live-pulse' : 'bg-rose-400'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                {isAgent ? 'Customer Support Console' : 'Live Order Support'}
              </h4>
              <ProtocolBadge type="SOCKET" size="sm" />
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Room: <span className="text-indigo-400">{targetRoomId}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Reconnecting...</span>
              </>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Welcome Callout */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center text-xs text-slate-400">
          <MessageSquare className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <p>This private support session is connected via <strong className="text-indigo-300">Socket.io WebSockets</strong>.</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Real-time bi-directional messaging with typing indicators.</p>
        </div>

        {roomMessages.map((msg, index) => {
          const isMe = msg.senderId === currentUser?.id || msg.senderRole === currentUser?.role;
          const isAgentMsg = msg.senderRole === 'agent';

          return (
            <div
              key={msg.messageId || index}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  {isAgentMsg ? (
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  ) : (
                    <User className="w-3 h-3 text-slate-400" />
                  )}
                  {msg.senderName}
                </span>
                <span className="text-[9px] text-slate-500">
                  {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : isAgentMsg
                    ? 'bg-slate-800 text-slate-100 border border-indigo-500/20 rounded-bl-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {otherTypingList.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 px-2 animate-pulse">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>
              {otherTypingList.map((u) => u.userName).join(', ')} is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isConnected
              ? `Message as ${currentUser?.name} (Enter to send)...`
              : 'Connecting to chat server...'
          }
          disabled={!isConnected}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || !isConnected}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-600/30"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
