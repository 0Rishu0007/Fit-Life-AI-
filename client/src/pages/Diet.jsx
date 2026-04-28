import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Diet() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ meal:'', calories:'', protein:'', carbs:'', fats:'', date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [eRes, sRes] = await Promise.all([api.get('/diet'), api.get('/diet/summary?days=7')]);
      setEntries(eRes.data.data || []);
      setSummary(sRes.data.data || []);
    } catch { toast.error('Failed to load diet data'); } finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ meal:'', calories:'', protein:'', carbs:'', fats:'', date: new Date().toISOString().split('T')[0] }); setEditingId(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) { await api.put(`/diet/${editingId}`, form); toast.success('Meal updated!'); }
      else { await api.post('/diet', form); toast.success('Meal logged! 🍽️'); }
      resetForm(); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save meal'); }
  };

  const handleEdit = (entry) => { setForm({ meal: entry.meal, calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fats: entry.fats, date: new Date(entry.date).toISOString().split('T')[0] }); setEditingId(entry._id); setShowForm(true); };
  const handleDelete = async (id) => { if (!window.confirm('Delete this meal?')) return; try { await api.delete(`/diet/${id}`); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed'); } };

  const quickMeals = [
    { name:'Oatmeal', cal:380, p:12, c:60, f:8 }, { name:'Chicken Salad', cal:450, p:40, c:20, f:18 },
    { name:'Protein Shake', cal:250, p:30, c:15, f:5 }, { name:'Salmon & Rice', cal:620, p:45, c:50, f:22 },
  ];

  const chartData = summary.slice(0,7).reverse().map(d => ({ date: d._id?.slice(5)||'', calories: d.totalCalories, protein: d.totalProtein }));
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => new Date(e.date).toISOString().split('T')[0] === todayStr);
  const totals = todayEntries.reduce((a,e) => ({ calories:a.calories+e.calories, protein:a.protein+e.protein, carbs:a.carbs+e.carbs, fats:a.fats+e.fats }), { calories:0, protein:0, carbs:0, fats:0 });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div><h1 className="page-title">Diet Tracker</h1><p className="text-gray-500 mt-1">Log meals and track nutrition</p></div>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)} className={showForm ? 'btn-secondary' : 'btn-primary'}>{showForm ? 'Cancel' : '+ Log Meal'}</button>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.05s' }}>
        {[{ label:'Calories', val:totals.calories, color:'text-amber-400', goal:user?.goals?.dailyCalories||2000, unit:'kcal' },
          { label:'Protein', val:totals.protein+'g', color:'text-blue-400', goal:user?.goals?.dailyProtein||150, unit:'g' },
          { label:'Carbs', val:totals.carbs+'g', color:'text-green-400' },
          { label:'Fats', val:totals.fats+'g', color:'text-red-400' }].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-xs font-medium text-gray-500 uppercase">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.val}</p>
            {s.goal && <p className="text-xs text-gray-600 mt-1">/ {s.goal} {s.unit}</p>}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-fade-in-up">
          <h2 className="section-title">{editingId ? 'Edit Meal' : 'Log a Meal'}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {quickMeals.map(m => <button key={m.name} onClick={() => setForm({...form, meal:m.name, calories:m.cal, protein:m.p, carbs:m.c, fats:m.f})} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-accent-500/40 hover:text-accent-300 transition-all">{m.name}</button>)}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[{ l:'Meal', k:'meal', ph:'Grilled Chicken', t:'text', req:true },{ l:'Calories', k:'calories', ph:'450', t:'number', req:true },{ l:'Protein (g)', k:'protein', ph:'40', t:'number', req:true },{ l:'Carbs (g)', k:'carbs', ph:'20', t:'number', req:true },{ l:'Fats (g)', k:'fats', ph:'18', t:'number', req:true },{ l:'Date', k:'date', t:'date' }].map(f => (
              <div key={f.k}><label className="block text-sm font-medium text-gray-400 mb-1.5">{f.l}</label><input type={f.t} value={form[f.k]} onChange={e => setForm({...form, [f.k]:e.target.value})} className="input-field" placeholder={f.ph} required={f.req} min={f.t==='number'?'0':undefined} /></div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editingId?'Update':'Save'} Meal</button>
              {editingId && <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="glass-card p-6 animate-fade-in-up" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.15s' }}>
          <h2 className="section-title">Weekly Calorie Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#333" /><XAxis dataKey="date" tick={{ fill:'#9ca3af', fontSize:12 }} /><YAxis tick={{ fill:'#9ca3af', fontSize:12 }} /><Tooltip contentStyle={{ background:'#1e1e2e', border:'1px solid #374151', borderRadius:'12px' }} /><Bar dataKey="calories" fill="#f59e0b" radius={[6,6,0,0]} name="Calories" /><Bar dataKey="protein" fill="#6366f1" radius={[6,6,0,0]} name="Protein (g)" /></BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card overflow-hidden animate-fade-in-up" style={{ opacity:0, animationFillMode:'forwards', animationDelay:'0.2s' }}>
        {entries.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-800/40 border-b border-gray-800">
            {['Meal','Cal','Protein','Carbs','Fats','Date','Actions'].map(h => <th key={h} className={`py-3 px-3 text-gray-400 font-semibold ${h==='Meal'?'text-left px-4':h==='Actions'?'text-right px-4':'text-center'} ${['Carbs','Fats'].includes(h)?'hidden sm:table-cell':''}`}>{h}</th>)}
          </tr></thead><tbody>{entries.map(e => (
            <tr key={e._id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-200">{e.meal}</td>
              <td className="py-3 px-3 text-center text-amber-400 font-semibold">{e.calories}</td>
              <td className="py-3 px-3 text-center text-blue-400">{e.protein}g</td>
              <td className="py-3 px-3 text-center text-green-400 hidden sm:table-cell">{e.carbs}g</td>
              <td className="py-3 px-3 text-center text-red-400 hidden sm:table-cell">{e.fats}g</td>
              <td className="py-3 px-3 text-center text-gray-500">{new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
              <td className="py-3 px-4 text-right"><button onClick={() => handleEdit(e)} className="text-xs text-primary-400 hover:text-primary-300 mr-2">Edit</button><button onClick={() => handleDelete(e._id)} className="text-xs text-red-400 hover:text-red-300">Delete</button></td>
            </tr>
          ))}</tbody></table></div>
        ) : (
          <div className="text-center py-16"><span className="text-5xl">🍽️</span><p className="text-gray-400 mt-4 font-medium">No meals logged yet</p></div>
        )}
      </div>
    </div>
  );
}
