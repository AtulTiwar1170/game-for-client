import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

export default function PredictionsTab() {
  const [predictions, setPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/predictions/today');
      const json = await res.json();
      if (json.success) {
        setPredictions(json.data);
      }
    } catch (err) {
      console.error("Error fetching predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  if (loading && !predictions) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">Calculating today's predictions...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'single', label: 'Single Jodi' },
    { id: 'damdar', label: 'Damdar Jodi' },
    { id: 'saport', label: 'Saport Jodi' },
    { id: 'hurf', label: 'Single Hurf' }
  ];

  return (
    <div className="space-y-4 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide text-amber-600 flex items-center gap-1.5">
          <Sparkles size={20} className="text-amber-500" />
          Numerology Predictions
        </h2>
        <button 
          onClick={fetchPredictions} 
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-amber-600" : ""} />
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[11px] font-bold py-2 rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prediction Cards Display */}
      {predictions && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          
          {/* Single Jodi */}
          {activeTab === 'single' && (
            <div className="text-center py-6">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-600 block mb-2">Premium Prediction</span>
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-amber-500/20 bg-amber-500/5 shadow-lg shadow-amber-500/5 mb-3">
                <span className="text-5xl font-black text-amber-600 tracking-tight">{predictions.singleJodi}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                Premium single Jodi calculated by historical numerology chart analysis. High probability segment.
              </p>
            </div>
          )}

          {/* Damdar Jodi */}
          {activeTab === 'damdar' && (
            <div className="space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-600 block text-center mb-3">Highly Prioritized Backup Jodis</span>
              <div className="grid grid-cols-2 gap-3">
                {predictions.damdarJodi.map((num, i) => (
                  <div key={i} className="flex items-center justify-center bg-slate-50/50 border border-slate-200 rounded-lg py-3 hover:border-emerald-500/30 transition-colors">
                    <span className="text-2xl font-extrabold text-emerald-600">{num}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 text-center leading-normal pt-2">
                Secondary high probability targets matching current day astrological configurations.
              </p>
            </div>
          )}

          {/* Saport Jodi */}
          {activeTab === 'saport' && (
            <div className="space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-500 block text-center mb-3">Safety Number Cover Set</span>
              <div className="grid grid-cols-4 gap-2">
                {predictions.saportJodi.map((num, i) => (
                  <div key={i} className="flex items-center justify-center bg-slate-50/30 border border-slate-200 rounded-md py-2.5">
                    <span className="text-lg font-bold text-slate-700">{num}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 text-center leading-normal pt-2">
                Standard safety nets for balanced risk coverage across segments.
              </p>
            </div>
          )}

          {/* Single Hurf */}
          {activeTab === 'hurf' && (
            <div className="space-y-6 py-4">
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-600 block text-center mb-1">Single Digit Hurf Analysis</span>
              <div className="flex justify-around items-center gap-4">
                <div className="flex-1 text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Andar (Inside)</span>
                  <span className="text-3xl font-black text-indigo-600">{predictions.andarHurf}</span>
                </div>
                <div className="flex-1 text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Bahar (Outside)</span>
                  <span className="text-3xl font-black text-indigo-600">{predictions.baharHurf}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Separate single digit indicators helpful for specific single board configurations.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Safety Notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-850 leading-relaxed">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <span>
          <strong>Disclaimer:</strong> Predictions are based strictly on algorithmic numerology calculation trends. These are not guaranteed wins. Real wagering is strictly discouraged.
        </span>
      </div>
    </div>
  );
}
