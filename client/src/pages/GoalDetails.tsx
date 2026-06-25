import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Calendar, Clock, CheckCircle2, Circle, AlertTriangle, 
  PlusCircle, ArrowLeft, Loader2, Award, ShieldAlert, Activity, CheckCircle
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  estimatedHours: number | null;
}

interface ProgressLog {
  id: string;
  updateText: string;
  progressPercentage: number;
  executionStatus: string;
  blockerDescription: string | null;
  estimatedHoursRemaining: number | null;
  confidenceScore: number | null;
  createdAt: string;
}

interface AgentReport {
  id: string;
  goalId: string;
  agentType: 'GOAL_ANALYZER' | 'PLANNER' | 'RISK' | 'STANDUP' | 'RECOVERY';
  summary: string;
  metadata: any;
  createdAt: string;
}

interface GoalDetails {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  complexity: string | null;
  estimatedEffortHours: number | null;
  riskScore: number;
  tasks: Task[];
  progressLogs: ProgressLog[];
  agentReports: AgentReport[];
}

const GoalDetails: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [standupLoading, setStandupLoading] = useState(false);
  const [standupError, setStandupError] = useState<string | null>(null);

  // Form states for Check-In
  const [updateText, setUpdateText] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(50);
  const [executionStatus, setExecutionStatus] = useState('ON_TRACK');
  const [blockerDescription, setBlockerDescription] = useState('');
  const [estimatedHoursRemaining, setEstimatedHoursRemaining] = useState<number>(5);
  const [confidenceScore, setConfidenceScore] = useState<number>(4);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Fetch Goal with Tasks and Progress Logs
  const { data: goal, isLoading, error } = useQuery<GoalDetails>({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      const response = await api.get(`/goals/${goalId}`);
      return response.data.data;
    },
    enabled: !!goalId,
  });

  // Task Status Mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await api.patch(`/tasks/${taskId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    },
  });

  const handleTaskToggle = (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    toggleTaskMutation.mutate({ taskId: task.id, status: nextStatus });
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInError(null);

    if (executionStatus === 'BLOCKED' && !blockerDescription.trim()) {
      setCheckInError('Blocker description is required when status is Blocked');
      return;
    }

    setCheckInLoading(true);

    try {
      await api.post('/progress', {
        goalId,
        updateText,
        progressPercentage,
        executionStatus,
        blockerDescription: executionStatus === 'BLOCKED' ? blockerDescription : null,
        estimatedHoursRemaining: Number(estimatedHoursRemaining),
        confidenceScore: Number(confidenceScore),
      });

      // Clear Form and Close Modal
      setUpdateText('');
      setBlockerDescription('');
      setIsCheckInOpen(false);
      
      // Refresh Data
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    } catch (err: any) {
      setCheckInError(err.response?.data?.message || 'Failed to submit check-in');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleGenerateStandup = async () => {
    setStandupError(null);
    setStandupLoading(true);
    try {
      const response = await api.post('/ai/standup', { goalId });
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      } else {
        setStandupError(response.data.message || 'Failed to generate standup');
      }
    } catch (err: any) {
      setStandupError(err.response?.data?.message || 'Failed to communicate with AI');
    } finally {
      setStandupLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ';
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

  const getExecutionStatusBadge = (status: string) => {
    const base = 'px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider ';
    switch (status) {
      case 'ON_TRACK':
        return base + 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'BEHIND':
        return base + 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'BLOCKED':
        return base + 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default:
        return base + 'bg-gray-500/10 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-dark-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertTriangle className="w-12 h-12 text-rose-400" />
          <h2 className="text-xl font-bold">Goal details could not be retrieved</h2>
          <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const completedTasks = goal.tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressRatio = goal.tasks.length > 0 ? (completedTasks / goal.tasks.length) * 100 : 0;

  const analyzerReport = goal.agentReports?.find(
    (report) => report.agentType === 'GOAL_ANALYZER'
  );
  const aiMetadata = analyzerReport?.metadata
    ? (typeof analyzerReport.metadata === 'string'
        ? JSON.parse(analyzerReport.metadata)
        : analyzerReport.metadata)
    : null;

  const riskReport = goal.agentReports?.find(
    (report) => report.agentType === 'RISK'
  );
  const riskMetadata = riskReport?.metadata
    ? (typeof riskReport.metadata === 'string'
        ? JSON.parse(riskReport.metadata)
        : riskReport.metadata)
    : null;

  const standupReport = goal.agentReports?.find(
    (report) => report.agentType === 'STANDUP'
  );
  const standupMetadata = standupReport?.metadata
    ? (typeof standupReport.metadata === 'string'
        ? JSON.parse(standupReport.metadata)
        : standupReport.metadata)
    : null;

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-dark-muted hover:text-dark-accent mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Goal Detail Header */}
        <div className="glass-panel p-8 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className={getStatusBadge(goal.status)}>{goal.status}</span>
                {aiMetadata?.category && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-dark-accent/10 text-dark-accent border border-dark-accent/20 uppercase tracking-wider">
                    {aiMetadata.category}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-dark-muted">
                  <Calendar className="w-3.5 h-3.5 text-dark-accent" />
                  Deadline: {new Date(goal.deadline).toLocaleString()}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white font-outfit">{goal.title}</h1>
            </div>
            <div>
              <button
                onClick={() => setIsCheckInOpen(true)}
                className="btn-primary flex items-center gap-1.5 shadow-md hover:scale-105 transition"
              >
                <PlusCircle className="w-5 h-5" />
                Submit Check-in
              </button>
            </div>
          </div>
          <p className="text-dark-muted text-sm font-sans max-w-4xl">{goal.description}</p>
        </div>

        {/* Goal Analytics & Quick View */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-dark-muted font-semibold uppercase tracking-wider">Complexity</p>
              <h4 className="text-lg font-bold text-white mt-0.5">{goal.complexity || 'Medium'}</h4>
            </div>
          </div>

          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-dark-muted font-semibold uppercase tracking-wider">Estimated Effort</p>
              <h4 className="text-lg font-bold text-white mt-0.5">{goal.estimatedEffortHours || 0} Hours</h4>
            </div>
          </div>

          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-dark-muted font-semibold uppercase tracking-wider">Risk Assessment</p>
              <div className="flex justify-between items-center mt-1 gap-2 flex-wrap">
                <span className="text-xs text-dark-muted">Score: <strong className="text-white">{goal.riskScore}/100</strong></span>
                <span className="text-xs text-dark-muted">Prob: <strong className="text-emerald-400">{riskMetadata?.completionProbability !== undefined ? `${riskMetadata.completionProbability}%` : 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-dark-muted font-semibold uppercase tracking-wider mb-1">Checklist Progress</p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-dark-border/40 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-dark-accent h-full transition-all duration-300"
                    style={{ width: `${progressRatio}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  {completedTasks} / {goal.tasks.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Sections: Tasks & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tasks checklist panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-6 border-b border-dark-border/30 pb-3 font-outfit">
                Execution Tasks Checklist
              </h3>

              {goal.tasks.length === 0 ? (
                <p className="text-sm text-dark-muted text-center py-6">No tasks generated for this goal.</p>
              ) : (
                <div className="space-y-4">
                  {goal.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleTaskToggle(task)}
                      className={`p-4 rounded-lg border transition duration-200 cursor-pointer flex items-start gap-4 ${
                        task.status === 'COMPLETED' 
                          ? 'bg-dark-border/10 border-dark-border/30' 
                          : 'bg-dark-card/40 border-dark-border/40 hover:border-dark-accent/40'
                      }`}
                    >
                      <button className="mt-0.5 flex-shrink-0 text-dark-accent">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-5 h-5 fill-dark-accent/10" />
                        ) : (
                          <Circle className="w-5 h-5 text-dark-muted hover:text-dark-accent transition" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className={`text-sm font-semibold font-outfit transition ${
                            task.status === 'COMPLETED' ? 'line-through text-dark-muted' : 'text-white'
                          }`}>
                            {task.title}
                          </h4>
                          {task.priority && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              task.priority === 'HIGH' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : task.priority === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className={`text-xs mt-1 leading-relaxed ${
                            task.status === 'COMPLETED' ? 'text-dark-muted/60' : 'text-dark-muted'
                          }`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress Logs Feed */}
          <div className="space-y-6">
            {aiMetadata && (
              <div className="glass-panel p-6 border-dark-accent/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-dark-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <h3 className="text-lg font-bold text-white mb-4 border-b border-dark-border/30 pb-3 font-outfit flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dark-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-dark-accent"></span>
                  </span>
                  AI Coach Insights
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-dark-muted block mb-1">Focus Area</span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-dark-accent/10 text-dark-accent border border-dark-accent/10 inline-block">
                      {aiMetadata.category}
                    </span>
                  </div>

                  {aiMetadata.riskFactors && aiMetadata.riskFactors.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-dark-muted block mb-2">Potential Risk Factors</span>
                      <ul className="space-y-2">
                        {aiMetadata.riskFactors.map((risk: string, index: number) => (
                          <li key={index} className="text-xs text-rose-300 flex items-start gap-2 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {riskMetadata?.explanation && (
                    <div className="border-t border-dark-border/30 pt-3">
                      <span className="text-[10px] uppercase font-bold text-dark-muted block mb-2">Latest AI Risk Diagnosis</span>
                      <p className="text-xs text-amber-300 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg leading-relaxed">
                        {riskMetadata.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Standup Coach */}
            <div className="glass-panel p-6 border-dark-accent/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <h3 className="text-lg font-bold text-white mb-4 border-b border-dark-border/30 pb-3 font-outfit flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                AI Standup Coach
              </h3>

              {standupError && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs text-center">
                  {standupError}
                </div>
              )}

              {standupLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-dark-muted animate-pulse">Compiling daily standup status...</p>
                </div>
              ) : standupMetadata ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-lg">
                    <span className="text-xs text-dark-muted font-medium">Estimated Confidence</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">{standupMetadata.confidence}%</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-dark-muted block mb-1.5">Standup Summary</span>
                    <p className="text-xs text-white leading-relaxed whitespace-pre-line bg-dark-bg/40 p-3 rounded-lg border border-dark-border/20 font-sans">
                      {standupMetadata.summary}
                    </p>
                  </div>

                  {standupMetadata.recommendations && standupMetadata.recommendations.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-dark-muted block mb-2">Coach Recommendations</span>
                      <ul className="space-y-1.5">
                        {standupMetadata.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-xs text-indigo-300 flex items-start gap-1.5">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {standupMetadata.followUpQuestions && standupMetadata.followUpQuestions.length > 0 && (
                    <div className="bg-dark-border/10 border border-dark-border/30 p-3 rounded-lg space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block">Accountability Check</span>
                      {standupMetadata.followUpQuestions.map((q: string, i: number) => (
                        <p key={i} className="text-xs text-white italic leading-relaxed font-sans">
                          "{q}"
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateStandup}
                    className="w-full text-center text-xs text-dark-muted hover:text-indigo-400 border border-dark-border hover:border-indigo-500/30 py-2 rounded transition font-medium"
                  >
                    Regenerate Standup
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-dark-muted mb-4 leading-relaxed">
                    Generate an AI daily standup summarizing progress achievements, pending items, and accountability check-in questions.
                  </p>
                  <button
                    onClick={handleGenerateStandup}
                    className="btn-secondary w-full text-xs font-semibold py-2.5"
                  >
                    Generate Standup
                  </button>
                </div>
              )}
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-6 border-b border-dark-border/30 pb-3 font-outfit flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-dark-accent" />
                Check-in History
              </h3>

              {goal.progressLogs.length === 0 ? (
                <p className="text-sm text-dark-muted text-center py-6">No check-ins logged yet.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-dark-border/40">
                  {goal.progressLogs.map((log) => (
                    <div key={log.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <span className="absolute left-2.5 top-1.5 w-3 h-3 bg-dark-accent rounded-full ring-4 ring-dark-bg"></span>
                      
                      <div className="bg-dark-bg/60 border border-dark-border/40 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="text-[10px] text-dark-muted">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <span className={getExecutionStatusBadge(log.executionStatus)}>
                            {log.executionStatus}
                          </span>
                        </div>

                        <p className="text-xs text-white leading-relaxed">{log.updateText}</p>

                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-dark-border/30 pt-2 text-dark-muted font-mono">
                          <div>Prog: <span className="text-white">{log.progressPercentage}%</span></div>
                          <div>Conf: <span className="text-white">{log.confidenceScore || 0}/5</span></div>
                          {log.estimatedHoursRemaining !== null && (
                            <div className="col-span-2">Est. Hours Rem: <span className="text-white">{log.estimatedHoursRemaining} hrs</span></div>
                          )}
                        </div>

                        {log.blockerDescription && (
                          <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[10px]">
                            <strong>Blocker:</strong> {log.blockerDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Check-In Modal Overlay */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-8 my-8 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6 font-outfit border-b border-dark-border/30 pb-3">
              Log Progress Check-in
            </h3>

            {checkInError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">
                {checkInError}
              </div>
            )}

            <form onSubmit={handleCheckInSubmit} className="space-y-5">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">
                  Progress Update Description
                </label>
                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  required
                  rows={3}
                  placeholder="Detail the work completed, tasks tackled, or current status..."
                  className="glass-input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">
                    Execution Status
                  </label>
                  <select
                    value={executionStatus}
                    onChange={(e) => setExecutionStatus(e.target.value)}
                    className="glass-input [color-scheme:dark]"
                  >
                    <option value="ON_TRACK">On Track</option>
                    <option value="BEHIND">Behind Schedule</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">
                    Confidence Level (1-5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={confidenceScore}
                    onChange={(e) => setConfidenceScore(Number(e.target.value))}
                    required
                    className="glass-input"
                  />
                </div>
              </div>

              {executionStatus === 'BLOCKED' && (
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-rose-400 mb-2 tracking-wide uppercase">
                    Blocker Details
                  </label>
                  <textarea
                    value={blockerDescription}
                    onChange={(e) => setBlockerDescription(e.target.value)}
                    required
                    rows={2}
                    placeholder="Describe the blocker preventing progress..."
                    className="glass-input border-rose-500/40 focus:border-rose-400 focus:ring-rose-400/30 resize-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">
                    Goal Completion Progress (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progressPercentage}
                      onChange={(e) => setProgressPercentage(Number(e.target.value))}
                      className="w-full accent-dark-accent bg-dark-border"
                    />
                    <span className="text-sm font-bold text-white font-mono">{progressPercentage}%</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">
                    Estimated Hours Remaining
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedHoursRemaining}
                    onChange={(e) => setEstimatedHoursRemaining(Number(e.target.value))}
                    required
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="border-t border-dark-border/40 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={checkInLoading}
                  onClick={() => setIsCheckInOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkInLoading}
                  className="btn-primary flex items-center gap-1.5"
                >
                  {checkInLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    'Submit Log'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalDetails;
