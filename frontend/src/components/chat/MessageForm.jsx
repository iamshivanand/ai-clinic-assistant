import React, { useState } from 'react';
import { Send, Loader2, Play, Pause } from 'lucide-react';

const MessageForm = ({ 
  isBotPaused, 
  onToggleBot, 
  onSubmitMessage, 
  sending 
}) => {
  const [messageText, setMessageText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;
    onSubmitMessage(messageText.trim());
    setMessageText('');
  };

  return (
    <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#fff', borderTop: '1px solid var(--slate-200)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Bot Pause/Resume Toggle Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--slate-50)', padding: '0.6rem 0.875rem', borderRadius: '0.75rem', border: '1px solid var(--slate-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ height: '10px', width: '10px', borderRadius: '50%', backgroundColor: isBotPaused ? 'var(--orange-500)' : '#10b981' }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-700)' }}>
            {isBotPaused ? 'AI Agent: Paused (Doctor Takeover)' : 'AI Agent: Active (Auto-Responding)'}
          </span>
        </div>
        <button 
          onClick={onToggleBot}
          className={isBotPaused ? "btn-secondary" : "btn-primary"}
          style={{ padding: '0.4rem 0.875rem', fontSize: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          {isBotPaused ? <Play style={{ width: '12px', height: '12px' }} /> : <Pause style={{ width: '12px', height: '12px' }} />}
          <span>{isBotPaused ? 'Resume Bot' : 'Pause Bot'}</span>
        </button>
      </div>

      {/* Form Action */}
      <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          type="text" 
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={isBotPaused ? "Type a manual message..." : "Pause bot to reply manually..."} 
          disabled={!isBotPaused || sending}
          className="chat-textarea"
          style={{ paddingRight: '3.5rem', width: '100%', height: '42px' }}
        />
        <button 
          type="submit"
          disabled={!isBotPaused || !messageText.trim() || sending}
          className="btn-primary"
          style={{ position: 'absolute', right: '6px', height: '30px', width: '30px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          {sending ? <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} /> : <Send style={{ width: '14px', height: '14px' }} />}
        </button>
      </form>
      {!isBotPaused && (
        <p style={{ fontSize: '10px', color: 'var(--slate-400)', textAlign: 'center', margin: 0 }}>
          The AI Bot is currently managing this conversation.
        </p>
      )}
    </div>
  );
};

export default MessageForm;
