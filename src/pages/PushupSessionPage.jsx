import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cancelUrgeTask, endUrgeSession, startUrgeTask } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';

const TASK_ID = 'pushup_45';

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

function PushupSessionPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading');
  const [batch, setBatch] = useState(1);
  const [countdown, setCountdown] = useState(10);
  const [timer, setTimer] = useState(0);
  const [breakTimer, setBreakTimer] = useState(30);
  const [extraRest, setExtraRest] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const start = async () => {
      try {
        await startUrgeTask(TASK_ID);
        setPhase('countdown');
      } catch {
        setPhase('error');
      }
    };
    start();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasEnded) return;
      navigator.sendBeacon?.('/api/urge', JSON.stringify({ action: 'cancel', taskId: TASK_ID }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasEnded]);

  useEffect(() => {
    return () => {
      if (hasEnded) return;
      fetch('/api/urge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', taskId: TASK_ID }),
        keepalive: true
      }).catch(() => {});
    };
  }, [hasEnded]);

  useEffect(() => {
    if (!['countdown', 'exercise', 'break', 'rest-extra', 'post', 'continue'].includes(phase)) return;
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'countdown') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase('exercise');
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    if (phase === 'break') {
      const interval = setInterval(() => {
        setBreakTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase('rest-extra');
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    if (phase === 'rest-extra') {
      const interval = setInterval(() => {
        setExtraRest((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    if (phase === 'continue') {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [phase]);

  const handleCompletedBatch = () => {
    setPhase('break');
  };

  const handleRestDone = () => {
    if (batch >= 3) {
      setPhase('post');
      return;
    }
    setBatch((prev) => prev + 1);
    setExtraRest(0);
    setPhase('countdown');
  };

  const endSession = async () => {
    setEnding(true);
    try {
      await endUrgeSession(TASK_ID);
      setHasEnded(true);
    } finally {
      navigate('/journey/urge');
    }
  };

  const cancelSession = async () => {
    setEnding(true);
    try {
      await cancelUrgeTask(TASK_ID);
      setHasEnded(true);
    } finally {
      navigate('/journey/urge');
    }
  };

  const header = useMemo(() => `Batch ${batch} of 3`, [batch]);

  if (phase === 'loading') return <LoadingSpinner />;
  if (phase === 'error') {
    return (
      <section className="max-w-xl mx-auto text-center">
        <p className="text-red-400">Failed to start session.</p>
        <button onClick={() => navigate('/journey/urge')} className="mt-4 text-yellow-400">Back</button>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto text-center">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white">Pushup Session</h1>
        <p className="text-sm text-gray-400 mt-2">{header}</p>
        <button
          onClick={() => setShowEndConfirm(true)}
          className="mt-4 text-sm text-red-400 hover:text-red-300"
        >
          End session now
        </button>

        {phase === 'countdown' && (
          <div className="mt-8">
            <p className="text-gray-300 mb-4">Get ready to start your set of 15.</p>
            <div className="text-5xl font-bold text-yellow-400">{countdown}</div>
          </div>
        )}

        {phase === 'exercise' && (
          <div className="mt-8">
            <p className="text-gray-300 mb-4">Do 15 pushups.</p>
            <button
              onClick={handleCompletedBatch}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-md"
            >
              I have completed
            </button>
          </div>
        )}

        {phase === 'break' && (
          <div className="mt-8">
            <p className="text-gray-300 mb-2">Initial recovery timer (30 seconds).</p>
            <div className="text-4xl font-bold text-cyan-400">{formatTimer(breakTimer)}</div>
          </div>
        )}

        {phase === 'rest-extra' && (
          <div className="mt-8">
            <p className="text-gray-300">Extra rest time.</p>
            <div className="text-3xl font-bold text-cyan-300 mt-2">{formatTimer(extraRest)}</div>
            <p className="text-sm text-gray-500 mt-2">Recommended total break: ~1 minute.</p>
            <button
              onClick={handleRestDone}
              className="mt-6 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-md"
            >
              I have completed
            </button>
          </div>
        )}

        {phase === 'post' && (
          <div className="mt-8">
            <p className="text-gray-300">All 3 batches complete.</p>
            <p className="text-sm text-gray-500 mt-2">Choose to end or continue training.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={endSession}
                disabled={ending}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-md"
              >
                End session
              </button>
              <button
                onClick={() => setPhase('continue')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-md"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {phase === 'continue' && (
          <div className="mt-8">
            <p className="text-gray-300">Keep going! This time counts too.</p>
            <div className="text-4xl font-bold text-yellow-300 mt-2">{formatTimer(timer)}</div>
            <button
              onClick={endSession}
              disabled={ending}
              className="mt-6 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-md"
            >
              End session
            </button>
          </div>
        )}
      </div>
      <div className="mt-6 text-sm text-gray-500">Session time: {formatTimer(sessionSeconds)}</div>

      <Modal isOpen={showEndConfirm} onClose={() => setShowEndConfirm(false)} title="End Session">
        <div className="text-center">
          <p className="mb-6">If you end this now you will lose 200 coins.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setShowEndConfirm(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
              Keep going
            </button>
            <button onClick={cancelSession} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg">
              End now
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

export default PushupSessionPage;
