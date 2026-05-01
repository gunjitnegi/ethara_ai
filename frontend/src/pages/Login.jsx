import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import api from '../api';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', secretKey: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!isLogin) {
      // Strong password regex: min 8 chars, 1 upper, 1 number, 1 special symbol
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError('Password must be at least 8 characters, include an uppercase letter, a number, and a special symbol (@$!%*?&)');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', formData);
        onLogin(data.user, data.token);
      } else {
        await api.post('/auth/signup', formData);
        const loginData = await api.post('/auth/login', { email: formData.email, password: formData.password });
        onLogin(loginData.data.user, loginData.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#a8d5f2] to-[#e4f1f9] relative overflow-hidden">
      {/* Decorative background clouds (CSS representation) */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-white/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/50 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] max-w-md w-full border border-white/50">
        
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <LogIn className="w-6 h-6 text-gray-800" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Sign in with email' : 'Create an account'}
          </h2>
          <p className="text-sm text-gray-500">
            Make a new doc to bring your words, data, and teams together. For free
          </p>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">@</span>
              </div>
              <input
                type="text"
                required
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border-none rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder-gray-400 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="email"
              required
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border-none rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder-gray-400 text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border-none rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder-gray-400 text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                placeholder="Admin Secret Key (Optional)"
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border-none rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder-gray-400 text-sm"
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
              />
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end">
              <a href="#" className="text-xs text-gray-500 hover:text-gray-800 font-medium">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#202124] hover:bg-[#3c4043] text-white font-medium py-3 rounded-xl transition-colors focus:ring-4 focus:ring-gray-200 mt-2 text-sm"
          >
            {loading ? 'Processing...' : 'Get Started'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 pt-6 border-t border-gray-100">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-800 hover:text-black font-semibold"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
