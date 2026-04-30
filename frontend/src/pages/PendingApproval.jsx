import React from 'react';
import { Clock, LogOut, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
      <div className="max-w-md w-full bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-xl border border-white text-center">
        <div className="bg-amber-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Approval Pending</h2>
        <p className="text-gray-500 text-lg leading-relaxed mb-10">
          Hi <span className="font-bold text-gray-900">{user?.name}</span>, your clinic account is currently being reviewed by our team.
        </p>

        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-10 text-left">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            What's next?
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Our team will verify your credentials.</li>
            <li>• You'll receive full access once approved.</li>
            <li>• Usually takes 24-48 hours.</li>
          </ul>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 w-full py-4 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
