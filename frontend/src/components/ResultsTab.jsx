import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, AlertCircle, ArrowLeft, ChevronRight, TrendingUp } from 'lucide-react';

export default function ResultsTab() {
  const [results, setResults] = useState([]);
  const [isMorningWindow, setIsMorningWindow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverTime, setServerTime] = useState(null);
  const [selectedMarketId, setSelectedMarketId] = useState(null);

  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffledNumber, setShuffledNumber] = useState('--');
  const [predictions, setPredictions] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeLeftForOpening = (openingTimeStr) => {
    if (!openingTimeStr) return { hours: 0, minutes: 0, seconds: 0 };
    
    try {
      const now = new Date();
      const [time, modifier] = openingTimeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }
      
      const difference = target - now;
      if (difference > 0) {
        return {
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
    } catch (e) {
      console.error("Error parsing opening time:", e);
    }
    return { hours: 0, minutes: 0, seconds: 0 };
  };

  const isWithin15MinsBeforeOpening = (openingTimeStr) => {
    if (!openingTimeStr) return false;
    try {
      const now = new Date();
      const [time, modifier] = openingTimeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }
      
      const difference = target - now;
      const diffMins = difference / (1000 * 60);
      return diffMins > 0 && diffMins <= 15;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/results/today`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
        setIsMorningWindow(json.isMorningWindow);
        setServerTime(new Date(json.serverTime));
      }

      const predRes = await fetch(`${apiUrl}/api/predictions/today`);
      const predJson = await predRes.json();
      if (predJson.success) {
        setPredictions(predJson.data);
      }
    } catch (err) {
      console.error("Error fetching live results/predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 60000); // Poll server every 60 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMarketId) {
      setIsShuffling(true);
      setShuffledNumber('--');
      
      const shuffleInterval = setInterval(() => {
        const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        setShuffledNumber(rand);
      }, 70);

      const timeout = setTimeout(() => {
        clearInterval(shuffleInterval);
        setIsShuffling(false);
      }, 1500);

      return () => {
        clearInterval(shuffleInterval);
        clearTimeout(timeout);
      };
    }
  }, [selectedMarketId]);

  const isLive = (lastUpdatedStr) => {
    if (!lastUpdatedStr) return false;
    const diffMs = new Date() - new Date(lastUpdatedStr);
    const diffMins = diffMs / (1000 * 60);
    return diffMins >= 0 && diffMins <= 15;
  };

  const selectedResult = results.find(r => r.id === selectedMarketId);

  // DETAILED VIEW (Another Screen)
  if (selectedMarketId && selectedResult) {
    const live = isLive(selectedResult.lastUpdated);
    return (
      <div className="space-y-6 px-4 py-3">
        {/* Header with Back button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedMarketId(null)}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Market Live Result</span>
            <h2 className="text-xl font-black text-slate-800">{selectedResult.marketName}</h2>
          </div>
        </div>

        {/* Detailed result card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          {/* Flashing Live Badge */}
          {live && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold px-3 py-1 rounded-full animate-flash">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              LIVE UPDATING
            </div>
          )}

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Opening Schedule</span>
              <span className="text-sm font-semibold text-amber-600 flex items-center gap-1.5 font-sans">
                <Clock size={16} /> Declared daily at {selectedResult.openingTime}
              </span>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-mono text-sm px-4 py-2 rounded-lg shadow-sm font-bold text-center flex flex-col justify-center min-w-[120px]">
              <span className="text-[9px] uppercase tracking-wider block text-amber-100 font-sans mb-0.5">Time Remaining</span>
              {(() => {
                const tl = getTimeLeftForOpening(selectedResult.openingTime);
                return `${tl.hours.toString().padStart(2, '0')}:${tl.minutes.toString().padStart(2, '0')}:${tl.seconds.toString().padStart(2, '0')}`;
              })()}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-center space-y-4 shadow-inner">
              {/* Single Jodi */}
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 block mb-1">
                  {isShuffling ? "Shuffling..." : "Single Jodi Result"}
                </span>
                <span className={`text-5xl font-black tracking-tight block py-1.5 ${isShuffling ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}`}>
                  {isShuffling ? shuffledNumber : (selectedResult.currentResult || '--')}
                </span>
              </div>

              {/* Single Haraf (Andar / Bahar) */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-4">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Single Haraf (Andar)</span>
                  <span className="text-xl font-extrabold text-slate-700 bg-slate-100/50 px-3 py-1 rounded border border-slate-150 inline-block min-w-[36px]">
                    {isShuffling ? shuffledNumber.charAt(0) : (selectedResult.currentResult && selectedResult.currentResult !== '--' ? selectedResult.currentResult.charAt(0) : '--')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Single Haraf (Bahar)</span>
                  <span className="text-xl font-extrabold text-slate-700 bg-slate-100/50 px-3 py-1 rounded border border-slate-150 inline-block min-w-[36px]">
                    {isShuffling ? shuffledNumber.charAt(1) : (selectedResult.currentResult && selectedResult.currentResult !== '--' ? selectedResult.currentResult.charAt(1) : '--')}
                  </span>
                </div>
              </div>

              {/* Damdar & Support Jodis */}
              {selectedResult.predictions && (() => {
                const showPredictions = (selectedResult.currentResult && selectedResult.currentResult !== '--') || isWithin15MinsBeforeOpening(selectedResult.openingTime);
                if (showPredictions) {
                  return (
                    <div className="border-t border-slate-200/80 pt-4 space-y-3 text-left">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Damdar Jodi Results</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedResult.predictions.damdarJodi.map((val) => (
                            <span key={val} className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Support Jodi Results</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedResult.predictions.saportJodi.map((val) => (
                            <span key={val} className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="border-t border-slate-200/80 pt-4 text-center py-4 bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">🔮 Predictions Locked</span>
                      <span className="text-[10px] text-slate-500 block px-4 leading-normal">
                        Predictions will unlock exactly 15 minutes before result publication time.
                      </span>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">Yesterday's Closed Number</span>
              <span className="text-2xl font-extrabold text-slate-500">
                {selectedResult.previousResult || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Information box */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            This screen displays real-time official live result outputs. Results update automatically around the market declaration hour.
          </span>
        </div>
      </div>
    );
  }

  // LIST VIEW (Main Screen Options)
  return (
    <div className="space-y-4 px-4 py-3">
      {/* Top Banner / Heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide text-amber-600">Aaj Ke Result</h2>
        <button 
          onClick={fetchResults} 
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-amber-600" : ""} />
        </button>
      </div>

      {/* Morning Timing Note Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <span className="font-semibold text-blue-700">Result Schedule:</span> Official declarations happen early morning between <span className="font-bold text-amber-700">6:00 AM to 7:00 AM</span>.
        </div>
      </div>

      {/* Results List Options */}
      {loading && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading market list...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {results.map((r) => {
            const live = isLive(r.lastUpdated);
            return (
              <div 
                key={r.id} 
                onClick={() => setSelectedMarketId(r.id)}
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-amber-500/50 hover:bg-slate-50 shadow-sm cursor-pointer flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      {r.marketName}
                      {live && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-flash"></span>
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={12} /> Opens: {r.openingTime}</span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold">
                        {(() => {
                          const tl = getTimeLeftForOpening(r.openingTime);
                          return `${tl.hours.toString().padStart(2, '0')}:${tl.minutes.toString().padStart(2, '0')}:${tl.seconds.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-600 group-hover:text-amber-700 transition-colors">
                    View Live Result
                  </span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
