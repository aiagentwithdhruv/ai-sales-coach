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
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scoreLeadOnCreate,
    scoreLeadOnEnrich,
    routeAfterScoring,
    triggerFollowUpsAfterCall,
    sendFollowUpMessage,
    processDueFollowUps,
    qualifyLead,
    routeQualifiedLead,
  ],
});
