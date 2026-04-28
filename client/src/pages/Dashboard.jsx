import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [dietSummary, setDietSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [workoutRes, dietRes] = await Promise.all([
        api.get('/workouts?startDate=' + getDateDaysAgo(30)),
        api.get('/diet/summary?days=14'),
      ]);
      setWorkouts(workoutRes.data.data || []);
      setDietSummary(dietRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getDateDaysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // ─── Compute Chart Data ───
  const getCalorieChartData = () => {
    return dietSummary
      .slice(0, 14)
      .reverse()
      .map((d) => ({
        date: d._id?.slice(5) || 'N/A',
        calories: d.totalCalories,
        protein: d.totalProtein,
        target: user?.goals?.dailyCalories || 2000,
      }));
  };

  const getStrengthChartData = () => {
    const byDate = {};
    workouts.forEach((w) => {
      const date = new Date(w.date).toISOString().split('T')[0].slice(5);
      if (!byDate[date]) byDate[date] = 0;
      byDate[date] += w.sets * w.reps * w.weight;
    });
    return Object.entries(byDate)
      .slice(-14)
      .map(([date, volume]) => ({ date, volume: Math.round(volume) }));
  };

  const getExerciseDistribution = () => {
    const counts = {};
    workouts.forEach((w) => {
      counts[w.exercise] = (counts[w.exercise] || 0) + 1;
    });
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name,
        value,
        color: COLORS[i % COLORS.length],
      }));
  };

  const getWeeklyWorkoutCount = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const uniqueDays = new Set();
    workouts.forEach((w) => {
      if (new Date(w.date) >= sevenDaysAgo) {
        uniqueDays.add(new Date(w.date).toISOString().split('T')[0]);
      }
    });
    return uniqueDays.size;
  };

  const getTodayCalories = () => {
    const today = dietSummary.find(
      (d) => d._id === new Date().toISOString().split('T')[0]
    );
    return today?.totalCalories || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const calorieData = getCalorieChartData();
  const strengthData = getStrengthChartData();
  const exerciseDist = getExerciseDistribution();
  const weeklyCount = getWeeklyWorkoutCount();
  const todayCal = getTodayCalories();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, <span className="text-gray-300">{user?.name}</span>! Here's your fitness overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '0.1s' }}>
        <div className="stat-card animate-pulse-glow">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Streak</p>
          <p className="text-3xl font-bold text-primary-400 mt-1">
            {user?.streak?.current || 0}
            <span className="text-lg text-gray-500 ml-1">days</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">Longest: {user?.streak?.longest || 0} days 🔥</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Workouts</p>
          <p className="text-3xl font-bold text-accent-400 mt-1">
            {weeklyCount}
            <span className="text-lg text-gray-500 ml-1">/ {user?.goals?.weeklyWorkouts || 4}</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">This week</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Calories</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">
            {todayCal}
            <span className="text-lg text-gray-500 ml-1">kcal</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">Target: {user?.goals?.dailyCalories || 2000} kcal</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Exercises</p>
          <p className="text-3xl font-bold text-purple-400 mt-1">
            {workouts.length}
          </p>
          <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '0.2s' }}>
        {/* Calorie Trend */}
        <div className="glass-card p-6">
          <h2 className="section-title">Calorie Trend</h2>
          {calorieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={calorieData}>
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1e1e2e',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#calGrad)"
                  name="Calories"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  fill="none"
                  name="Target"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-600">
              <p>Log meals to see calorie trends 🍽️</p>
            </div>
          )}
        </div>

        {/* Strength Trend */}
        <div className="glass-card p-6">
          <h2 className="section-title">Strength Volume</h2>
          {strengthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={strengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1e1e2e',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="volume" fill="#10b981" radius={[6, 6, 0, 0]} name="Volume (kg)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-600">
              <p>Log workouts to see strength trends 🏋️</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '0.3s' }}>
        {/* Exercise Distribution */}
        <div className="glass-card p-6">
          <h2 className="section-title">Exercise Split</h2>
          {exerciseDist.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={exerciseDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {exerciseDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e1e2e',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {exerciseDist.map((e) => (
                  <span
                    key={e.name}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: e.color + '20', color: e.color }}
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-600">
              <p>No workout data yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/workouts"
              className="p-4 rounded-xl bg-primary-600/10 border border-primary-500/20 hover:border-primary-500/40 transition-all group"
            >
              <span className="text-2xl">🏋️</span>
              <p className="text-sm font-medium text-gray-200 mt-2 group-hover:text-primary-300 transition-colors">
                Log Workout
              </p>
              <p className="text-xs text-gray-500 mt-1">Track your exercises</p>
            </Link>
            <Link
              to="/diet"
              className="p-4 rounded-xl bg-accent-600/10 border border-accent-500/20 hover:border-accent-500/40 transition-all group"
            >
              <span className="text-2xl">🍽️</span>
              <p className="text-sm font-medium text-gray-200 mt-2 group-hover:text-accent-300 transition-colors">
                Log Meal
              </p>
              <p className="text-xs text-gray-500 mt-1">Track nutrition</p>
            </Link>
            <Link
              to="/recommendations"
              className="p-4 rounded-xl bg-purple-600/10 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
            >
              <span className="text-2xl">🤖</span>
              <p className="text-sm font-medium text-gray-200 mt-2 group-hover:text-purple-300 transition-colors">
                AI Insights
              </p>
              <p className="text-xs text-gray-500 mt-1">Get recommendations</p>
            </Link>
            <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/20">
              <span className="text-2xl">🎯</span>
              <p className="text-sm font-medium text-gray-200 mt-2">Goals</p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.goals?.dailyCalories} cal · {user?.goals?.dailyProtein}g protein
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="glass-card p-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Recent Workouts</h2>
          <Link to="/workouts" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            View all →
          </Link>
        </div>
        {workouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Exercise</th>
                  <th className="text-center py-3 px-2 text-gray-500 font-medium">Sets</th>
                  <th className="text-center py-3 px-2 text-gray-500 font-medium">Reps</th>
                  <th className="text-center py-3 px-2 text-gray-500 font-medium">Weight</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {workouts.slice(0, 5).map((w) => (
                  <tr key={w._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-200">{w.exercise}</td>
                    <td className="py-3 px-2 text-center text-gray-400">{w.sets}</td>
                    <td className="py-3 px-2 text-center text-gray-400">{w.reps}</td>
                    <td className="py-3 px-2 text-center text-accent-400 font-medium">{w.weight} kg</td>
                    <td className="py-3 px-2 text-right text-gray-500">
                      {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No workouts yet. Start logging! 💪</p>
        )}
      </div>
    </div>
  );
}
