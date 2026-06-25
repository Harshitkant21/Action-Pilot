import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Calendar, Target, Loader2, FileText, ArrowLeft } from 'lucide-react';

const GoalCreate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [time, setTime] = useState('12:00'); // default to noon
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Merge date and time into ISO string
      const isoDeadline = new Date(`${deadline}T${time}:00`).toISOString();

      const response = await api.post('/goals', {
        title,
        description,
        deadline: isoDeadline,
      });

      if (response.data.success && response.data.goalId) {
        navigate(`/goals/${response.data.goalId}`);
      } else {
        setError(response.data.message || 'Failed to create goal');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-12">
      <Navbar />

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-bg/85 backdrop-blur-md p-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-dark-accent/20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-dark-accent animate-spin relative" />
          </div>
          <div className="text-center max-w-md space-y-3">
            <h3 className="text-xl font-bold text-white font-outfit tracking-wide animate-pulse">
              AI Agent is planning your path...
            </h3>
            <p className="text-sm text-dark-muted leading-relaxed">
              Gemini is assessing your objective, estimating effort, identifying risk factors, and drafting an execution roadmap.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-dark-muted hover:text-dark-accent mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-border/40">
            <div className="bg-dark-accent/10 p-2.5 rounded-lg border border-dark-accent/20">
              <Target className="w-6 h-6 text-dark-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-outfit">Define Goal Objective</h2>
              <p className="text-dark-muted text-xs font-sans">
                Set deadlines, details, and initial criteria for tracking.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-dark-accent" />
                Goal Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Build Hackathon Project MVP"
                className="glass-input"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-dark-accent" />
                Detailed Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Detail the target outcomes, milestones, core tasks, and success metrics for this objective..."
                className="glass-input resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-dark-accent" />
                  Target Deadline Date
                </label>
                <input
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="glass-input [color-scheme:dark]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase flex items-center gap-1.5">
                  Target Deadline Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="glass-input [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="border-t border-dark-border/40 pt-6 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing & Creating...
                  </>
                ) : (
                  <>
                    Create Goal
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default GoalCreate;
