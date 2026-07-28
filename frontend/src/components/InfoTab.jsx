import React, { useState } from 'react';
import { Info, Clock, AlertTriangle, Share2, Star, Check } from 'lucide-react';

export default function InfoTab() {
  const [rated, setRated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'Satta King Numerology Predictions',
      text: 'Get live results, early morning update notifications, and free daily numerology predictions!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy WhatsApp link to clipboard
      const whatsappText = encodeURIComponent(`${shareData.text} Check it out here: ${shareData.url}`);
      window.open(`https://api.whatsapp.com/send?text=${whatsappText}`, '_blank');
    }
  };

  const handleRating = () => {
    setRated(true);
    setTimeout(() => setRated(false), 3000);
  };

  return (
    <div className="space-y-4 px-4 py-3">
      {/* Title */}
      <h2 className="text-xl font-bold tracking-wide text-amber-600 flex items-center gap-1.5">
        <Info size={22} className="text-amber-500" />
        Jaruri Jankari (Info)
      </h2>

      {/* Timetable Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
          <Clock size={15} className="text-amber-500" />
          Market Timetables
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Desawar</span>
            <span className="font-semibold text-slate-800">05:00 AM Daily</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Taj</span>
            <span className="font-semibold text-slate-800">02:00 PM Daily</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Delhi Bazar</span>
            <span className="font-semibold text-slate-800">03:00 PM Daily</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Shri Ganesh</span>
            <span className="font-semibold text-slate-800">04:30 PM Daily</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Faridabad</span>
            <span className="font-semibold text-slate-800">06:15 PM Daily</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Gaziyabad</span>
            <span className="font-semibold text-slate-800">08:00 PM Daily</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Gali</span>
            <span className="font-semibold text-slate-800">11:00 PM Daily</span>
          </div>
        </div>
      </div>

      {/* Engagement actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleShare}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-705 active:scale-98 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all text-xs"
        >
          <Share2 size={16} /> Share on WhatsApp
        </button>

        <button 
          onClick={handleRating}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-sm transition-all text-xs"
        >
          {rated ? (
            <>
              <Check size={16} className="text-slate-950 animate-bounce" /> Thank You!
            </>
          ) : (
            <>
              <Star size={16} fill="currentColor" /> 5-Star Rating
            </>
          )}
        </button>
      </div>

      {/* Platform Disclaimer Board */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <AlertTriangle size={15} className="text-amber-500" />
          Terms & Disclaimers
        </h3>
        <div className="space-y-2 text-slate-600 text-[11px] leading-relaxed">
          <p>
            <strong>1. Informational Purpose:</strong> This application is entirely dedicated to historical numerology predictions, chart analytical trends, and entertainment. We do not offer or host real-money gambling, wagering facilities, or monetary transaction modules.
          </p>
          <p>
            <strong>2. Underage Restrictions:</strong> Persons under 18 years of age are strictly prohibited from using or reading recommendations provided on this dashboard.
          </p>
          <p>
            <strong>3. Prediction Accuracy:</strong> Astrological charts and digit-based patterns are subject to statistical margins. Users are advised to exercise self-responsibility and caution.
          </p>
        </div>
      </div>
    </div>
  );
}
