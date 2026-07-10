import React, { useState } from 'react';
import { Search, User, Pause } from 'lucide-react';

const PatientSidebar = ({ patients, selectedPatient, onSelectPatient }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="patient-sidebar-pane">
      {/* Search Header */}
      <div className="sidebar-search-box">
        <div className="search-container" style={{ width: '100%' }}>
          <Search style={{ width: '16px', height: '16px', color: 'var(--slate-400)', marginRight: '8px' }} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..." 
            className="search-input"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="patient-list-scroll">
        {filteredPatients.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)' }}>
            No active chats found
          </div>
        ) : (
          filteredPatients.map((p) => (
            <button 
              key={p._id}
              onClick={() => onSelectPatient(p)}
              className={`patient-item-row ${selectedPatient?._id === p._id ? 'active' : ''}`}
            >
              <div className={`patient-avatar-box ${selectedPatient?._id === p._id ? 'active' : ''}`} style={{ position: 'relative' }}>
                <User style={{ width: '20px', height: '20px' }} />
                {p.isBotPaused && (
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', backgroundColor: 'var(--orange-500)', height: '14px', width: '14px', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                    <Pause style={{ width: '8px', height: '8px', color: '#fff', margin: 'auto' }} />
                  </div>
                )}
              </div>
              <div className="patient-row-details">
                <div className="patient-row-name-time">
                  <p className="patient-row-name truncate">{p.name}</p>
                  <span className="patient-row-time">
                    {formatTime(p.lastMessageTime)}
                  </span>
                </div>
                <p className="patient-row-msg truncate">{p.lastMessage}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientSidebar;
