import React, { useState } from 'react';
import ResultsTab from './components/ResultsTab';
import GameTab from './components/GameTab';
import AddBalanceTab from './components/AddBalanceTab';
import AdminTab from './components/AdminTab';
import InfoTab from './components/InfoTab';
import { Home, Target, Settings, Info, Share2, LogOut, Key, UserPlus, Wallet } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('satta_auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [activeTab, setActiveTab] = useState('results');
  
  // Dynamic SEO page titles
  React.useEffect(() => {
    const titleMap = {
      'results': 'Satta King Live Results - Fast Jodi & Haraf Updates',
      'add-balance': 'Deposit Points & Add Balance - Satta King Virtual Wallet',
      'game': 'Virtual Satta Game - Jodi & Haraf Play Board',
      'admin': 'Admin Panel - Satta Controller Controller',
      'info': 'Satta Numerology Info & Game Guide'
    };
    document.title = titleMap[activeTab] || 'Satta King Live';
  }, [activeTab]);

  // Auth Form State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (!usernameInput || !passwordInput) {
      setAuthError('Please fill in all fields.');
      setAuthLoading(false);
      return;
    }

    try {
      const endpoint = authMode === 'login' ? 'login' : 'register';
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (authMode === 'login') {
          localStorage.setItem('satta_auth_user', JSON.stringify(data.user));
          setCurrentUser(data.user);
          // Set user's session username inside localStorage for Game Tab compatibility
          localStorage.setItem('satta_game_userId', data.user.id);
          localStorage.setItem('satta_game_username', data.user.username);
        } else {
          setAuthMode('login');
          setAuthError('Registration successful! Please log in.');
        }
        setUsernameInput('');
        setPasswordInput('');
      } else {
        setAuthError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Connection failed. Make sure backend is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('satta_auth_user');
    setCurrentUser(null);
    setActiveTab('results');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'results':
        return <ResultsTab />;
      case 'game':
        return <GameTab />;
      case 'add-balance':
        return <AddBalanceTab currentUser={currentUser} />;
      case 'admin':
        return currentUser?.role === 'admin' ? <AdminTab /> : <ResultsTab />;
      case 'info':
        return <InfoTab />;
      default:
        return <ResultsTab />;
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Satta King Numerology app',
      text: 'Check live results and numerology predictions!',
      url: window.location.origin
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {}
    } else {
      const whatsappText = encodeURIComponent(`${shareData.text} Check here: ${shareData.url}`);
      window.open(`https://api.whatsapp.com/send?text=${whatsappText}`, '_blank');
    }
  };

  // RENDER LOGIN / REGISTER CARD IF NOT AUTHENTICATED
  if (!currentUser) {
    return (
      <div className="w-full min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-amber-500/20 mx-auto">
              👑
            </div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
              Satta King Numerology Hub
            </h1>
            <p className="text-xs text-slate-500">
              {authMode === 'login' 
                ? 'Please log in to place bids and see predictions' 
                : 'Create an account (you will be redirected to the login page to sign in after registering)'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500 font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            {authError && (
              <p className="text-[11px] text-rose-600 font-semibold text-center mt-1 bg-rose-50 border border-rose-100 py-1.5 rounded">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              {authMode === 'login' ? <Key size={14} /> : <UserPlus size={14} />}
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Register Account'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="text-xs text-amber-600 font-bold hover:underline"
            >
              {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Log In"}
            </button>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-[10px] text-slate-500 leading-normal">
            <span className="font-bold block text-slate-700 mb-0.5">Demo Accounts:</span>
            - Admin: username <span className="font-semibold text-amber-600">admin</span> / password <span className="font-semibold text-amber-600">admin123</span><br />
            - User: Click register to create a normal player account instantly.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 relative flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
            👑
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-slate-900 uppercase m-0 leading-tight">
              Satta King
            </h1>
            <span className="text-[10px] text-amber-600 font-bold tracking-widest block uppercase">
              Numerology Hub
            </span>
          </div>
        </div>
        
        {/* Profile & Share shortcuts */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase tracking-wider">
            👤 {currentUser.username} ({currentUser.role})
          </span>
          <button 
            onClick={handleShareApp}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Share App"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 transition-colors"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Tab Content Viewport */}
      <main className="flex-grow pb-40 max-w-7xl w-full mx-auto px-4 md:px-8">
        {renderContent()}
      </main>

      {/* Floating Bottom Navigation Bar (Stretch to 100% width) */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white border-t border-slate-200 py-3 px-6 flex justify-around items-center shadow-lg min-h-[64px]">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 transition-all min-h-[48px] ${
            activeTab === 'results' ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home size={24} />
          <span className="text-[11px] tracking-wide">Results</span>
        </button>
        <button
          onClick={() => setActiveTab('add-balance')}
          className={`flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 transition-all min-h-[48px] ${
            activeTab === 'add-balance' ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet size={24} />
          <span className="text-[11px] tracking-wide">Add Balance</span>
        </button>

        <button
          onClick={() => setActiveTab('game')}
          className={`flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 transition-all min-h-[48px] ${
            activeTab === 'game' ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target size={24} />
          <span className="text-[11px] tracking-wide">Game</span>
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 transition-all min-h-[48px] ${
              activeTab === 'admin' ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={24} />
            <span className="text-[11px] tracking-wide">Admin</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('info')}
          className={`flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 transition-all min-h-[48px] ${
            activeTab === 'info' ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info size={24} />
          <span className="text-[11px] tracking-wide">Info</span>
        </button>
      </nav>

      {/* Compliance / Risk Safety Sticky Global Footer (Non-dismissible - placed just above bottom nav) */}
      <footer className="fixed bottom-[65px] left-0 right-0 w-full bg-slate-100 border-t border-slate-200 px-4 py-2.5 text-center text-[10px] text-slate-500 leading-tight z-50 flex items-center justify-center font-medium">
        <span>
          ⚠️ Informational, numerology, and entertainment purposes only. No real-money gambling, wagering, or financial transactions permitted.
        </span>
      </footer>
    </div>
  );
}
