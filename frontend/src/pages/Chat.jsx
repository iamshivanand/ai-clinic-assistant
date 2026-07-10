import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import { getChatPatients, getChatMessages, sendChatMessage, toggleBot } from '../services/api';
import PatientSidebar from '../components/chat/PatientSidebar';
import ChatViewport from '../components/chat/ChatViewport';
import MessageForm from '../components/chat/MessageForm';

const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

const Chat = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Pagination states
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await getChatPatients();
      setPatients(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    }
  };

  const fetchMessages = async (id, beforeId = null) => {
    try {
      if (beforeId) {
        setLoadingMore(true);
      }
      const limit = 30;
      const res = await getChatMessages(id, beforeId);
      const fetchedMessages = res.data.data;

      if (beforeId) {
        setMessages((prev) => [...fetchedMessages, ...prev]);
        setLoadingMore(false);
        if (fetchedMessages.length < limit) {
          setHasMore(false);
        }
      } else {
        setMessages(fetchedMessages);
        setHasMore(fetchedMessages.length === limit);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
      if (beforeId) {
        setLoadingMore(false);
      }
    }
  };

  const handleLoadMore = async () => {
    if (messages.length === 0 || loadingMore || !selectedPatient) return;
    const oldestMessageId = messages[0]._id;
    await fetchMessages(selectedPatient._id, oldestMessageId);
  };

  useEffect(() => {
    fetchPatients();

    const handleNewMessage = (data) => {
      // If the message is for the currently selected patient, update messages list
      if (selectedPatient && data.patientId === selectedPatient._id) {
        setMessages((prev) => {
          // Avoid duplicates for doctor messages (optimistically added)
          if (data.message.sender === 'doctor') {
            const alreadyExists = prev.some((m) => 
              m.content === data.message.content && 
              Math.abs(new Date(m.timestamp) - new Date(data.message.timestamp)) < 10000
            );
            if (alreadyExists) return prev;
          }
          return [...prev, data.message];
        });
      }
      
      // Update the patient list to show the latest message
      setPatients((prev) => prev.map((p) => 
        p._id === data.patientId 
          ? { ...p, lastMessage: data.message.content, lastMessageTime: data.message.timestamp } 
          : p
      ));
    };

    socket.on('new-message', handleNewMessage);

    if (import.meta.env.DEV) {
      window.simulateIncomingMessage = handleNewMessage;
    }

    socket.on('bot-toggled', (data) => {
      if (selectedPatient && data.patientId === selectedPatient._id) {
        setIsBotPaused(data.isPaused);
      }
      setPatients((prev) => prev.map((p) => 
        p._id === data.patientId ? { ...p, isBotPaused: data.isPaused } : p
      ));
    });

    return () => {
      socket.off('new-message');
      socket.off('bot-toggled');
      if (import.meta.env.DEV) {
        delete window.simulateIncomingMessage;
      }
    };
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedPatient) {
      fetchMessages(selectedPatient._id);
      setIsBotPaused(selectedPatient.isBotPaused || false);
    } else {
      setMessages([]);
      setHasMore(false);
    }
  }, [selectedPatient]);

  const handleToggleBot = async () => {
    if (!selectedPatient) return;
    try {
      const newStatus = !isBotPaused;
      await toggleBot(selectedPatient._id, newStatus);
      setIsBotPaused(newStatus);
      setPatients(patients.map((p) => p._id === selectedPatient._id ? { ...p, isBotPaused: newStatus } : p));
    } catch (err) {
      console.error('Failed to toggle bot', err);
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedPatient || sending) return;

    const optimisticMessage = {
      _id: Date.now().toString(),
      patientId: selectedPatient._id,
      sender: 'doctor',
      type: 'text',
      content: text,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setSending(true);

    try {
      await sendChatMessage(selectedPatient._id, text);
      setSending(false);
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMessage._id));
      setSending(false);
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-gray-500">Loading active chats...</span>
      </div>
    );
  }

  return (
    <div className="chat-split-view">
      {/* Sidebar Section */}
      <PatientSidebar 
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={setSelectedPatient}
      />

      {/* Message Area Section */}
      <div className="chat-viewport-pane">
        {selectedPatient ? (
          <>
            <ChatViewport 
              selectedPatient={selectedPatient}
              messages={messages}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loadingMore={loadingMore}
            />
            <MessageForm 
              isBotPaused={isBotPaused}
              onToggleBot={handleToggleBot}
              onSubmitMessage={handleSendMessage}
              sending={sending}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1" style={{ color: 'var(--slate-400)' }}>
            <div className="bg-white p-6 rounded-full shadow-sm" style={{ marginBottom: '1.5rem', border: '1px solid var(--slate-200)' }}>
              <MessageSquare style={{ width: '48px', height: '48px', color: 'var(--indigo-500)' }} />
            </div>
            <p className="text-lg font-bold text-slate-700">Select a patient to view conversation</p>
            <p className="text-sm text-slate-400" style={{ marginTop: '0.25rem' }}>You can take over any chat by pausing the bot.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
