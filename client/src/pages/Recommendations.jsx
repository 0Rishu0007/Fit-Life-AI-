import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchRecommendations(); }, []);

  const fetchRecommendations = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/ai/recommendations');
      setData(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'AI service unavailable';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const getPriorityColor = (p) => ({ high:'border-red-500/40 bg-red-500/5', medium:'border-amber-500/40 bg-amber-500/5', low:'border-green-500/40 bg-green-500/5' }[p] || 'border-gray-700 bg-gray-800/30');
  const getPriorityBadge = (p) => ({ high:'bg-red-500/20 text-red-400', medium:'bg-amber-500/20 text-amber-400', low:'bg-green-500/20 text-green-400' }[p] || 'bg-gray-700 text-gray-400');

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /><p className="text-gray-400">Analyzing your fitness data...</p></div></div>;

  if (error) return (
    <div className="space-y-6">
      <div className="animate-fade-in-up"><h1 className="page-title">AI Insights</h1><p className="text-gray-500 mt-1">Personalized recommendations</p></div>
      <div className="glass-card p-8 text-center">
        <span className="text-5xl block mb-4">🤖</span>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">AI Service Unavailable</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}. Ensure the AI service is running on port 8000.</p>
        <button onClick={fetchRecommendations} className="btn-primary">Retry</button>
      </div>
    </div>
  );

  const { workout_suggestions=[], calorie_adjustments={}, progress_prediction={}, analytics={}, summary:s={} } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div><h1 className="page-title">AI Insights</h1><p className="text-gray-500 mt-1">Powered by machine learning</p></div>
        <button onClick={fetchRecommendations} className="btn-secondary">🔄 Refresh</button>
      </div>

      {/* Score Card */}
      {analytics.score !== undefined && (
        <div className="glass-card p-6 animate-fade-in-up animate-pulse-glow" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.05s' }}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="8" /><circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${analytics.score * 2.64} 264`} /></svg>
              <svg width="0" height="0"><defs><linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#10b981"/></linearGradient></defs></svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold gradient-text">{analytics.score}</span><span className="text-xs text-gray-500">/ 100</span></div>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-200">Fitness Score: <span className="gradient-text">{analytics.grade}</span></h2>
              <p className="text-gray-500 mt-1 text-sm">Based on workout consistency, nutrition adherence, and streak</p>
              <div className="flex flex-wrap gap-3 mt-3">
                {analytics.breakdown && Object.entries(analytics.breakdown).map(([k,v]) => (
                  <span key={k} className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">{k}: <span className="text-primary-400 font-semibold">{v}</span></span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.1s' }}>
        {[{ label:'Workout Freq', val:`${s.workout_frequency || 0}/wk`, color:'text-primary-400' },
          { label:'Avg Calories', val:`${s.avg_daily_calories || 0}`, color:'text-amber-400' },
          { label:'Avg Protein', val:`${s.avg_daily_protein || 0}g`, color:'text-blue-400' },
          { label:'Overall Grade', val: s.grade || '-', color:'text-accent-400' }].map(st => (
          <div key={st.label} className="stat-card"><p className="text-xs font-medium text-gray-500 uppercase">{st.label}</p><p className={`text-2xl font-bold ${st.color} mt-1`}>{st.val}</p></div>
        ))}
      </div>

      {/* Progress Prediction */}
      {progress_prediction.trend && (
        <div className="glass-card p-6 animate-fade-in-up" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.15s' }}>
          <h2 className="section-title">📈 Progress Prediction</h2>
          <p className="text-gray-300">{progress_prediction.message}</p>
          {progress_prediction.predicted_volume_change !== 0 && (
            <p className="text-sm text-gray-500 mt-2">Projected weekly change: <span className={progress_prediction.predicted_volume_change > 0 ? 'text-green-400' : 'text-red-400'}>{progress_prediction.predicted_volume_change > 0 ? '+' : ''}{progress_prediction.predicted_volume_change} kg volume</span></p>
          )}
        </div>
      )}

      {/* Workout Suggestions */}
      {workout_suggestions.length > 0 && (
        <div className="space-y-3 animate-fade-in-up" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.2s' }}>
          <h2 className="section-title">🏋️ Workout Suggestions</h2>
          {workout_suggestions.map((s,i) => (
            <div key={i} className={`glass-card p-5 border-l-4 ${getPriorityColor(s.priority)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl flex-shrink-0">{s.icon}</span>
                  <div><h3 className="font-semibold text-gray-200">{s.title}</h3><p className="text-sm text-gray-400 mt-1">{s.message}</p></div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getPriorityBadge(s.priority)}`}>{s.priority}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calorie Adjustments */}
      {calorie_adjustments.recommendations?.length > 0 && (
        <div className="space-y-3 animate-fade-in-up" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.25s' }}>
          <h2 className="section-title">🍽️ Nutrition Adjustments</h2>
          {calorie_adjustments.recommendations.map((r,i) => (
            <div key={i} className={`glass-card p-5 border-l-4 ${getPriorityColor(r.priority)}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{r.icon}</span>
                <div><h3 className="font-semibold text-gray-200">{r.title}</h3><p className="text-sm text-gray-400 mt-1">{r.message}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
