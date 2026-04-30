import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Loader2, ArrowRight } from 'lucide-react';
import { login } from '../services/api';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(formData);
      const { token } = response.data;
      const { user } = response.data.data;
      setAuth(user, token);
      
      // Redirect based on role
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-gray-500 text-lg">Sign in to your clinic portal.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none"
              placeholder="john@clinic.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition-all outline-none"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 px-6 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 shadow-xl shadow-blue-200 mt-8"
          >
            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Register Clinic
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
