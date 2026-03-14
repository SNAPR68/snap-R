interface ListingContext {
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  description?: string;
  features?: string[];
  style?: string;
  condition?: string;
  neighborhood?: string;
}

interface AgentContext {
  name?: string;
  phone?: string;
  email?: string;
  brokerage?: string;
}

export function buildPropertyChatPrompt(
  listing: ListingContext,
  agent?: AgentContext,
  detectedFeatures?: string[],
): string {
  const parts: string[] = [];

  parts.push(`You are a helpful property assistant for a real estate listing. Answer questions about the property accurately and professionally. Be warm, conversational, and concise.`);

  parts.push(`\n## Rules
- ONLY use information provided below. Never fabricate facts.
- If you don't know something, say "I'd recommend asking the listing agent directly."
- Naturally try to learn the visitor's name, budget, timeline, and if they're pre-approved for financing.
- If the visitor seems interested, suggest scheduling a showing.
- Keep responses concise (2-3 sentences max unless they ask for details).
- Never discuss other properties or competitors.
- Never discuss the listing price being negotiable unless the visitor asks.`);

  // Property details
  parts.push(`\n## Property Details`);
  if (listing.address) parts.push(`Address: ${listing.address}`);
  if (listing.price) parts.push(`List Price: $${listing.price.toLocaleString()}`);
  if (listing.beds) parts.push(`Bedrooms: ${listing.beds}`);
  if (listing.baths) parts.push(`Bathrooms: ${listing.baths}`);
  if (listing.sqft) parts.push(`Square Footage: ${listing.sqft.toLocaleString()}`);
  if (listing.style) parts.push(`Style: ${listing.style}`);
  if (listing.condition) parts.push(`Condition: ${listing.condition}`);
  if (listing.neighborhood) parts.push(`Neighborhood: ${listing.neighborhood}`);

  if (listing.description) {
    parts.push(`\n## Property Description\n${listing.description}`);
  }

  // AI-detected features from computer vision
  if (detectedFeatures && detectedFeatures.length > 0) {
    parts.push(`\n## Detected Property Features\n${detectedFeatures.map(f => f.replace(/_/g, ' ')).join(', ')}`);
  }

  if (listing.features && listing.features.length > 0) {
    parts.push(`\n## Key Features\n${listing.features.join(', ')}`);
  }

  // Agent info
  if (agent) {
    parts.push(`\n## Listing Agent`);
    if (agent.name) parts.push(`Name: ${agent.name}`);
    if (agent.brokerage) parts.push(`Brokerage: ${agent.brokerage}`);
    if (agent.phone) parts.push(`Phone: ${agent.phone}`);
    if (agent.email) parts.push(`Email: ${agent.email}`);
    parts.push(`\nWhen the visitor wants to schedule a showing or has serious questions, suggest contacting the agent directly.`);
  }

  return parts.join('\n');
}
