import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/prisma';
import { evaluateRisk, generateStandup, generateRecoveryPlan } from '../services/gemini.service';
import { sendPushNotification } from '../controllers/notification.controller';
import { appConfig } from '../config/appConfig';

export const monitoringWorker = new Worker(
  'monitoring-queue',
  async (job) => {
    if (job.name === 'check-active-goals') {
      console.log('[Worker] Starting background monitoring sweep for active goals...');
      
      try {
        const activeGoals = await prisma.goal.findMany({
          where: {
            status: {
              in: ['ACTIVE', 'AT_RISK', 'DELAYED', 'PLANNED'],
            },
          },
          include: {
            tasks: true,
            progressLogs: {
              orderBy: { createdAt: 'desc' },
            },
            agentReports: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        console.log(`[Worker] Found ${activeGoals.length} active goals to process.`);

        const now = new Date();

        for (const goal of activeGoals) {
          try {
            console.log(`[Worker] Processing goal: "${goal.title}" (ID: ${goal.id})`);

            // 1. INACTIVITY MONITORING
            const latestLog = goal.progressLogs[0];
            const lastActivityTime = latestLog ? new Date(latestLog.createdAt) : new Date(goal.createdAt);
            const hrsSinceActivity = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60 * 60);

            if (hrsSinceActivity >= 24) {
              console.log(`[Worker] Inactivity detected for goal "${goal.title}". Hours since last activity: ${hrsSinceActivity.toFixed(1)}`);
              // Check if we already sent an inactivity alert in the last 24 hours
              const existingNotification = await prisma.notification.findFirst({
                where: {
                  userId: goal.userId,
                  type: 'PROGRESS_REMINDER',
                  createdAt: {
                    gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                  },
                  message: {
                    contains: goal.title,
                  },
                },
              });

              if (!existingNotification) {
                await prisma.notification.create({
                  data: {
                    userId: goal.userId,
                    type: 'PROGRESS_REMINDER',
                    title: 'Progress Update Reminder',
                    message: `It has been over 24 hours since your last progress check-in for goal "${goal.title}". Let's log an update to keep your momentum going!`,
                  },
                });
                // Send Web Push notification
                sendPushNotification(
                  goal.userId,
                  'Progress Update Reminder ⏰',
                  `It has been over 24 hours since your last check-in for "${goal.title}". Let's log progress!`
                ).catch(err => console.error('Push failed:', err));
                console.log(`[Worker] Inactivity notification created for user ${goal.userId}`);
              }
            }

            // 2. RISK EVALUATION
            const lastRiskReport = goal.agentReports.find(r => r.agentType === 'RISK');
            const shouldRunRisk = !lastRiskReport || 
              (now.getTime() - new Date(lastRiskReport.createdAt).getTime()) / (1000 * 60 * 60) >= appConfig.riskCooldownHours ||
              (latestLog && new Date(latestLog.createdAt) > new Date(lastRiskReport.createdAt));

            let currentRiskScore = goal.riskScore;

            if (shouldRunRisk) {
              console.log(`[Worker] Running AI Risk Agent for goal "${goal.title}"...`);
              const assessment = await evaluateRisk(
                goal.title,
                goal.description,
                goal.deadline,
                goal.tasks,
                goal.progressLogs
              );

              if (assessment) {
                currentRiskScore = assessment.riskScore;
                
                let nextGoalStatus = goal.status;
                if (currentRiskScore >= 70) {
                  nextGoalStatus = 'AT_RISK';
                } else if (currentRiskScore >= 50) {
                  nextGoalStatus = 'DELAYED';
                } else {
                  nextGoalStatus = 'ACTIVE';
                }

                await prisma.goal.update({
                  where: { id: goal.id },
                  data: { 
                    riskScore: assessment.riskScore,
                    status: nextGoalStatus
                  },
                });

                await prisma.agentReport.create({
                  data: {
                    goalId: goal.id,
                    agentType: 'RISK',
                    summary: `Risk Level: ${assessment.riskLevel}. Score: ${assessment.riskScore}%. Probability: ${assessment.completionProbability}%. Reason: ${assessment.explanation}`,
                    metadata: assessment as any,
                  },
                });

                // Trigger a notification if risk is high
                if (currentRiskScore >= appConfig.riskThreshold) {
                  await prisma.notification.create({
                    data: {
                      userId: goal.userId,
                      type: 'RISK_ALERT',
                      title: 'High Risk Alert',
                      message: `Execution risk is high (${currentRiskScore}%) for your goal "${goal.title}". Reason: ${assessment.explanation}`,
                    },
                  });
                  // Send Web Push notification
                  sendPushNotification(
                    goal.userId,
                    'High Risk Alert 🚨',
                    `Risk is high (${currentRiskScore}%) for "${goal.title}".`
                  ).catch(err => console.error('Push failed:', err));
                }

                console.log(`[Worker] Risk evaluation updated for "${goal.title}": ${assessment.riskScore}%`);
              } else {
                console.warn(`[Worker] Risk evaluation failed/returned null for goal "${goal.title}". Creating cooldown report.`);
                await prisma.agentReport.create({
                  data: {
                    goalId: goal.id,
                    agentType: 'RISK',
                    summary: `Risk Level: LOW (AI rate limit fallback). Score: ${goal.riskScore}%. Explanation: AI Risk Assessment temporary cooldown marker due to API rate limit limits.`,
                    metadata: { failed: true, riskScore: goal.riskScore, riskLevel: 'LOW', explanation: 'AI Offline/Rate limit cooldown active. Defaulting to previous state.' } as any,
                  },
                });
              }
            }

            // 3. RECOVERY TRIGGER
            if (currentRiskScore >= appConfig.riskThreshold) {
              const lastRecoveryReport = goal.agentReports.find(r => r.agentType === 'RECOVERY');
              const shouldRunRecovery = !lastRecoveryReport || 
                (lastRiskReport && new Date(lastRecoveryReport.createdAt) < new Date(lastRiskReport.createdAt)) ||
                (latestLog && new Date(lastRecoveryReport.createdAt) < new Date(latestLog.createdAt));

              if (shouldRunRecovery) {
                console.log(`[Worker] High Risk detected (${currentRiskScore}%). Running AI Recovery Agent for goal "${goal.title}"...`);
                const riskExplanation = lastRiskReport?.summary || '';
                
                const plan = await generateRecoveryPlan(
                  goal.title,
                  goal.description,
                  goal.deadline,
                  goal.tasks,
                  goal.progressLogs,
                  riskExplanation
                );

                if (plan) {
                  await prisma.agentReport.create({
                    data: {
                      goalId: goal.id,
                      agentType: 'RECOVERY',
                      summary: `Suggestions: ${plan.suggestions.join('. ')}`,
                      metadata: plan as any,
                    },
                  });

                  await prisma.notification.create({
                    data: {
                      userId: goal.userId,
                      type: 'RECOVERY_SUGGESTION',
                      title: 'Adaptive Recovery Plan Ready',
                      message: `ActionPilot detected high execution risk (${currentRiskScore}%) for your goal "${goal.title}". A recovery plan has been generated to get you back on track.`,
                    },
                  });
                  // Send Web Push notification
                  sendPushNotification(
                    goal.userId,
                    'Adaptive Recovery Plan Ready 🛡️',
                    `A recovery plan has been generated for your goal "${goal.title}" to get you back on track.`
                  ).catch(err => console.error('Push failed:', err));
                  console.log(`[Worker] Recovery plan auto-generated for goal "${goal.title}"`);
                } else {
                  console.warn(`[Worker] Recovery plan generation failed/returned null for goal "${goal.title}". Creating cooldown report.`);
                  await prisma.agentReport.create({
                    data: {
                      goalId: goal.id,
                      agentType: 'RECOVERY',
                      summary: `Recovery suggestions temporarily unavailable (AI offline).`,
                      metadata: { failed: true, suggestions: ['Maintain velocity and check tasks.'], revisedTasks: [] } as any,
                    },
                  });
                }
              }
            }

            // 4. DAILY STANDUP
            const lastStandupReport = goal.agentReports.find(r => r.agentType === 'STANDUP');
            const shouldRunStandup = !lastStandupReport || 
              (now.getTime() - new Date(lastStandupReport.createdAt).getTime()) / (1000 * 60 * 60) >= appConfig.standupCooldownHours;

             if (shouldRunStandup) {
              console.log(`[Worker] Running AI Standup Agent for goal "${goal.title}"...`);
              const standup = await generateStandup(
                goal.title,
                goal.description,
                goal.deadline,
                goal.tasks,
                goal.progressLogs
              );

              if (standup) {
                await prisma.agentReport.create({
                  data: {
                    goalId: goal.id,
                    agentType: 'STANDUP',
                    summary: `AI Standup: Estimated Confidence: ${standup.confidence}%. Focus: ${standup.summary}`,
                    metadata: standup as any,
                  },
                });

                await prisma.notification.create({
                  data: {
                    userId: goal.userId,
                    type: 'DAILY_STANDUP',
                    title: 'Daily Standup Summary',
                    message: `Your daily standup summary for "${goal.title}" has been prepared by your AI Coach.`,
                  },
                });
                // Send Web Push notification
                sendPushNotification(
                  goal.userId,
                  'Daily Standup Summary 📅',
                  `Your daily standup briefing for "${goal.title}" has been prepared by your AI Coach.`
                ).catch(err => console.error('Push failed:', err));
                console.log(`[Worker] Standup report auto-generated for goal "${goal.title}"`);
              } else {
                console.warn(`[Worker] Standup generation failed/returned null for goal "${goal.title}". Creating cooldown report.`);
                await prisma.agentReport.create({
                  data: {
                    goalId: goal.id,
                    agentType: 'STANDUP',
                    summary: `AI Standup: Summary temporarily unavailable.`,
                    metadata: { failed: true, summary: 'Daily coach standup is temporarily offline due to API rate limit limits.', confidence: 50, recommendations: [], followUpQuestions: [] } as any,
                  },
                });
              }
            }

          } catch (goalError) {
            console.error(`[Worker] Error processing goal "${goal.title}" (ID: ${goal.id}):`, goalError);
          }
        }
      } catch (sweepError) {
        console.error('[Worker] Fatal error during monitoring sweep:', sweepError);
      }
      
      console.log('[Worker] Background monitoring sweep completed.');
    }
  },
  { connection: redisConnection }
);

monitoringWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});
