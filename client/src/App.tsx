import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskBoard } from './components/TaskBoard';
import { NotificationDropdown } from './components/NotificationDropdown';
import { LogOut, LayoutDashboard, UserCheck } from 'lucide-react';

const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <LayoutDashboard className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-white tracking-wide">Agency Hub</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition duration-200"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const DashboardView: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <LayoutDashboard className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-lg text-white">Project Dashboard</span>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-200">{user?.name}</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
              {user?.role}
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <TaskBoard />
      </main>
    </div>
  );
};

const MainRouter: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? <DashboardView /> : <LoginView />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
