/**
 * Inngest Function Registry
 *
 * All functions exported here are automatically registered
 * with the Inngest API route handler.
 */

export {
  scoreLeadOnCreate,
  scoreLeadOnEnrich,
  routeAfterScoring,
  triggerFollowUpsAfterCall,
  sendFollowUpMessage,
  processDueFollowUps,
} from "./lead-pipeline";

export { qualifyLead } from "./qualification";

export { routeQualifiedLead } from "./routing";

// Phase 2: Outreach Engine
export {
  enrollInOutreach,
  executeOutreachStep,
  handleOutreachReply,
  outreachSequenceCompleted,
  autoEnrollAfterRouting,
} from "./outreach";

// Phase 3: The Brain
export {
  orchestrateOnContactCreated,
  handleStuckLeads,
  handleEscalation,
} from "./orchestrator";

export {
  recordDealOutcome,
  recalibrateScoring,
  trackAgentPerformance,
} from "./feedback";
