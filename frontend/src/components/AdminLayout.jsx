import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  Globe,
  LogOut,
  Stethoscope
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#2563eb', padding: '8px', borderRadius: '8px' }}>
            <Stethoscope size={24} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>AI Clinic</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/" style={({ isActive }) => ({ padding: '12px', borderRadius: '8px', textDecoration: 'none', color: isActive ? 'white' : '#64748b', backgroundColor: isActive ? '#2563eb' : 'transparent', fontWeight: 'bold' })}>Dashboard</NavLink>
          
          {user?.clinic?.enabledFeatures?.website_portfolio && (
            <NavLink to="/portfolio" style={({ isActive }) => ({ padding: '12px', borderRadius: '8px', textDecoration: 'none', color: isActive ? 'white' : '#64748b', backgroundColor: isActive ? '#2563eb' : 'transparent', fontWeight: 'bold' })}>Website Builder</NavLink>
          )}
          
          <NavLink to="/bot-settings" style={({ isActive }) => ({ padding: '12px', borderRadius: '8px', textDecoration: 'none', color: isActive ? 'white' : '#64748b', backgroundColor: isActive ? '#2563eb' : 'transparent', fontWeight: 'bold' })}>WhatsApp Bot</NavLink>
          <NavLink to="/settings" style={({ isActive }) => ({ padding: '12px', borderRadius: '8px', textDecoration: 'none', color: isActive ? 'white' : '#64748b', backgroundColor: isActive ? '#2563eb' : 'transparent', fontWeight: 'bold' })}>Settings</NavLink>
        </nav>

        <button onClick={handleLogout} style={{ marginTop: '24px', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#64748b', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer' }}>Logout</button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
