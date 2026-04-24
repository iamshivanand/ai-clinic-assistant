import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Pause, Play, Search, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { getChatPatients, getChatMessages, sendChatMessage, toggleBot } from '../services/api';

const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

const Chat = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchPatients();

    socket.on('new-message', (data) => {
      // If the message is for the currently selected patient, update messages
      if (selectedPatient && data.patientId === selectedPatient._id) {
        setMessages(prev => {
          // Avoid duplicates for doctor messages (optimistically added)
          if (data.message.sender === 'doctor') {
            const alreadyExists = prev.some(m => 
              m.content === data.message.content && 
              Math.abs(new Date(m.timestamp) - new Date(data.message.timestamp)) < 10000
            );
            if (alreadyExists) return prev;
          }
          return [...prev, data.message];
        });
      }
      
      // Update the patient list to show the latest message
      setPatients(prev => prev.map(p => 
        p._id === data.patientId 
          ? { ...p, lastMessage: data.message.content, lastMessageTime: data.message.timestamp } 
          : p
      ));
    });

    socket.on('bot-toggled', (data) => {
      if (selectedPatient && data.patientId === selectedPatient._id) {
        setIsBotPaused(data.isPaused);
      }
      setPatients(prev => prev.map(p => 
        p._id === data.patientId ? { ...p, isBotPaused: data.isPaused } : p
      ));
    });

    return () => {
      socket.off('new-message');
      socket.off('bot-toggled');
    };
  }, [selectedPatient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPatients = async () => {
    try {
      const res = await getChatPatients();
      setPatients(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await getChatMessages(id);
      setMessages(res.data.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleToggleBot = async () => {
    if (!selectedPatient) return;
    try {
      const newStatus = !isBotPaused;
      await toggleBot(selectedPatient._id, newStatus);
      setIsBotPaused(newStatus);
      // Update local patients state
      setPatients(patients.map(p => p._id === selectedPatient._id ? { ...p, isBotPaused: newStatus } : p));
    } catch (err) {
      console.error('Failed to toggle bot', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText || !selectedPatient || sending) return;

    const content = messageText;
    const optimisticMessage = {
      _id: Date.now(),
      patientId: selectedPatient._id,
      sender: 'doctor',
      type: 'text',
      content: content,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Optimistic update
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageText('');

    try {
      await sendChatMessage(selectedPatient._id, content);
      // We don't fetchMessages here, the socket or our optimistic update covers it
    } catch (err) {
      console.error('Failed to send message', err);
      // Remove the optimistic message if it failed
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      setMessageText(content);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Sidebar - Patient List */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {patients.map((p) => (
            <div 
              key={p._id}
              onClick={() => setSelectedPatient(p)}
              className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
                selectedPatient?._id === p._id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center relative">
                <User className="h-5 w-5 text-gray-500" />
                {p.isBotPaused && (
                  <div className="absolute -bottom-1 -right-1 bg-orange-500 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center">
                    <Pause className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <span className="text-[10px] text-gray-400 uppercase">{formatTime(p.lastMessageTime)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{p.lastMessage}</p>
              </div>
              {p.unread && <div className="h-2 w-2 bg-blue-600 rounded-full"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedPatient.name}</p>
                  <p className="text-xs text-gray-500 font-medium">{selectedPatient.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleToggleBot}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isBotPaused 
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isBotPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span>{isBotPaused ? 'Resume Bot' : 'Pause Bot'}</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div 
                  key={msg._id || idx}
                  className={`flex items-start space-x-2 ${msg.sender === 'patient' ? 'justify-start' : 'justify-end flex-row-reverse space-x-reverse'}`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'patient' ? 'bg-gray-200' : msg.sender === 'bot' ? 'bg-blue-600' : 'bg-gray-900'
                  }`}>
                    {msg.sender === 'patient' ? <User className="h-4 w-4 text-gray-500" /> : msg.sender === 'bot' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                  </div>
                  <div className={`p-3 rounded-2xl shadow-sm border ${
                    msg.sender === 'patient' 
                      ? 'bg-white border-gray-100 rounded-tl-none max-w-[70%]' 
                      : msg.sender === 'bot'
                        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none max-w-[70%]'
                        : 'bg-gray-900 text-white border-gray-800 rounded-tr-none max-w-[70%]'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${msg.sender === 'patient' ? 'text-gray-400' : 'text-blue-100'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isBotPaused ? "Type a manual message..." : "Pause bot to reply manually..."} 
                  disabled={!isBotPaused || sending}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!isBotPaused || !messageText || sending}
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
              {!isBotPaused && (
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  The AI Bot is currently managing this conversation.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="bg-white p-8 rounded-full shadow-inner mb-6">
              <MessageSquare className="h-16 w-16 opacity-20" />
            </div>
            <p className="text-lg font-medium text-gray-500">Select a patient to view conversation</p>
            <p className="text-sm text-gray-400">You can take over any chat by pausing the bot.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
