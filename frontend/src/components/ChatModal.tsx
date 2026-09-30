import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MapPin, Shield, Image as ImageIcon, Smile, RefreshCw } from 'lucide-react';
import { SwapRequest, Message } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

interface ChatModalProps {
  swap: SwapRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMeetup?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  swap,
  isOpen,
  onClose,
  onOpenMeetup
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socket = getSocket();

  useEffect(() => {
    if (isOpen && swap) {
      loadMessages();
      socket.emit('join_swap_room', swap.id);

      socket.on('user_typing', ({ name }: { name: string }) => {
        setTypingUser(name);
      });

      socket.on('user_stopped_typing', () => {
        setTypingUser(null);
      });

      return () => {
        socket.emit('leave_swap_room', swap.id);
        socket.off('user_typing');
        socket.off('user_stopped_typing');
      };
    }
  }, [isOpen, swap]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!swap) return;
    try {
      const res = await api.getSwapMessages(swap.id);
      setMessages(res.messages || []);
    } catch (e) {}
  };

  if (!isOpen || !swap || !user) return null;

  const otherUserName = swap.requester_id === user.id ? swap.owner_name : swap.requester_name;
  const otherUserImage = swap.requester_id === user.id ? swap.owner_image : swap.requester_image;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const res = await api.sendMessage(swap.id, text);
      setMessages(prev => [...prev, res.message]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { swapId: swap.id, name: user.name });
    }

    setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { swapId: swap.id });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg h-[650px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={otherUserImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
              alt={otherUserName}
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
            <div>
              <h4 className="font-bold text-sm text-white">{otherUserName}</h4>
              <p className="text-[10px] text-amber-400 font-medium">Swap Partner • Live Chat</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenMeetup && (
              <button
                onClick={onOpenMeetup}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Set Meetup</span>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety Note */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Keep all communication on BookSwap. Avoid sharing phone numbers or home addresses.</span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No messages yet. Say hi and suggest a safe public meetup venue!
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === user.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-amber-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-xs'
                    }`}
                  >
                    {m.message}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          {typingUser && (
            <div className="text-[10px] text-slate-400 italic">
              {typingUser} is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTypingChange}
            placeholder="Type a message or suggest a meeting time..."
            className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-full focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
