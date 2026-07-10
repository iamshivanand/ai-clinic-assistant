import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauth-container">
      <div className="unauth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--rose-50)', borderRadius: '50%', border: '1px solid var(--rose-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert style={{ width: '32px', height: '32px', color: 'var(--rose-600)' }} />
          </div>
        </div>
        
        <h2 className="login-title" style={{ marginBottom: '0.75rem' }}>Access Denied</h2>
        
        <p className="login-subtitle">
          You do not have the required permissions to access this section of the portal.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem' }}
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('auth-storage');
              window.location.href = '/login';
            }}
            className="btn-secondary"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
