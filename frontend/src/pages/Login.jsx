import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = ({ setView }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'admin') setView('admin');
      else if (res.user.role === 'attendant') setView('scanner');
      else setView('dashboard');
    } else {
      setError(res.error);
    }
  };

  const handleQuickDemo = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto shadow-sm shadow-orange-300 mb-3">
            <Car className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Welcome to ParkCloud</h2>
          <p className="text-xs text-stone-500 mt-1">Sign in to manage and book your smart parking slots.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-orange-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="driver@parkcloud.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-orange-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm shadow-orange-300 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Roles Quick Fill */}
        <div className="mt-6 pt-5 border-t border-orange-100">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 text-center mb-2">
            Quick Fill Demo Roles
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('driver@parkcloud.app')}
              className="px-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200 transition"
            >
              🚗 Driver
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('attendant@parkcloud.app')}
              className="px-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200 transition"
            >
              🎫 Attendant
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@parkcloud.app')}
              className="px-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200 transition"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="text-center mt-5 text-xs text-stone-600">
          Don't have an account?{' '}
          <button
            onClick={() => setView('register')}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};
