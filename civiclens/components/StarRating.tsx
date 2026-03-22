'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Send, Loader2, CheckCircle2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface StarRatingProps {
  complaintId: string;
  category: string;
  isVisible: boolean; // only show when complaint is resolved
}

const STAR_LABELS = ['', 'Very Poor 😞', 'Poor 😐', 'Average 😊', 'Good 👍', 'Excellent ⭐'];

export default function StarRating({ complaintId, category, isVisible }: StarRatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [existingStars, setExistingStars] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const token = localStorage.getItem('civiclens_token');
    fetch(`${API}/ratings/check/${complaintId}`, {
      headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
    }).then(r => r.json()).then(data => {
      if (data.alreadyRated) { setAlreadyRated(true); setExistingStars(data.rating?.stars || 0); }
    }).catch(() => {});
  }, [complaintId, isVisible]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('civiclens_token');
      const res = await fetch(`${API}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ complaintId, stars: selected, review }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setAlreadyRated(true);
        setExistingStars(selected);
        setTimeout(() => setIsOpen(false), 2000);
      }
    } catch {}
    setSubmitting(false);
  };

  if (!isVisible) return null;

  // Show rated badge if already rated
  if (alreadyRated && !isOpen) {
    return (
      <div className="flex items-center gap-1.5 mt-2">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={14} className={i <= existingStars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} />
        ))}
        <span className="text-[10px] text-slate-500 font-medium">You rated this</span>
      </div>
    );
  }

  return (
    <>
      {/* Rate Button */}
      {!alreadyRated && (
        <button onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-xs font-bold hover:bg-yellow-100 transition-colors">
          <Star size={13} className="fill-yellow-400 text-yellow-400" />
          Rate Contractor Work
        </button>
      )}

      {/* Rating Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: '100%', scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: '100%' }}
              className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[40px] p-6 shadow-2xl z-10">

              {submitted ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-900">Thank you!</h3>
                  <p className="text-sm text-slate-500 mt-1">Your feedback helps improve services.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Rate Contractor</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{category} complaint</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
                  </div>

                  {/* Stars */}
                  <div className="flex justify-center gap-3 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.button key={i}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setSelected(i)}
                        className="focus:outline-none">
                        <Star size={36}
                          className={`transition-all ${i <= (hovered || selected) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                      </motion.button>
                    ))}
                  </div>

                  {/* Label */}
                  <p className="text-center text-sm font-bold text-slate-700 mb-4 h-5">
                    {STAR_LABELS[hovered || selected] || 'Tap to rate'}
                  </p>

                  {/* Review text */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Comment (optional)</label>
                    <textarea value={review} onChange={e => setReview(e.target.value)} rows={3}
                      placeholder="Tell us about the contractor's work quality..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 resize-none" />
                  </div>

                  {/* Quick tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Good work', 'On time', 'Delayed', 'Poor quality', 'Professional', 'Needs improvement'].map(tag => (
                      <button key={tag} onClick={() => setReview(prev => prev ? `${prev}, ${tag}` : tag)}
                        className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium hover:bg-yellow-50 hover:text-yellow-700 transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>

                  <button onClick={handleSubmit} disabled={!selected || submitting}
                    className="w-full py-4 bg-yellow-400 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-yellow-500 transition-colors">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}