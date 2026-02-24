import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  scoreLeadOnCreate,
  scoreLeadOnEnrich,
  routeAfterScoring,
  triggerFollowUpsAfterCall,
  sendFollowUpMessage,
  processDueFollowUps,
  qualifyLead,
  routeQualifiedLead,
  // Phase 2: Outreach Engine
  enrollInOutreach,
  executeOutreachStep,
  handleOutreachReply,
  outreachSequenceCompleted,
  autoEnrollAfterRouting,
  // Phase 3: The Brain
  orchestrateOnContactCreated,
  handleStuckLeads,
  handleEscalation,
  recordDealOutcome,
  recalibrateScoring,
  trackAgentPerformance,
  // Phase 4: The Closer
  autoGenerateProposal,
  startOnboardingOnWin,
  processOnboardingSteps,
  sendMeetingRemindersJob,
  checkOverdueInvoices,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Phase 1: Lead Pipeline
    scoreLeadOnCreate,
    scoreLeadOnEnrich,
    routeAfterScoring,
    triggerFollowUpsAfterCall,
    sendFollowUpMessage,
    processDueFollowUps,
    qualifyLead,
    routeQualifiedLead,
    // Phase 2: Outreach Engine
    enrollInOutreach,
    executeOutreachStep,
    handleOutreachReply,
    outreachSequenceCompleted,
    autoEnrollAfterRouting,
    // Phase 3: The Brain
    orchestrateOnContactCreated,
    handleStuckLeads,
    handleEscalation,
    recordDealOutcome,
    recalibrateScoring,
    trackAgentPerformance,
    // Phase 4: The Closer
    autoGenerateProposal,
    startOnboardingOnWin,
    processOnboardingSteps,
    sendMeetingRemindersJob,
    checkOverdueInvoices,
  ],
});
