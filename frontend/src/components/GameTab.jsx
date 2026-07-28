import React, { useState, useEffect } from 'react';
import { Target, User, Info, Trophy, XCircle, MapPin, Coins, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GameTab() {
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [guess, setGuess] = useState('');
  const [gameType, setGameType] = useState('jodi'); // 'jodi' | 'damdar_jodi' | 'support_jodi' | 'single_haraf'
  const [harafSide, setHarafSide] = useState('andar'); // 'andar' | 'bahar'
  const [selectedMarket, setSelectedMarket] = useState('Desawar');
  const [bidPoints, setBidPoints] = useState('100');
  
  const [points, setPoints] = useState(0);

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const markets = ['Desawar', 'Gali', 'Faridabad', 'Gaziyabad', 'Delhi Bazar', 'Shri Ganesh', 'Taj'];

  const updatePoints = (newVal) => {
    setPoints(newVal);
  };

  const fetchPointsAndRequests = async (uid) => {
    if (!uid) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      // Fetch user points
      const ptsRes = await fetch(`${apiUrl}/api/users/${uid}/points`);
      const ptsJson = await ptsRes.json();
      if (ptsJson.success) {
        setPoints(ptsJson.points);
      }
    } catch (e) {
      console.error("Error syncing points:", e);
    }
  };

  useEffect(() => {
    // Generate or fetch user info from localStorage
    let storedId = localStorage.getItem('satta_game_userId');
    let storedName = localStorage.getItem('satta_game_username');
    if (!storedId) {
      storedId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('satta_game_userId', storedId);
    }
    if (!storedName) {
      storedName = 'Player ' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('satta_game_username', storedName);
    }
    setUserId(storedId);
    setUsername(storedName);
  }, []);

  const fetchBids = async (uid) => {
    if (!uid) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/game/bids/${uid}`);
      const json = await res.json();
      if (json.success) {
        setBids(json.bids);
      }
    } catch (e) {
      console.error("Error fetching bids:", e);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBids(userId);
      fetchPointsAndRequests(userId);
      const interval = setInterval(() => {
        fetchBids(userId);
        fetchPointsAndRequests(userId);
      }, 7000); // Poll every 7 seconds
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Reset guess input when switching game type
  useEffect(() => {
    setGuess('');
    setError('');
    setSuccessMsg('');
  }, [gameType]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const isJodi = ['jodi', 'damdar_jodi', 'support_jodi'].includes(gameType);
    const pts = Number(bidPoints);
    const num = Number(guess);

    if (isJodi) {
      if (isNaN(num) || num < 11 || num > 99) {
        setError('Jodi number must be a number between 11 and 99.');
        return;
      }
    } else {
      if (isNaN(num) || num < 0 || num > 9 || guess.length !== 1) {
        setError('Single Haraf must be a single digit between 0 and 9.');
        return;
      }
    }

    if (isNaN(pts) || pts <= 0) {
      setError('Please enter a valid point amount to bid.');
      return;
    }

    if (pts > points) {
      setError(`Insufficient Points! You only have ${points} points.`);
      return;
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/game/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          username, 
          market: selectedMarket,
          type: gameType,
          harafSide: gameType === 'single_haraf' ? harafSide : undefined,
          guess,
          points: pts
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Bid Locked! Number "${guess}" is registered for ${selectedMarket}.`);
        setGuess('');
        fetchBids(userId);
        fetchPointsAndRequests(userId);
      } else {
        setError(data.message || 'Bid collision or validation failure.');
      }
    } catch (err) {
      setError('Failed to reach server. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = (val) => {
    setUsername(val);
    localStorage.setItem('satta_game_username', val);
  };

  const handleResetPoints = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/users/${userId}/points`);
      const data = await res.json();
      if (data.success) {
        // Reset/refresh from server
        fetchPointsAndRequests(userId);
        setSuccessMsg('Points refreshed from server successfully!');
      }
    } catch (e) {
      setSuccessMsg('Failed to refresh points.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBalanceSubmit = async (e) => {
    e.preventDefault();
    setAddBalanceError('');
    setAddBalanceSuccess('');

    if (!reqPoints || isNaN(reqPoints) || Number(reqPoints) <= 0) {
      setAddBalanceError('Please enter a valid amount.');
      return;
    }
    if (!screenshotBase64) {
      setAddBalanceError('Please upload payment screenshot.');
      return;
    }

    try {
      setAddBalanceLoading(true);
      const res = await fetch('http://localhost:5000/api/balance/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username,
          points: Number(reqPoints),
          screenshot: screenshotBase64
        })
      });
      const data = await res.json();
      if (data.success) {
        setAddBalanceSuccess('Balance request submitted! Pending Admin verification.');
        setReqPoints('');
        setScreenshotBase64('');
        const fileInput = document.getElementById('screenshot-upload');
        if (fileInput) fileInput.value = '';
        fetchPointsAndRequests(userId);
      } else {
        setAddBalanceError(data.message || 'Failed to submit request.');
      }
    } catch (err) {
      setAddBalanceError('Network connection failed.');
    } finally {
      setAddBalanceLoading(false);
    }
  };

  const getFriendlyType = (type, side) => {
    if (type === 'single_haraf') return `Single Haraf (${side ? side.toUpperCase() : ''})`;
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-4 px-4 py-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide text-amber-600 flex items-center gap-1.5">
          <Target size={22} className="text-amber-500" />
          Satta Virtual Bidding Panel
        </h2>
        <button 
          onClick={handleResetPoints}
          className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded font-semibold transition-colors"
        >
          Reset Points
        </button>
      </div>

      {/* Header Info Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <User size={15} className="text-amber-500" /> Session Details
            </span>
            <span className="text-[10px] text-slate-400 font-mono select-all">ID: {userId}</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={username} 
              onChange={(e) => updateUsername(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-slate-50 text-slate-805 border border-slate-200 px-2 py-1 rounded focus:border-amber-500 outline-none text-[11px] font-semibold"
            />
          </div>
        </div>

        {/* Virtual points balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Virtual Balance (₹1 = 1 pt)</span>
            <span className="text-3xl font-black text-slate-800 flex items-center gap-1.5">
              <Coins className="text-amber-500" size={24} />
              {points.toLocaleString()} <span className="text-xs text-slate-400 font-normal">pts</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Payout rates</span>
            <span className="text-[10px] text-emerald-600 font-bold block">Jodi: 90x Payout</span>
            <span className="text-[10px] text-indigo-600 font-bold block">Haraf: 9x Payout</span>
          </div>
        </div>
      </div>

      {/* Bidding placement form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Lock size={16} className="text-amber-500" /> Lock New Satta Bid
        </h3>

        <div className="flex gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-normal">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong>Time Limit Rule:</strong> Bids lock daily at 12:00 AM midnight. Bids placed now will settle against results declared on: <span className="font-bold">{(() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              return tomorrow.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            })()}</span>.
          </span>
        </div>

        <form onSubmit={handleBidSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Area */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Market Area</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 px-2.5 py-1.5 rounded focus:border-amber-500 outline-none text-xs font-semibold"
              >
                {markets.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Play Type */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Play Type</label>
              <div className="flex rounded bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setGameType('jodi')}
                  className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all ${
                    gameType === 'jodi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Jodi
                </button>
                <button
                  type="button"
                  onClick={() => setGameType('damdar_jodi')}
                  className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all ${
                    gameType === 'damdar_jodi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Damdar
                </button>
                <button
                  type="button"
                  onClick={() => setGameType('support_jodi')}
                  className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all ${
                    gameType === 'support_jodi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Support
                </button>
                <button
                  type="button"
                  onClick={() => setGameType('single_haraf')}
                  className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all ${
                    gameType === 'single_haraf' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Haraf
                </button>
              </div>
            </div>

            {/* Bid points amount */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Points to Bid</label>
              <input
                type="number"
                min="10"
                step="10"
                value={bidPoints}
                onChange={(e) => setBidPoints(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 px-2.5 py-1.5 rounded focus:border-amber-500 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          {/* Sub options if Single Haraf is selected */}
          {gameType === 'single_haraf' && (
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-600">Select Haraf Side:</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="harafSide"
                    value="andar"
                    checked={harafSide === 'andar'}
                    onChange={() => setHarafSide('andar')}
                    className="accent-amber-500"
                  />
                  Andar (Inside)
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="harafSide"
                    value="bahar"
                    checked={harafSide === 'bahar'}
                    onChange={() => setHarafSide('bahar')}
                    className="accent-amber-500"
                  />
                  Bahar (Outside)
                </label>
              </div>
            </div>
          )}

          {/* Number Selection */}
          <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-150">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Your Bid Target Number ({['jodi', 'damdar_jodi', 'support_jodi'].includes(gameType) ? '11-99' : '0-9'}):
            </label>
            <div className="flex justify-center">
              <input 
                type="text" 
                maxLength={['jodi', 'damdar_jodi', 'support_jodi'].includes(gameType) ? 2 : 1} 
                placeholder={['jodi', 'damdar_jodi', 'support_jodi'].includes(gameType) ? '11' : '0'}
                value={guess} 
                onChange={(e) => setGuess(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-24 h-16 text-center text-4xl font-black bg-white text-amber-600 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none transition-all tracking-tight shadow-sm"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-bold py-2.5 px-4 rounded-lg shadow-md transition-all text-sm flex items-center justify-center gap-1.5"
          >
            <Lock size={16} /> {loading ? 'Locking Bid...' : 'Lock Satta Bid Number'}
          </button>
        </form>

        {error && (
          <div className="text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
            {successMsg}
          </div>
        )}
      </div>

      {/* Locked Bids list */}
      <div className="space-y-2">
        <h3 className="text-xs text-slate-500 block font-bold uppercase tracking-wider">
          My Locked Bids & Morning Settlements
        </h3>
        
        {bids.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl shadow-sm">
            No bids locked for this session yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {bids.slice().reverse().map((b) => (
              <div 
                key={b.id} 
                className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 text-sm">{b.market}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {getFriendlyType(b.type, b.harafSide)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Bidded Number: <span className="font-bold text-slate-800">"{b.guess}"</span> | Points: <span className="font-semibold text-slate-700">{b.points} pts</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                    Locked at: {new Date(b.lockedAt).toLocaleTimeString()} | Result Date: <span className="font-bold text-amber-600">{b.targetResultDate}</span>
                  </span>
                </div>

                <div>
                  {b.status === 'PENDING' && (
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">
                      <Lock size={12} /> Pending Result
                    </span>
                  )}
                  {b.status === 'WON' && (
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1 animate-pulse">
                      <Trophy size={12} /> WON (+{b.points * (['jodi', 'damdar_jodi', 'support_jodi'].includes(b.type) ? 90 : 9)} pts)
                    </span>
                  )}
                  {b.status === 'LOST' && (
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600 flex items-center gap-1">
                      <XCircle size={12} /> Lost
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Info Notice about the Game Rules */}
      <div className="flex gap-2.5 p-3.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-500 leading-relaxed shadow-sm">
        <Info size={16} className="shrink-0 text-amber-500 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700 block mb-0.5">Bidding & Settlement Rules:</span>
          This is an informational virtual simulation of Satta King results matching. Virtual bids are strictly tied to their respective markets (e.g. Desawar bid will only match Desawar declared result). Results settle instantly against current declared items.
        </div>
      </div>
    </div>
  );
}
