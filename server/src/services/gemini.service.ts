import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { appConfig } from '../config/appConfig';

// ── Initialization ──────────────────────────────────────────────────────────

const getModel = () => {
  const apiKey = appConfig.geminiApiKey;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// ── Goal Analyzer Agent ─────────────────────────────────────────────────────

export interface GoalAnalysis {
  category: string;
  complexity: string;
  estimatedEffortHours: number;
  riskFactors: string[];
}

const GOAL_ANALYZER_SYSTEM = `You are an expert execution coach and goal analyst. 
Given a user's goal title, description, and deadline, you must:
1. Categorize the goal (e.g. Career Development, Academic, Health & Fitness, Creative, Technical, Business).
2. Assess complexity as LOW, MEDIUM, or HIGH.
3. Estimate realistic total effort in hours.
4. Identify 2-4 concrete risk factors that could cause the user to miss the deadline.

Be realistic. Consider the time available vs effort required. 
Respond ONLY with valid JSON matching the schema.`;

const goalAnalysisSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    category: { type: SchemaType.STRING, description: 'Goal category' },
    complexity: { type: SchemaType.STRING, description: 'LOW, MEDIUM, or HIGH' },
    estimatedEffortHours: { type: SchemaType.INTEGER, description: 'Total estimated hours of effort' },
    riskFactors: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of 2-4 risk factors',
    },
  },
  required: ['category', 'complexity', 'estimatedEffortHours', 'riskFactors'],
};

export async function analyzeGoal(
  title: string,
  description: string,
  deadline: Date
): Promise<GoalAnalysis | null> {
  const model = getModel();
  if (!model) {
    console.warn('[Gemini] API key not configured – skipping goal analysis');
    return null;
  }

  const now = new Date();
  const daysRemaining = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const prompt = `Analyze this goal:

Title: ${title}
Description: ${description}
Deadline: ${deadline.toISOString()} (${daysRemaining} days from now)

Provide your analysis as JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: GOAL_ANALYZER_SYSTEM,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: goalAnalysisSchema,
        temperature: 0.4,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as GoalAnalysis;
    return parsed;
  } catch (error) {
    console.error('[Gemini] Goal analysis failed:', error);
    return null;
  }
}

// ── Planning Agent ──────────────────────────────────────────────────────────

export interface PlannedTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedHours: number;
  timelineProgress: number; // 0.0 to 1.0
}

export interface PlanResult {
  tasks: PlannedTask[];
}

const PLANNING_AGENT_SYSTEM = `You are a project planning assistant specializing in breaking goals into actionable tasks.
Given a goal with its analysis metadata, generate between 4 and 7 tasks that form a logical execution plan.
Each task must have:
- A clear, actionable title
- A brief description explaining what to do
- A priority level (HIGH, MEDIUM, or LOW)
- Estimated hours to complete
- A timelineProgress value (0.0 to 1.0) indicating when in the timeline this task's due date falls

Order tasks chronologically. Earlier tasks should have lower timelineProgress values.
Ensure the total estimated hours roughly match the effort estimate from the analysis.
Respond ONLY with valid JSON matching the schema.`;

const planSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING, description: 'LOW, MEDIUM, or HIGH' },
          estimatedHours: { type: SchemaType.INTEGER },
          timelineProgress: { type: SchemaType.NUMBER, description: '0.0 to 1.0 timeline offset' },
        },
        required: ['title', 'description', 'priority', 'estimatedHours', 'timelineProgress'],
      },
    },
  },
  required: ['tasks'],
};

export async function generatePlan(
  title: string,
  description: string,
  deadline: Date,
  analysis: GoalAnalysis
): Promise<PlanResult | null> {
  const model = getModel();
  if (!model) {
    console.warn('[Gemini] API key not configured – skipping plan generation');
    return null;
  }

  const now = new Date();
  const daysRemaining = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const prompt = `Create an execution plan for this goal:

Title: ${title}
Description: ${description}
Deadline: ${deadline.toISOString()} (${daysRemaining} days from now)

Goal Analysis:
- Category: ${analysis.category}
- Complexity: ${analysis.complexity}
- Estimated Effort: ${analysis.estimatedEffortHours} hours
- Risk Factors: ${analysis.riskFactors.join(', ')}

Generate 4-7 tasks that form a complete execution plan. Respond as JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: PLANNING_AGENT_SYSTEM,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: planSchema,
        temperature: 0.5,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as PlanResult;
    return parsed;
  } catch (error) {
    console.error('[Gemini] Plan generation failed:', error);
    return null;
  }
}

// ── Risk Agent ──────────────────────────────────────────────────────────────

export interface RiskAnalysis {
  completionProbability: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
}

const RISK_AGENT_SYSTEM = `You are a Risk Assessment Agent for ActionPilot, an AI Execution Companion.
Your role is to assess the risk of a user missing their goal deadline.
Given a goal (title, description, deadline), its tasks (completed vs pending), progress updates, and user confidence scores, you must:
1. Estimate completion probability (0% to 100%) based on remaining tasks, remaining time, blockers, and progress velocity.
2. Determine risk score (0 to 100).
3. Assign a risk level (LOW, MEDIUM, HIGH, or CRITICAL).
4. Provide a detailed, realistic explanation explaining bottlenecks, blockers, or velocity-related risks.

Respond ONLY with valid JSON matching the schema.`;

const riskSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    completionProbability: { type: SchemaType.INTEGER, description: 'Likelihood of successful completion (0-100)' },
    riskScore: { type: SchemaType.INTEGER, description: 'Likelihood of missing deadline (0-100)' },
    riskLevel: { type: SchemaType.STRING, description: 'LOW, MEDIUM, HIGH, or CRITICAL' },
    explanation: { type: SchemaType.STRING, description: 'Assessment reasoning' },
  },
  required: ['completionProbability', 'riskScore', 'riskLevel', 'explanation'],
};

export async function evaluateRisk(
  title: string,
  description: string,
  deadline: Date,
  tasks: { title: string; status: string; priority: string; estimatedHours: number | null }[],
  progressLogs: { updateText: string; progressPercentage: number; executionStatus: string | null; blockerDescription: string | null; confidenceScore: number | null; createdAt: Date }[]
): Promise<RiskAnalysis | null> {
  const model = getModel();
  if (!model) {
    console.warn('[Gemini] API key not configured – skipping risk evaluation');
    return null;
  }

  const now = new Date();
  const timeRemainingHours = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysRemaining = (timeRemainingHours / 24).toFixed(1);

  const prompt = `Assess the execution risk for this goal:

Title: ${title}
Description: ${description}
Deadline: ${deadline.toISOString()} (${daysRemaining} days remaining)

Checklist Tasks:
${tasks.map(t => `- [${t.status}] ${t.title} (${t.priority} priority, ${t.estimatedHours || 0}h)`).join('\n')}

Progress Log Updates (Newest First):
${progressLogs.map(l => `- [${l.createdAt.toISOString()}] Progress: ${l.progressPercentage}%, Status: ${l.executionStatus || 'ON_TRACK'}, Confidence: ${l.confidenceScore || 'N/A'}/5, Blocker: ${l.blockerDescription || 'None'}\n  "${l.updateText}"`).join('\n')}

Calculate the completion probability and risk score. Provide your assessment as JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: RISK_AGENT_SYSTEM,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: riskSchema,
        temperature: 0.3,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as RiskAnalysis;
    return parsed;
  } catch (error) {
    console.error('[Gemini] Risk evaluation failed:', error);
    return null;
  }
}

// ── Standup Agent ───────────────────────────────────────────────────────────

export interface StandupReport {
  summary: string;
  confidence: number;
  recommendations: string[];
  followUpQuestions: string[];
}

const STANDUP_AGENT_SYSTEM = `You are a Standup Agent for ActionPilot, an AI Execution Companion.
Your role is to summarize execution progress and provide daily accountability updates.
Given a goal, its tasks, and recent progress updates, you must:
1. Provide a daily summary structured into: "Yesterday" (what was completed), "Pending" (what is delayed or in-progress), and "Today's Focus" (critical path items).
2. Estimate the user's overall completion confidence (0 to 100) based on velocity and confidence score trends.
3. List 2-3 actionable recommendations to unblock progress or maintain momentum.
4. List 1-2 direct follow-up questions to hold the user accountable.

Respond ONLY with valid JSON matching the schema.`;

const standupSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING, description: 'Yesterday, Pending, and Today\'s Focus summary' },
    confidence: { type: SchemaType.INTEGER, description: 'AI estimated confidence level (0-100)' },
    recommendations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '2-3 actionable execution recommendations',
    },
    followUpQuestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '1-2 accountability follow-up questions',
    },
  },
  required: ['summary', 'confidence', 'recommendations', 'followUpQuestions'],
};

export async function generateStandup(
  title: string,
  description: string,
  deadline: Date,
  tasks: { title: string; status: string; priority: string; estimatedHours: number | null }[],
  progressLogs: { updateText: string; progressPercentage: number; executionStatus: string | null; blockerDescription: string | null; confidenceScore: number | null; createdAt: Date }[]
): Promise<StandupReport | null> {
  const model = getModel();
  if (!model) {
    console.warn('[Gemini] API key not configured – skipping standup generation');
    return null;
  }

  const now = new Date();
  const timeRemainingHours = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysRemaining = (timeRemainingHours / 24).toFixed(1);

  const prompt = `Generate a standup report for this goal:

Title: ${title}
Description: ${description}
Deadline: ${deadline.toISOString()} (${daysRemaining} days remaining)

Checklist Tasks:
${tasks.map(t => `- [${t.status}] ${t.title} (${t.priority} priority, ${t.estimatedHours || 0}h)`).join('\n')}

Progress Log Updates (Newest First):
${progressLogs.slice(0, 5).map(l => `- [${l.createdAt.toISOString()}] Progress: ${l.progressPercentage}%, Status: ${l.executionStatus || 'ON_TRACK'}, Confidence: ${l.confidenceScore || 'N/A'}/5, Blocker: ${l.blockerDescription || 'None'}\n  "${l.updateText}"`).join('\n')}

Provide your standup assessment as JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: STANDUP_AGENT_SYSTEM,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: standupSchema,
        temperature: 0.5,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as StandupReport;
    return parsed;
  } catch (error) {
    console.error('[Gemini] Standup generation failed:', error);
    return null;
  }
}

// ── Recovery Agent ──────────────────────────────────────────────────────────

export interface RevisedTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedHours: number;
  timelineProgress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface RecoveryPlan {
  suggestions: string[];
  revisedTasks: RevisedTask[];
}

const RECOVERY_AGENT_SYSTEM = `You are a Recovery Agent for ActionPilot, an AI Execution Companion.
Your role is to formulate a recovery plan for a user's goal that is delayed or at risk.
Given the goal info, the list of current checklist tasks, and recent progress updates, you must:
1. Provide 2-3 specific, actionable recommendations (suggestions) to recover from delays (e.g. reprioritize, defer, or reduce the scope of remaining tasks).
2. Generate a revised list of tasks representing the optimized path to completion.
3. IMPORTANT CRITICAL RULE: You MUST keep all currently "COMPLETED" tasks exactly as they are in the list. Do not change their title, description, priority, hours, or set their status to pending. Only modify, reprioritize, reschedule, or remove tasks that are "PENDING" or "IN_PROGRESS".

Respond ONLY with valid JSON matching the schema.`;

const recoverySchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '2-3 scope reduction or schedule adjustment suggestions',
    },
    revisedTasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING, description: 'LOW, MEDIUM, or HIGH' },
          estimatedHours: { type: SchemaType.INTEGER },
          timelineProgress: { type: SchemaType.NUMBER, description: '0.0 to 1.0 timeline offset' },
          status: { type: SchemaType.STRING, description: 'PENDING, IN_PROGRESS, or COMPLETED' },
        },
        required: ['title', 'description', 'priority', 'estimatedHours', 'timelineProgress', 'status'],
      },
    },
  },
  required: ['suggestions', 'revisedTasks'],
};

export async function generateRecoveryPlan(
  title: string,
  description: string,
  deadline: Date,
  tasks: { title: string; status: string; priority: string; estimatedHours: number | null }[],
  progressLogs: { updateText: string; progressPercentage: number; executionStatus: string | null; blockerDescription: string | null; confidenceScore: number | null; createdAt: Date }[],
  riskExplanation?: string
): Promise<RecoveryPlan | null> {
  const model = getModel();
  if (!model) {
    console.warn('[Gemini] API key not configured – skipping recovery plan generation');
    return null;
  }

  const now = new Date();
  const timeRemainingHours = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysRemaining = (timeRemainingHours / 24).toFixed(1);

  const prompt = `Formulate a recovery plan for this goal:

Title: ${title}
Description: ${description}
Deadline: ${deadline.toISOString()} (${daysRemaining} days remaining)

Current Checklist Tasks:
${tasks.map(t => `- [${t.status}] ${t.title} (${t.priority} priority, ${t.estimatedHours || 0}h)`).join('\n')}

Progress Log Updates (Newest First):
${progressLogs.slice(0, 5).map(l => `- [${l.createdAt.toISOString()}] Progress: ${l.progressPercentage}%, Status: ${l.executionStatus || 'ON_TRACK'}, Confidence: ${l.confidenceScore || 'N/A'}/5, Blocker: ${l.blockerDescription || 'None'}\n  "${l.updateText}"`).join('\n')}

${riskExplanation ? `Latest Risk Assessment Diagnosis:\n"${riskExplanation}"` : ''}

Generate suggestions and the revised task list. Remember: Keep completed tasks unchanged in status and content. Respond as JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: RECOVERY_AGENT_SYSTEM,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: recoverySchema,
        temperature: 0.4,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as RecoveryPlan;
    return parsed;
  } catch (error) {
    console.error('[Gemini] Recovery plan generation failed:', error);
    return null;
  }
}
