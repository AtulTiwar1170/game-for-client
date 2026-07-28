import React, { useState, useEffect } from 'react';
import { Coins, Image, Clock, CheckCircle2, AlertCircle, Sparkles, QrCode } from 'lucide-react';

export default function AddBalanceTab({ currentUser }) {
  const userId = currentUser?.id || localStorage.getItem('satta_game_userId') || 'Anonymous';
  const username = currentUser?.username || localStorage.getItem('satta_game_username') || 'Player';

  const [points, setPoints] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [reqPoints, setReqPoints] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPointsAndRequests = async () => {
    if (!userId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      // 1. Fetch user points
      const ptsRes = await fetch(`${apiUrl}/api/users/${userId}/points`);
      const ptsJson = await ptsRes.json();
      if (ptsJson.success) {
        setPoints(ptsJson.points);
      }
      
      // 2. Fetch payment methods
      const payRes = await fetch(`${apiUrl}/api/payment-methods`);
      const payJson = await payRes.json();
      if (payJson.success) {
        setPaymentMethods(payJson.data);
      }

      // 3. Fetch admin's balance requests to filter for this user
      const reqRes = await fetch(`${apiUrl}/api/admin/balance-requests`, {
        headers: { 'x-user-role': 'admin' }
      });
      const reqJson = await reqRes.json();
      if (reqJson.success) {
        const filtered = reqJson.data.filter(r => r.userId === userId);
        setMyRequests(filtered.reverse());
      }
    } catch (e) {
      console.error("Error syncing points / methods:", e);
    }
  };

  useEffect(() => {
    fetchPointsAndRequests();
    const interval = setInterval(fetchPointsAndRequests, 5000);
    return () => clearInterval(interval);
  }, [userId]);

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
    setError('');
    setSuccess('');

    if (!reqPoints || isNaN(reqPoints) || Number(reqPoints) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!screenshotBase64) {
      setError('Please upload a payment screenshot.');
      return;
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/balance/request`, {
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
        setSuccess('Balance request submitted! Pending Admin verification.');
        setReqPoints('');
        setScreenshotBase64('');
        const fileInput = document.getElementById('screenshot-upload');
        if (fileInput) fileInput.value = '';
        fetchPointsAndRequests();
      } else {
        setError(data.message || 'Failed to submit request.');
      }
    } catch (err) {
      setError('Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-xl font-bold tracking-wide text-amber-600 flex items-center gap-2">
          <QrCode size={24} className="text-amber-500" />
          Add Points (Deposit)
        </h2>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold uppercase px-2 py-1 rounded">
          1 Point = ₹1
        </span>
      </div>

      {/* Points Balance Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center relative overflow-hidden border border-slate-700/30">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Current Points Balance</span>
          <span className="text-4xl font-black text-amber-500 flex items-center gap-2">
            <Coins className="text-amber-500" size={32} />
            {points.toLocaleString()} <span className="text-xs text-slate-400 font-normal">pts</span>
          </span>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Conversion Rules</span>
          <span className="text-xs text-emerald-400 font-semibold block">₹1 Paid = 1 Point Added</span>
          <span className="text-[9px] text-slate-400 block">Manual admin approval required</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Scan & Pay */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">1</span>
            Scan & Pay QR
          </h3>

          <div className="flex gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 leading-normal">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-600" />
            <span>
              Scan any QR code below using your payment app (Google Pay, PhonePe, UPI) and complete the payment. Make sure to take a screenshot.
            </span>
          </div>

          {paymentMethods.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">No payment methods configured by admin.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paymentMethods.map(p => (
                <div key={p.id} className="border border-slate-100 rounded-xl p-4 flex flex-col items-center bg-slate-50 relative">
                  <span className="text-xs font-bold text-slate-700 mb-3">{p.name}</span>
                  <img src={p.qrImage} alt={p.name} className="w-40 h-40 object-contain bg-white border p-1.5 rounded-lg shadow-sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Upload Screenshot */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">2</span>
            Submit Payment Request
          </h3>

          <form onSubmit={handleAddBalanceSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Deposit Amount (INR / Points)</label>
              <input 
                type="number" 
                placeholder="e.g. 500" 
                value={reqPoints}
                onChange={(e) => setReqPoints(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded text-xs outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Upload Receipt Screenshot</label>
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 py-6 px-4 rounded-xl cursor-pointer transition-colors text-center text-xs font-bold text-slate-600 gap-1.5">
                <Image className="text-slate-400" size={24} />
                {screenshotBase64 ? "✓ Screenshot Loaded" : "Click to select slip screenshot"}
                <input 
                  type="file" 
                  id="screenshot-upload"
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition-colors"
            >
              {loading ? 'Submitting Details...' : 'Request Point Credit'}
            </button>
          </form>

          {error && (
            <div className="text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              {success}
            </div>
          )}
        </div>
      </div>

      {/* Deposit Requests History list */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Clock size={16} className="text-amber-500" />
          My Deposit Request History
        </h3>
        
        {myRequests.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">No deposit requests submitted yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {myRequests.map((r) => (
              <div 
                key={r.id} 
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center shadow-sm"
              >
                <div>
                  <span className="font-bold text-slate-700 text-sm">Requested: ₹{r.points}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Submitted at: {new Date(r.createdAt).toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">ID: {r.id}</span>
                </div>

                <div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    r.status === 'APPROVED' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                    r.status === 'REJECTED' ? 'bg-rose-50 border border-rose-200 text-rose-700' :
                    'bg-amber-50 border border-amber-200 text-amber-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
