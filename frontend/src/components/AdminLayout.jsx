import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  MessageSquare, 
  LogOut,
  Stethoscope,
  Search,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Menu,
  Activity,
  Building2,
  UserPlus,
  ClipboardList,
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, isCollapsed, children }) => (
  <NavLink 
    to={to} 
    end
    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
    style={{ 
      justifyContent: isCollapsed ? 'center' : 'flex-start', 
      padding: isCollapsed ? '0.75rem' : '0.75rem 1rem' 
    }}
  >
    <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
    <AnimatePresence initial={false}>
      {!isCollapsed && (
        <motion.span 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', marginLeft: '0.75rem' }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  </NavLink>
);

const AdminLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex bg-slate-50" style={{ position: 'fixed', inset: 0, overflow: 'hidden', width: '100vw', height: '100vh' }}>
      <motion.aside 
        className="sidebar-wrapper"
        animate={{ width: isCollapsed ? 76 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ 
          overflow: 'hidden', 
          padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0
        }}
      >
        <div 
          className="sidebar-brand" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'space-between', 
            marginBottom: '2.5rem',
            padding: '0 0.5rem',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon-box" style={{ flexShrink: 0 }}>
              <Stethoscope style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <span className="brand-text block" style={{ whiteSpace: 'nowrap' }}>AI Clinic</span>
                  <span className="brand-sub block" style={{ whiteSpace: 'nowrap' }}>
                    {isSuperAdmin ? 'Admin Panel' : 'Workspace'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="btn-icon-sidebar-toggle"
              title="Collapse Sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(false)} 
            className="btn-icon-sidebar-toggle-expand"
            style={{ display: 'flex', margin: '0 auto 2.5rem auto' }}
            title="Expand Sidebar"
            aria-label="Expand sidebar"
          >
            <Menu style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
          </button>
        )}

        <nav className="flex-1 space-y-2" style={{ display: 'flex', flexDirection: 'column' }}>
          {isSuperAdmin ? (
            <>
              <SidebarLink to="/super-admin" icon={Activity} isCollapsed={isCollapsed}>Analytics</SidebarLink>
              <SidebarLink to="/super-admin/clinics" icon={Building2} isCollapsed={isCollapsed}>All Clinics</SidebarLink>
              <SidebarLink to="/super-admin/create-clinic" icon={UserPlus} isCollapsed={isCollapsed}>Add Clinic</SidebarLink>
            </>
          ) : (
            <>
              <SidebarLink to="/" icon={LayoutDashboard} isCollapsed={isCollapsed}>Dashboard</SidebarLink>
              <SidebarLink to="/patients" icon={Users} isCollapsed={isCollapsed}>Patients & Chats</SidebarLink>
              <SidebarLink to="/bot-settings" icon={MessageSquare} isCollapsed={isCollapsed}>WhatsApp Bot</SidebarLink>
              <SidebarLink to="/settings" icon={Settings} isCollapsed={isCollapsed}>Settings</SidebarLink>
            </>
          )}
        </nav>

        <div className="user-card" style={{ padding: isCollapsed ? '1rem 0' : '1.5rem 0' }}>
          <div className="user-info" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: 0 }}>
            <div className="user-avatar" style={{ flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden', marginLeft: '0.75rem' }}
                >
                  <p className="user-name" style={{ whiteSpace: 'nowrap', margin: 0 }}>{user?.name || 'Admin'}</p>
                  <p className="user-role" style={{ whiteSpace: 'nowrap', margin: 0 }}>
                    {isSuperAdmin ? 'Super Admin' : (user?.role === 'RECEPTIONIST' ? 'Receptionist' : (user?.role === 'PHARMACIST' ? 'Pharmacist' : 'Doctor'))}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn-logout" 
            style={{ 
              justifyContent: isCollapsed ? 'center' : 'flex-start', 
              padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
              marginTop: '1rem'
            }}
          >
            <LogOut style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', marginLeft: '0.75rem' }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ height: '100%' }}>
        <header className="topbar-wrapper">
          <div className="search-container">
            <Search style={{ width: '16px', height: '16px', color: '#94a3b8', marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder={isSuperAdmin ? "Search clinics..." : "Search patients, messages..."} 
              className="search-input"
            />
          </div>
          <div className="topbar-actions">
            <button className="btn-icon-topbar">
              <Bell style={{ width: '16px', height: '16px' }} />
              <span className="notification-dot"></span>
            </button>
            <div className="status-pill">
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              <span>{isSuperAdmin ? 'Admin Console' : 'WhatsApp active'}</span>
            </div>
          </div>
        </header>

        <main className="main-viewport">
          <div className="viewport-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
