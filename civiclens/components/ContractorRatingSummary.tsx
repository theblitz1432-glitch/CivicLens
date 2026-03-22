'use client'
import { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Users } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Rating {
  _id: string;
  stars: number;
  review: string;
  citizenId: { name: string };
  complaintId: { category: string };
  createdAt: string;
}

export default function ContractorRatingSummary({ contractorId }: { contractorId?: string }) {
  const [data, setData] = useState<{ average: number; total: number; ratings: Rating[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('civiclens_token');
    const url = contractorId
      ? `${API}/ratings/contractor/${contractorId}`
      : `${API}/ratings/all`;
    fetch(url, { headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } })
      .then(r => r.json()).then(d => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contractorId]);

  if (loading) return <div className="bg-white rounded-[28px] border border-slate-200 p-5 animate-pulse h-32" />;
  if (!data || data.total === 0) return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-5 text-center">
      <Star size={28} className="text-slate-300 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">No ratings yet</p>
    </div>
  );

  const starCounts = [1,2,3,4,5].map(s => data.ratings.filter(r => r.stars === s).length);
  const avgColor = data.average >= 4 ? 'text-green-600' : data.average >= 3 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">⭐ Contractor Ratings</h3>

        {/* Average Score */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <p className={`text-5xl font-bold ${avgColor}`}>{data.average.toFixed(1)}</p>
            <div className="flex justify-center gap-0.5 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} className={i <= Math.round(data.average) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{data.total} review{data.total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5,4,3,2,1].map(s => {
              const count = starCounts[s - 1];
              const pct = data.total > 0 ? (count / data.total) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 w-3">{s}</span>
                  <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-400 w-5">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Tag */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${data.average >= 4 ? 'bg-green-50 text-green-700' : data.average >= 3 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
          {data.average >= 4 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
          {data.average >= 4.5 ? 'Excellent Contractor ⭐' : data.average >= 4 ? 'Good Contractor 👍' : data.average >= 3 ? 'Average Performance' : 'Needs Improvement ⚠️'}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="divide-y divide-slate-50">
        {data.ratings.slice(0, 5).map(r => (
          <div key={r._id} className="p-4">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-bold text-slate-900">{r.citizenId?.name || 'Citizen'}</p>
                <p className="text-[10px] text-slate-400">{r.complaintId?.category} • {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={12} className={i <= r.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} />
                ))}
              </div>
            </div>
            {r.review && <p className="text-xs text-slate-600 mt-1 italic">"{r.review}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}