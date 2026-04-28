import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await api.get('/workouts');
      setWorkouts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      exercise: '',
      sets: '',
      reps: '',
      weight: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/workouts/${editingId}`, form);
        toast.success('Workout updated!');
      } else {
        await api.post('/workouts', form);
        toast.success('Workout logged! 💪');
      }
      resetForm();
      fetchWorkouts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save workout');
    }
  };

  const handleEdit = (workout) => {
    setForm({
      exercise: workout.exercise,
      sets: workout.sets,
      reps: workout.reps,
      weight: workout.weight,
      date: new Date(workout.date).toISOString().split('T')[0],
      notes: workout.notes || '',
    });
    setEditingId(workout._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/${id}`);
      toast.success('Workout deleted');
      fetchWorkouts();
    } catch (err) {
      toast.error('Failed to delete workout');
    }
  };

  const quickExercises = [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
    'Barbell Row', 'Pull-ups', 'Lunges', 'Dumbbell Curl',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="page-title">Workouts</h1>
          <p className="text-gray-500 mt-1">Track your exercises and progression</p>
        </div>
        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? 'Cancel' : '+ Log Workout'}
        </button>
      </div>

      {/* Workout Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in-up">
          <h2 className="section-title">{editingId ? 'Edit Workout' : 'New Workout'}</h2>

          {/* Quick exercise buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickExercises.map((ex) => (
              <button
                key={ex}
                onClick={() => setForm({ ...form, exercise: ex })}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  form.exercise === ex
                    ? 'bg-primary-600/30 text-primary-300 border border-primary-500/40'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Exercise</label>
              <input
                type="text"
                value={form.exercise}
                onChange={(e) => setForm({ ...form, exercise: e.target.value })}
                className="input-field"
                placeholder="e.g., Bench Press"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Sets</label>
              <input
                type="number"
                value={form.sets}
                onChange={(e) => setForm({ ...form, sets: e.target.value })}
                className="input-field"
                placeholder="4"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Reps</label>
              <input
                type="number"
                value={form.reps}
                onChange={(e) => setForm({ ...form, reps: e.target.value })}
                className="input-field"
                placeholder="8"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="input-field"
                placeholder="80"
                min="0"
                step="0.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input-field"
                placeholder="Optional notes..."
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Save'} Workout
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Workouts List */}
      <div className="glass-card overflow-hidden animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '0.1s' }}>
        {workouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/40 border-b border-gray-800">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Exercise</th>
                  <th className="text-center py-4 px-3 text-gray-400 font-semibold">Sets</th>
                  <th className="text-center py-4 px-3 text-gray-400 font-semibold">Reps</th>
                  <th className="text-center py-4 px-3 text-gray-400 font-semibold">Weight</th>
                  <th className="text-center py-4 px-3 text-gray-400 font-semibold hidden sm:table-cell">Volume</th>
                  <th className="text-center py-4 px-3 text-gray-400 font-semibold">Date</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((w) => (
                  <tr
                    key={w._id}
                    className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-200">{w.exercise}</span>
                      {w.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{w.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-300">{w.sets}</td>
                    <td className="py-3 px-3 text-center text-gray-300">{w.reps}</td>
                    <td className="py-3 px-3 text-center text-accent-400 font-semibold">{w.weight} kg</td>
                    <td className="py-3 px-3 text-center text-gray-400 hidden sm:table-cell">
                      {(w.sets * w.reps * w.weight).toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3 text-center text-gray-500">
                      {new Date(w.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(w)}
                          className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(w._id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl">🏋️</span>
            <p className="text-gray-400 mt-4 font-medium">No workouts logged yet</p>
            <p className="text-gray-600 text-sm mt-1">Click "Log Workout" to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
