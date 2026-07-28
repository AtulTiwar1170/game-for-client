import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, RefreshCw, Send, CheckCircle2, AlertTriangle, Plus, Trash2, Image, Check, X, Coins } from 'lucide-react';

export default function AdminTab() {
  const [logs, setLogs] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [bids, setBids] = useState([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [winningIndex, setWinningIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sub Tab Selection: 'game' | 'payments'
  const [subTab, setSubTab] = useState('game');

  // Payments / Balance requests state
  const [balanceRequests, setBalanceRequests] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newPaymentQRBase64, setNewPaymentQRBase64] = useState('');
  const [paymentMsg, setPaymentMsg] = useState('');
  const [requestMsg, setRequestMsg] = useState('');

  // Form State
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [overrideCondition, setOverrideCondition] = useState('WIN');
  const [message, setMessage] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      // 1. Fetch Logs
      const res = await fetch(`${apiUrl}/api/admin/logs`, {
        headers: { 'x-user-role': 'admin' },
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs.reverse()); // Show newest first
        setOverrides(json.overrides);
        setTotalAttempts(json.totalAttempts);
        setWinningIndex(json.winningIndex);
        setBids(json.bids || []);
      }

      // 2. Fetch Balance Requests
      const reqRes = await fetch(`${apiUrl}/api/admin/balance-requests`, {
        headers: { 'x-user-role': 'admin' },
        credentials: 'include'
      });
      const reqJson = await reqRes.json();
      if (reqJson.success) {
        setBalanceRequests(reqJson.data.reverse());
      }

      // 3. Fetch Payment Methods
      const payRes = await fetch(`${apiUrl}/api/payment-methods`, { credentials: 'include' });
      const payJson = await payRes.json();
      if (payJson.success) {
        setPaymentMethods(payJson.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (id, status) => {
    setRequestMsg('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/balance-requests/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setRequestMsg(`Request was successfully ${status.toLowerCase()}`);
        fetchAdminData();
      } else {
        setRequestMsg(`Error: ${data.message}`);
      }
    } catch (e) {
      setRequestMsg('Failed to process request.');
    }
  };

  const handlePaymentQRFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPaymentQRBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePaymentMethod = async (e) => {
    e.preventDefault();
    setPaymentMsg('');
    if (!newPaymentName || !newPaymentQRBase64) {
      setPaymentMsg('Name and QR image are required.');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({
          name: newPaymentName,
          qrImage: newPaymentQRBase64
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setPaymentMsg('Payment method added successfully!');
        setNewPaymentName('');
        setNewPaymentQRBase64('');
        const fileInput = document.getElementById('payment-qr-upload');
        if (fileInput) fileInput.value = '';
        fetchAdminData();
      } else {
        setPaymentMsg(`Error: ${data.message}`);
      }
    } catch (e) {
      setPaymentMsg('Failed to add payment method.');
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    setPaymentMsg('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'admin' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setPaymentMsg('Payment method deleted successfully.');
        fetchAdminData();
      } else {
        setPaymentMsg(`Error: ${data.message}`);
      }
    } catch (e) {
      setPaymentMsg('Failed to delete payment method.');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSetOverride = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!targetUserId) {
      setMessage('User ID is required.');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/override`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({
          userId: targetUserId,
          username: targetUsername || 'Override User',
          override: overrideCondition
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Successfully set override to ${overrideCondition}`);
        fetchAdminData();
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      setMessage('Failed to send override request.');
    }
  };

  return (
    <div className="space-y-4 px-4 py-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide text-amber-600 flex items-center gap-1.5">
          <Settings size={22} className="text-amber-500" />
          Admin Controller
        </h2>
        <button 
          onClick={fetchAdminData} 
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-amber-600" : ""} />
        </button>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('game')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            subTab === 'game' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          🎮 Algorithm & Game Logs
        </button>
        <button
          onClick={() => setSubTab('bids')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            subTab === 'bids' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          🔒 Locked Bids
        </button>
        <button
          onClick={() => setSubTab('winners')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            subTab === 'winners' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          🏆 Today's Winners
        </button>
        <button
          onClick={() => setSubTab('payments')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            subTab === 'payments' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          💰 Deposits & Payment QRs
        </button>
      </div>

      {subTab === 'game' && (
        <div className="space-y-4">
          {/* Analytics stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Attempts</span>
              <span className="text-xl font-extrabold text-slate-800">{totalAttempts}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Winning Slot Index</span>
              <span className="text-xl font-extrabold text-amber-600">{winningIndex} / 119</span>
            </div>
          </div>

          {/* Override Setup Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-amber-500" />
              Apply Specific User Override
            </h3>

            <form onSubmit={handleSetOverride} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Target User ID (copied from client device)</label>
                <input 
                  type="text" 
                  placeholder="e.g. user_x92fa1"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value.trim())}
                  className="w-full bg-slate-50 text-slate-805 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Username (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. VIP Member"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    className="w-full bg-slate-50 text-slate-805 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-505 block mb-1">Condition</label>
                  <select 
                    value={overrideCondition}
                    onChange={(e) => setOverrideCondition(e.target.value)}
                    className="w-full bg-slate-50 text-slate-805 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="WIN">Always Win</option>
                    <option value="LOSE">Always Lose</option>
                    <option value="NORMAL">Standard 1/120</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <Send size={12} /> Apply Override
              </button>
            </form>

            {message && (
              <div className="mt-3 text-center text-xs text-amber-850 bg-amber-50 border border-amber-200 p-1.5 rounded">
                {message}
              </div>
            )}
          </div>

          {/* Active Overrides list */}
          {Object.keys(overrides).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <span className="text-[10px] text-slate-500 block font-bold uppercase mb-2">Active Overrides</span>
              <div className="space-y-1.5">
                {Object.entries(overrides).map(([id, info]) => (
                  <div key={id} className="flex justify-between items-center text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-700">{info.username}</span>
                      <span className="text-[9px] text-slate-500 block font-mono">{id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      info.override === 'WIN' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border border-rose-500/30 text-rose-600'
                    }`}>
                      {info.override}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Logs */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 block font-bold uppercase">Recent Game Attempts Logs</span>
            
            {logs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                No game attempts logged yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs flex flex-col gap-1 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">{log.username}</span>
                      <span className="text-[9px] text-slate-500 font-mono">#{log.attemptNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <div>
                        Guess: <span className="font-bold text-amber-600">{log.guess}</span> | Target: <span className="font-bold text-indigo-600">{log.winningNumber}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({log.market || 'Desawar'} - {(log.type || 'jodi').toUpperCase()})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          log.matched ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {log.matched ? 'MATCH' : 'NO MATCH'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                      <span>ID: {log.userId}</span>
                      <span className="font-mono text-slate-500">{log.conditionApplied}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Methods (QRs) Setup */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-1.5">
              <Coins size={16} className="text-amber-500" />
              Manage Payment Options (UPI QR Codes)
            </h3>

            <form onSubmit={handleCreatePaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Payment Method Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. PhonePe QR (Atul)"
                  value={newPaymentName}
                  onChange={(e) => setNewPaymentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Upload QR Code Image</label>
                <label className="w-full flex items-center justify-center bg-slate-100 border border-slate-200 hover:bg-slate-200 px-2 py-1.5 rounded text-xs font-bold text-slate-700 cursor-pointer transition-colors text-center truncate">
                  {newPaymentQRBase64 ? "✓ Image Loaded" : "Select Image"}
                  <input 
                    type="file" 
                    id="payment-qr-upload"
                    accept="image/*" 
                    onChange={handlePaymentQRFileChange} 
                    className="hidden" 
                  />
                </label>
              </div>
              <button 
                type="submit" 
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus size={14} /> Add Payment Method
              </button>
            </form>

            {paymentMsg && <p className="text-xs font-bold text-amber-650 bg-amber-50 border border-amber-100 p-1.5 rounded text-center">{paymentMsg}</p>}

            {/* List of active payment methods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {paymentMethods.map(p => (
                <div key={p.id} className="border border-slate-200 rounded-xl p-3 flex flex-col items-center bg-slate-50 relative group">
                  <button 
                    onClick={() => handleDeletePaymentMethod(p.id)}
                    className="absolute top-2 right-2 p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                    title="Delete Method"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 mb-2 truncate max-w-[80%]">{p.name}</span>
                  <img src={p.qrImage} alt={p.name} className="w-24 h-24 object-contain bg-white border p-1 rounded mb-1" />
                </div>
              ))}
            </div>
          </div>

          {/* User Deposit Requests Review */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Incoming User Points Request Panel
            </h3>

            {requestMsg && <p className="text-xs font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 p-1.5 rounded text-center">{requestMsg}</p>}

            {balanceRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 border rounded-xl">No user point requests received yet.</p>
            ) : (
              <div className="space-y-4">
                {balanceRequests.map(r => (
                  <div key={r.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 hover:border-amber-500/30 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-sm">{r.username}</span>
                        <span className="text-[9px] text-slate-400 font-mono">({r.userId})</span>
                      </div>
                      <div className="text-xs text-slate-600 font-semibold">
                        Requested Points: <span className="text-amber-600 font-black text-sm">₹{r.points} ({r.points} pts)</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Requested: {new Date(r.createdAt).toLocaleString()}
                      </div>
                      <div className="pt-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>

                    {/* Image Verification Slot */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Payment Screenshot Slip</span>
                      <a href={r.screenshot} target="_blank" rel="noreferrer" title="Click to view full screen">
                        <img src={r.screenshot} alt="Payment slip" className="w-32 h-20 object-cover rounded border border-slate-300 hover:scale-105 transition-transform bg-white cursor-zoom-in" />
                      </a>
                    </div>

                    {/* Decision Action Buttons */}
                    {r.status === 'PENDING' ? (
                      <div className="flex gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => handleRequestAction(r.id, 'APPROVED')}
                          className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                        >
                          <Check size={14} /> Approve Payed
                        </button>
                        <button 
                          onClick={() => handleRequestAction(r.id, 'REJECTED')}
                          className="flex-1 md:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Processed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'winners' && (
        <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-1.5">
            🏆 Today's Winning Satta Participants
          </h3>
          {bids.filter(b => b.status === 'WON').length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 border border-slate-200 rounded-xl">No winning participants for this session yet.</p>
          ) : (
            <div className="space-y-4">
              {['Desawar', 'Gali', 'Faridabad', 'Gaziyabad', 'Delhi Bazar', 'Shri Ganesh', 'Taj'].map(market => {
                const marketWinners = bids.filter(b => b.market.toLowerCase() === market.toLowerCase() && b.status === 'WON');
                if (marketWinners.length === 0) return null;
                return (
                  <div key={market} className="border border-emerald-100 rounded-xl p-3.5 bg-emerald-50/50 space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-100/50 pb-1.5">
                      <span className="text-xs font-black text-emerald-800">{market} Winners</span>
                      <span className="text-[10px] bg-emerald-605 text-emerald-700 px-2 py-0.5 rounded-full font-bold bg-white border border-emerald-200 shadow-sm">
                        {marketWinners.length} Won
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {marketWinners.map(b => {
                        const isJodi = ['jodi', 'damdar_jodi', 'support_jodi'].includes(b.type);
                        const multiplier = isJodi ? 90 : 9;
                        const payout = b.points * multiplier;
                        return (
                          <div key={b.id} className="flex justify-between items-center text-xs bg-white px-3.5 py-2.5 rounded-lg border border-emerald-205 shadow-sm">
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span>👤 {b.username}</span>
                                <span className="text-[9px] text-slate-400 font-mono">({b.userId})</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                Mode: <span className="font-bold uppercase text-slate-600">{b.type.replace('_', ' ')}</span> | Number: <span className="font-extrabold text-amber-700">"{b.guess}"</span> {b.harafSide ? `(${b.harafSide.toUpperCase()})` : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-emerald-600 block">Payout: +₹{payout}</span>
                              <span className="text-[9px] text-slate-450 font-semibold block">Bid: ₹{b.points}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'bids' && (
        <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-1.5">
            🔒 Locked Satta Bids by Market Area
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {['Desawar', 'Gali', 'Faridabad', 'Gaziyabad', 'Delhi Bazar', 'Shri Ganesh', 'Taj'].map(market => {
              const marketBids = bids.filter(b => b.market.toLowerCase() === market.toLowerCase());
              return (
                <div key={market} className="border border-slate-150 rounded-lg p-2.5 bg-slate-50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-black text-slate-805">{market}</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded font-bold bg-white border border-amber-200">
                      {marketBids.length} Bids
                    </span>
                  </div>
                  {marketBids.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic block">No active participants in this area.</span>
                  ) : (
                    <div className="space-y-1.5">
                      {marketBids.map(b => (
                        <div key={b.id} className="flex justify-between items-center text-xs bg-white px-2.5 py-1.5 rounded border border-slate-200 shadow-sm">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700">{b.username}</span>
                              <span className="text-[9px] text-slate-400 font-mono">({b.userId})</span>
                            </div>
                            <div className="text-[10px] text-slate-505 mt-0.5 font-medium">
                              Mode: <span className="font-bold uppercase text-slate-500">{b.type.replace('_', ' ')}</span> | Number: <span className="font-extrabold text-slate-700">"{b.guess}"</span> {b.harafSide ? `(${b.harafSide.toUpperCase()})` : ''} | <span className="font-bold text-amber-600">₹{b.points}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            b.status === 'WON' 
                              ? 'bg-emerald-550/10 border border-emerald-500/30 text-emerald-600 animate-pulse' 
                              : b.status === 'LOST'
                                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600'
                                : 'bg-amber-500/10 border border-amber-500/30 text-amber-600'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
