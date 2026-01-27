import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimUrgeTask, fetchUrgeTask, startUrgeTask } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { AppContext } from '../App.jsx';

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function UrgeTasksPage() {
  const navigate = useNavigate();
  const { refetchData } = useContext(AppContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(Date.now());

  const loadTask = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUrgeTask();
      setTask(data);
    } catch (err) {
      setError(err.message || 'Failed to load task.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, []);

  useEffect(() => {
    if (!task?.started_at || task?.claimed_at) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [task?.started_at, task?.claimed_at]);

  const endTime = useMemo(() => {
    if (!task?.started_at) return null;
    return new Date(task.started_at).getTime() + task.duration_minutes * 60 * 1000;
  }, [task]);

  const timeLeft = endTime ? Math.max(0, endTime - now) : 0;
  const isComplete = task?.is_complete || (endTime ? now >= endTime : false);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const data = await startUrgeTask();
      setTask(data);
      setNow(Date.now());
    } catch (err) {
      setError(err.message || 'Failed to start task.');
    } finally {
      setStarting(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setError('');
    try {
      await claimUrgeTask();
      await refetchData();
      await loadTask();
    } catch (err) {
      setError(err.message || 'Failed to claim reward.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <section className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-200 mb-4">
        ← Back to journey
      </button>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white">Urge Tasks</h1>
        <p className="text-gray-400 mt-2">Complete tasks to earn rewards and push your streak forward.</p>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {task && (
          <div className="mt-6 p-4 rounded-xl border border-gray-700 bg-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{task.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Reward: <span className="text-yellow-400 font-semibold">+{task.reward_coins} Coins</span> and <span className="text-cyan-400 font-semibold">+{task.reward_hours} hour</span>
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-gray-500">30 min</span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-300">
                {task.started_at ? (
                  task.claimed_at ? 'Reward claimed.' : (
                    isComplete ? 'Timer complete. Collect your reward.' : `Time left: ${formatTime(timeLeft)}`
                  )
                ) : 'Not started yet.'}
              </div>
              {!task.started_at && (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-md disabled:bg-gray-600"
                >
                  {starting ? 'Starting...' : 'Start'}
                </button>
              )}
              {task.started_at && !task.claimed_at && (
                <button
                  onClick={handleClaim}
                  disabled={!isComplete || claiming}
                  className={`px-4 py-2 rounded-md font-semibold ${isComplete ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                >
                  {claiming ? 'Collecting...' : 'Collect reward'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default UrgeTasksPage;
