import React, { useRef, useEffect } from 'react';
import { User, Bot, Loader2 } from 'lucide-react';

const ChatViewport = ({ 
  selectedPatient, 
  messages, 
  onLoadMore, 
  hasMore, 
  loadingMore 
}) => {
  const messagesEndRef = useRef(null);
  const viewportRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom on initial message load or new message arrivals
  useEffect(() => {
    // Only scroll if we are not loading older pages
    if (!loadingMore) {
      scrollToBottom();
    }
  }, [messages, loadingMore]);

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-viewport-pane">
      {/* Active Chat Header */}
      <div className="chat-pane-header">
        <div className="chat-patient-meta">
          <div className="patient-avatar-box">
            <User style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <p className="font-bold text-slate-800" style={{ fontSize: '0.875rem' }}>{selectedPatient.name}</p>
            <p className="text-xs text-slate-400 font-medium" style={{ marginTop: '2px' }}>{selectedPatient.phone}</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={viewportRef}
        className="messages-list-scroll"
      >
        {/* Load More Pagination Trigger */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="btn-secondary"
              style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '12px', height: '12px' }} />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load older messages</span>
              )}
            </button>
          </div>
        )}

        {/* Message Bubble Render Loop */}
        {messages.map((msg, idx) => (
          <div 
            key={msg._id || idx}
            className={`message-bubble-row ${msg.sender === 'patient' ? 'patient' : msg.sender === 'bot' ? 'bot' : 'user'}`}
          >
            <div className={`msg-avatar ${msg.sender}`}>
              {msg.sender === 'patient' ? (
                <User style={{ width: '16px', height: '16px' }} />
              ) : msg.sender === 'bot' ? (
                <Bot style={{ width: '16px', height: '16px' }} />
              ) : (
                <User style={{ width: '16px', height: '16px' }} />
              )}
            </div>
            <div className={`msg-body ${msg.sender}`}>
              <p style={{ margin: 0 }}>{msg.content}</p>
              <p className={`msg-timestamp ${msg.sender}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatViewport;
