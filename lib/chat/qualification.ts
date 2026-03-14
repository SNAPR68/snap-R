interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface QualificationResult {
  score: number;
  signals: string[];
  budget: string | null;
  timeline: string | null;
  financing: string | null;
  isHotLead: boolean;
}

const BUDGET_PATTERNS = [
  /\$[\d,]+k?/i,
  /budget\s+(?:is|of|around|about)\s+\$?[\d,]+/i,
  /(?:can|could)\s+(?:afford|spend)\s+\$?[\d,]+/i,
  /pre[- ]?approved?\s+(?:for|at)\s+\$?[\d,]+/i,
  /looking\s+(?:in|around)\s+(?:the\s+)?\$?[\d,]+/i,
];

const TIMELINE_PATTERNS = [
  /(?:move|moving|relocate|relocating)\s+(?:in|by|before)\s+\w+/i,
  /(?:need|want)\s+(?:to\s+)?(?:move|be\s+in)\s+(?:by|before|within)\s+/i,
  /(?:asap|immediately|right\s+away|as\s+soon\s+as)/i,
  /(?:next|this)\s+(?:week|month|year|spring|summer|fall|winter)/i,
  /(?:within|in)\s+(\d+)\s+(?:days?|weeks?|months?)/i,
  /(?:no\s+rush|just\s+(?:looking|browsing)|not\s+(?:in\s+a\s+)?hurry)/i,
];

const INTEREST_PATTERNS: Array<{ pattern: RegExp; score: number; signal: string }> = [
  { pattern: /(?:schedule|book|set\s+up)\s+(?:a\s+)?(?:showing|tour|visit|viewing)/i, score: 30, signal: 'wants_showing' },
  { pattern: /(?:when|can)\s+(?:i|we)\s+(?:see|visit|tour|view)\s+(?:the|this)/i, score: 25, signal: 'wants_to_visit' },
  { pattern: /(?:make|submit|put\s+in)\s+(?:an?\s+)?offer/i, score: 30, signal: 'wants_to_offer' },
  { pattern: /(?:how\s+much|what.*price|negotiate|negotiable)/i, score: 15, signal: 'price_inquiry' },
  { pattern: /(?:love|perfect|exactly|dream|amazing|beautiful)/i, score: 10, signal: 'positive_sentiment' },
  { pattern: /(?:school|commute|neighborhood|area|community)/i, score: 8, signal: 'location_research' },
  { pattern: /(?:mortgage|financing|loan|down\s+payment|pre[- ]?approv)/i, score: 15, signal: 'financing_discussion' },
  { pattern: /(?:bed|bath|garage|yard|kitchen|basement|square\s+f)/i, score: 5, signal: 'feature_inquiry' },
];

const CONTACT_PATTERNS = [
  { pattern: /(?:my\s+(?:email|phone|number)\s+is|reach\s+me\s+at|contact\s+me)/i, score: 10, signal: 'shared_contact' },
  { pattern: /[\w.+-]+@[\w-]+\.[\w.]+/i, score: 10, signal: 'shared_email' },
  { pattern: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i, score: 10, signal: 'shared_phone' },
];

export function assessQualification(messages: ChatMessage[]): QualificationResult {
  let score = 0;
  const signals: string[] = [];
  let budget: string | null = null;
  let timeline: string | null = null;
  let financing: string | null = null;

  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content);
  const fullText = userMessages.join(' ');

  // Budget detection
  for (const pattern of BUDGET_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      budget = match[0];
      score += 20;
      signals.push('budget_mentioned');
      break;
    }
  }

  // Timeline detection
  for (const pattern of TIMELINE_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      timeline = match[0];
      if (/asap|immediately|right\s+away/i.test(match[0])) {
        score += 20;
        signals.push('urgent_timeline');
      } else if (/no\s+rush|just\s+(?:looking|browsing)/i.test(match[0])) {
        score += 3;
        signals.push('casual_timeline');
      } else {
        score += 10;
        signals.push('has_timeline');
      }
      break;
    }
  }

  // Interest signals
  for (const { pattern, score: pts, signal } of INTEREST_PATTERNS) {
    if (pattern.test(fullText)) {
      score += pts;
      signals.push(signal);
    }
  }

  // Contact info sharing
  for (const { pattern, score: pts, signal } of CONTACT_PATTERNS) {
    if (pattern.test(fullText)) {
      score += pts;
      signals.push(signal);
    }
  }

  // Financing detection
  if (/pre[- ]?approv/i.test(fullText)) {
    financing = 'pre-approved';
    score += 15;
    signals.push('pre_approved');
  } else if (/(?:mortgage|loan|financing)/i.test(fullText)) {
    financing = 'exploring';
    signals.push('exploring_financing');
  }

  // Engagement bonus (more messages = more engaged)
  if (userMessages.length >= 5) {
    score += 10;
    signals.push('high_engagement');
  } else if (userMessages.length >= 3) {
    score += 5;
    signals.push('moderate_engagement');
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    score,
    signals,
    budget,
    timeline,
    financing,
    isHotLead: score >= 60,
  };
}
