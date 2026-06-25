import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Calendar, Target, ChevronRight, AlertCircle, Clock, Sparkles } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  complexity: string | null;
  estimatedEffortHours: number | null;
  riskScore: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: goals, isLoading, error } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/goals');
      return response.data.data;
    },
  });

  const getStatusBadge = (status: string) => {
    const base = 'px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ';
    switch (status) {
      case 'ACTIVE':
        return base + 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'COMPLETED':
        return base + 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'AT_RISK':
        return base + 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'DELAYED':
        return base + 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return base + 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Banner Section */}
        <div className="glass-panel p-8 mb-10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-dark-accent/5 rounded-full blur-[80px]"></div>
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 font-outfit">Execution Companion</h1>
            <p className="text-dark-muted font-sans text-sm max-w-xl">
              Track intention to completion. Manage goals, record execution check-ins, detect risks early, and recover before missing deadlines.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate('/goals/new')}
              className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-md hover:scale-105 transition"
            >
              <Target className="w-5 h-5" />
              Define New Goal
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 font-outfit flex items-center gap-2">
            <Target className="w-6 h-6 text-dark-accent" />
            Active Execution Goals
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="glass-panel p-6 h-48 animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-6 w-2/3 bg-dark-border/40 rounded"></div>
                    <div className="h-4 w-5/6 bg-dark-border/40 rounded"></div>
                  </div>
                  <div className="h-6 w-1/3 bg-dark-border/40 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel p-8 text-center text-red-400 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p>Failed to retrieve goals. Please verify your connection or try again.</p>
            </div>
          ) : !goals || goals.length === 0 ? (
            <div className="glass-panel p-12 text-center max-w-2xl mx-auto mt-6">
              <Sparkles className="w-16 h-16 text-dark-accent/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2 font-outfit">No active goals yet</h3>
              <p className="text-dark-muted text-sm mb-6 max-w-sm mx-auto">
                Setting goals is the first step of intention. Define a goal and get started on execution monitoring.
              </p>
              <button
                onClick={() => navigate('/goals/new')}
                className="btn-primary"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                  className="glass-panel p-6 hover:border-dark-accent/40 transition duration-300 group cursor-pointer flex flex-col justify-between hover:translate-y-[-2px]"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-dark-accent transition font-outfit">
                        {goal.title}
                      </h3>
                      <span className={getStatusBadge(goal.status)}>{goal.status}</span>
                    </div>

                    <p className="text-dark-muted text-sm line-clamp-2 mb-4">
                      {goal.description}
                    </p>
                  </div>

                  <div className="border-t border-dark-border/30 pt-4 flex items-center justify-between text-xs text-dark-muted">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-dark-accent" />
                        {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                      {goal.estimatedEffortHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-dark-accent" />
                          {goal.estimatedEffortHours} hrs
                        </span>
                      )}
                    </div>
                    <span className="text-dark-accent group-hover:translate-x-1 transition duration-200 flex items-center gap-0.5">
                      View details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
