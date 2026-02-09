/**
 * Practice Scenarios - 20+ pre-built sales scenarios
 *
 * Each scenario includes a prospect persona, situation context,
 * difficulty level, and training focus.
 */

export interface Scenario {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  persona: {
    name: string;
    title: string;
    company: string;
    industry: string;
  };
  situation: string;
  objective: string;
  trainingFocus: string;
}

export const PRACTICE_SCENARIOS: Scenario[] = [
  // ===== COLD CALL SCENARIOS =====
  {
    id: "cold-saas-ceo",
    title: "Cold Call: SaaS Startup CEO",
    category: "Cold Call",
    difficulty: "easy",
    persona: {
      name: "Alex Rivera",
      title: "CEO & Founder",
      company: "DataPulse",
      industry: "SaaS / Analytics",
    },
    situation: "A 30-person startup that just raised Series A. They're scaling fast and likely have growing pains with manual processes.",
    objective: "Get a 15-minute discovery meeting booked this week.",
    trainingFocus: "cold-call",
  },
  {
    id: "cold-enterprise-vp",
    title: "Cold Call: Enterprise VP Operations",
    category: "Cold Call",
    difficulty: "hard",
    persona: {
      name: "Patricia Chen",
      title: "VP of Operations",
      company: "Atlas Manufacturing",
      industry: "Manufacturing",
    },
    situation: "Fortune 500 company. Strict procurement processes. VP is very busy and screens all calls. You have 30 seconds to earn the next 2 minutes.",
    objective: "Bypass the gatekeeper mindset and earn a follow-up meeting.",
    trainingFocus: "cold-call",
  },
  {
    id: "cold-smb-owner",
    title: "Cold Call: Small Business Owner",
    category: "Cold Call",
    difficulty: "easy",
    persona: {
      name: "Marcus Johnson",
      title: "Owner",
      company: "Johnson & Associates",
      industry: "Accounting / Professional Services",
    },
    situation: "A 10-person accounting firm. Owner handles sales, ops, and delivery. Very time-constrained and skeptical of cold calls.",
    objective: "Build rapport quickly and schedule a 10-minute demo.",
    trainingFocus: "cold-call",
  },

  // ===== DISCOVERY SCENARIOS =====
  {
    id: "disc-fintech-cto",
    title: "Discovery: Fintech CTO",
    category: "Discovery",
    difficulty: "medium",
    persona: {
      name: "Raj Patel",
      title: "CTO",
      company: "PayFlow Technologies",
      industry: "Fintech",
    },
    situation: "They agreed to a discovery call after seeing your demo at a conference. They currently use a competitor but are evaluating alternatives.",
    objective: "Uncover their real pain points, budget range, and decision timeline.",
    trainingFocus: "discovery",
  },
  {
    id: "disc-healthcare-director",
    title: "Discovery: Healthcare IT Director",
    category: "Discovery",
    difficulty: "hard",
    persona: {
      name: "Dr. Sarah Kim",
      title: "IT Director",
      company: "Metro Health System",
      industry: "Healthcare",
    },
    situation: "A 500-bed hospital system evaluating new patient management software. Compliance (HIPAA) is critical. They've been burned by a failed implementation before.",
    objective: "Build trust, understand their compliance needs, and identify the real decision maker.",
    trainingFocus: "discovery",
  },
  {
    id: "disc-ecommerce-head",
    title: "Discovery: E-Commerce Head of Growth",
    category: "Discovery",
    difficulty: "medium",
    persona: {
      name: "Emma Torres",
      title: "Head of Growth",
      company: "StyleVault",
      industry: "E-Commerce / Fashion",
    },
    situation: "DTC brand doing $5M ARR. Growing fast but struggling with customer retention. They inbound from your website.",
    objective: "Understand their retention challenges and map your solution to their growth goals.",
    trainingFocus: "discovery",
  },

  // ===== DEMO SCENARIOS =====
  {
    id: "demo-saas-team",
    title: "Demo: SaaS Buying Committee",
    category: "Demo",
    difficulty: "hard",
    persona: {
      name: "Jennifer Walsh",
      title: "VP Sales + 2 team members",
      company: "Velocity Corp",
      industry: "SaaS",
    },
    situation: "Group demo with the VP Sales, a Sales Manager, and a Sales Ops Analyst. Each has different priorities: VP wants revenue growth, Manager wants ease of use, Ops wants integrations.",
    objective: "Address all three stakeholders' needs without losing control of the demo.",
    trainingFocus: "demo",
  },
  {
    id: "demo-skeptical-buyer",
    title: "Demo: Skeptical Technical Buyer",
    category: "Demo",
    difficulty: "hard",
    persona: {
      name: "David Park",
      title: "Engineering Manager",
      company: "CloudScale Systems",
      industry: "Cloud Infrastructure",
    },
    situation: "Technical evaluation. David will test your product knowledge and try to find flaws. He's already leaning toward a competitor.",
    objective: "Win technical credibility and shift his evaluation criteria.",
    trainingFocus: "demo",
  },

  // ===== OBJECTION HANDLING SCENARIOS =====
  {
    id: "obj-too-expensive",
    title: "Objection: 'Too Expensive' from CFO",
    category: "Objection Handling",
    difficulty: "hard",
    persona: {
      name: "Robert Chang",
      title: "CFO",
      company: "Pinnacle Logistics",
      industry: "Logistics",
    },
    situation: "You're at the proposal stage. The CFO just reviewed pricing and says it's 40% over their budget. Your champion (VP Ops) is on the call but going quiet.",
    objective: "Reframe value, protect pricing, and keep the deal alive.",
    trainingFocus: "objection-handling",
  },
  {
    id: "obj-competitor-cheaper",
    title: "Objection: 'Competitor is Cheaper'",
    category: "Objection Handling",
    difficulty: "medium",
    persona: {
      name: "Lisa Martinez",
      title: "Procurement Manager",
      company: "United Services Inc",
      industry: "Professional Services",
    },
    situation: "They have a competing proposal that's 25% cheaper. Procurement is pushing for the cheaper option. Your champion likes your product but can't justify the premium internally.",
    objective: "Differentiate on value, not price. Help your champion build the internal case.",
    trainingFocus: "objection-handling",
  },
  {
    id: "obj-not-now",
    title: "Objection: 'Not the Right Time'",
    category: "Objection Handling",
    difficulty: "medium",
    persona: {
      name: "Tomoko Sato",
      title: "Director of Marketing",
      company: "Nexus Media Group",
      industry: "Media / Advertising",
    },
    situation: "Strong interest during the demo, but now they're saying 'Let's revisit next quarter.' Their fiscal year ends in 2 months. You suspect this is a stall.",
    objective: "Create urgency, uncover the real objection, and keep momentum.",
    trainingFocus: "objection-handling",
  },
  {
    id: "obj-need-approval",
    title: "Objection: 'Need My Boss's Approval'",
    category: "Objection Handling",
    difficulty: "easy",
    persona: {
      name: "Kevin O'Brien",
      title: "Marketing Manager",
      company: "BrightPath Digital",
      industry: "Digital Marketing",
    },
    situation: "Kevin loves the product but says he needs VP approval. He's never brought a vendor to leadership before and is nervous about pitching internally.",
    objective: "Coach Kevin to be your champion. Offer to help him sell internally.",
    trainingFocus: "objection-handling",
  },

  // ===== NEGOTIATION SCENARIOS =====
  {
    id: "nego-discount-demand",
    title: "Negotiation: Customer Demands 30% Discount",
    category: "Negotiation",
    difficulty: "hard",
    persona: {
      name: "Anika Sharma",
      title: "Head of Procurement",
      company: "TechBridge Solutions",
      industry: "IT Consulting",
    },
    situation: "Final stage. They love the product but procurement is mandating a 30% discount as company policy. Your max approved discount is 15%.",
    objective: "Close the deal without giving 30% off. Trade value for concessions.",
    trainingFocus: "negotiation",
  },
  {
    id: "nego-multi-year",
    title: "Negotiation: Multi-Year Contract Terms",
    category: "Negotiation",
    difficulty: "medium",
    persona: {
      name: "James Miller",
      title: "VP of IT",
      company: "Granite Federal",
      industry: "Government / Defense",
    },
    situation: "They want a 3-year deal but with a break clause after year 1, annual price lock, and 90-day payment terms. Your standard is 2-year minimum, net-30.",
    objective: "Find creative terms that work for both sides without setting bad precedent.",
    trainingFocus: "negotiation",
  },

  // ===== CLOSING SCENARIOS =====
  {
    id: "close-verbal-yes",
    title: "Closing: Getting from Verbal to Signed",
    category: "Closing",
    difficulty: "medium",
    persona: {
      name: "Michelle Park",
      title: "CEO",
      company: "Elevate Consulting",
      industry: "Management Consulting",
    },
    situation: "Michelle said 'Yes, let's do this' on the last call two weeks ago. Since then — silence. No response to emails. Contract unsigned.",
    objective: "Re-engage Michelle and get the contract signed this week.",
    trainingFocus: "closing",
  },
  {
    id: "close-last-minute-doubt",
    title: "Closing: Last-Minute Cold Feet",
    category: "Closing",
    difficulty: "hard",
    persona: {
      name: "Chris Reynolds",
      title: "VP of Sales",
      company: "Momentum SaaS",
      industry: "SaaS",
    },
    situation: "Contract is on the table. Chris calls and says 'I need to think about it one more time.' You've been in this deal for 3 months.",
    objective: "Address the underlying fear, reinforce value, and close today.",
    trainingFocus: "closing",
  },

  // ===== FULL SALES CALL SCENARIOS =====
  {
    id: "full-inbound-lead",
    title: "Full Call: Hot Inbound Lead",
    category: "Full Sales Call",
    difficulty: "easy",
    persona: {
      name: "Taylor Brooks",
      title: "Operations Manager",
      company: "GreenLeaf Co",
      industry: "Sustainability / AgTech",
    },
    situation: "Taylor filled out a 'Request Demo' form 10 minutes ago. They mentioned pain with manual reporting. This is your chance to qualify, demo, and advance in one call.",
    objective: "Qualify the lead, show quick value, and book a follow-up with the decision maker.",
    trainingFocus: "sales-call",
  },
  {
    id: "full-competitive-deal",
    title: "Full Call: Competitive Bake-Off",
    category: "Full Sales Call",
    difficulty: "hard",
    persona: {
      name: "Natasha Volkov",
      title: "Director of Strategy",
      company: "Apex Ventures",
      industry: "Private Equity",
    },
    situation: "You're one of three vendors in a final evaluation. Natasha is sharp, has done extensive research, and will compare you head-to-head. She has 30 minutes.",
    objective: "Differentiate from competitors, demonstrate unique value, and be the clear #1 choice.",
    trainingFocus: "sales-call",
  },

  // ===== GENERAL / RELATIONSHIP SCENARIOS =====
  {
    id: "gen-qbr-presentation",
    title: "General: Quarterly Business Review",
    category: "General",
    difficulty: "medium",
    persona: {
      name: "Angela Foster",
      title: "VP Customer Success",
      company: "Your Existing Customer",
      industry: "Technology",
    },
    situation: "Angela is your main point of contact at a $120K ARR account. Usage has dropped 20% this quarter. She's scheduled a QBR and you sense an expansion opportunity — but also churn risk.",
    objective: "Address the usage drop, prevent churn, and plant seeds for upsell.",
    trainingFocus: "general",
  },
  {
    id: "gen-referral-ask",
    title: "General: Asking for a Referral",
    category: "General",
    difficulty: "easy",
    persona: {
      name: "Mike Chen",
      title: "Director of Sales",
      company: "Happy Customer Inc",
      industry: "SaaS",
    },
    situation: "Mike has been a champion customer for 8 months. NPS score of 9. He mentioned a friend at another company who might benefit. You want to turn this into a warm intro.",
    objective: "Get a warm introduction to Mike's contact without being awkward.",
    trainingFocus: "general",
  },
];

/**
 * Get scenarios grouped by category
 */
export function getScenariosByCategory(): Record<string, Scenario[]> {
  const grouped: Record<string, Scenario[]> = {};
  PRACTICE_SCENARIOS.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });
  return grouped;
}

/**
 * Get scenarios filtered by difficulty
 */
export function getScenariosByDifficulty(
  difficulty: Scenario["difficulty"]
): Scenario[] {
  return PRACTICE_SCENARIOS.filter((s) => s.difficulty === difficulty);
}
