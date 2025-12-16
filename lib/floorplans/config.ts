// Floor Plan Configuration
// All plan types, pricing, and style options

export const PLAN_TYPES = {
  '2d-basic': {
    id: '2d-basic',
    label: '2D Basic',
    description: 'Clean black & white floor plan with room labels and dimensions',
    price: 20,
    credits: 4,
    turnaround: '24 hours',
    features: ['Room labels', 'Dimensions', 'Total sqft', 'PNG & PDF'],
    popular: false,
  },
  '2d-branded': {
    id: '2d-branded',
    label: '2D Branded',
    description: 'Colored floor plan with your logo and brand colors',
    price: 35,
    credits: 6,
    turnaround: '24-48 hours',
    features: ['Everything in Basic', 'Your logo', 'Brand colors', 'Custom fonts', 'High-res files'],
    popular: true,
  },
  '3d-isometric': {
    id: '3d-isometric',
    label: '3D Isometric',
    description: 'Beautiful 3D dollhouse view of the property',
    price: 50,
    credits: 8,
    turnaround: '48 hours',
    features: ['3D visualization', 'Furniture included', 'Multiple angles', 'Interactive viewing'],
    popular: false,
  },
  'interactive': {
    id: 'interactive',
    label: 'Interactive',
    description: 'Clickable floor plan that links to room photos',
    price: 75,
    credits: 12,
    turnaround: '48-72 hours',
    features: ['Clickable rooms', 'Photo integration', 'Embed on website', 'Mobile responsive', 'Analytics'],
    popular: false,
  },
} as const;

export const STYLES = {
  modern: {
    id: 'modern',
    label: 'Modern',
    description: 'Clean, minimal lines',
    preview: '/floor-plan-styles/modern.png',
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Traditional architectural style',
    preview: '/floor-plan-styles/classic.png',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Ultra-simple, icons only',
    preview: '/floor-plan-styles/minimal.png',
  },
  detailed: {
    id: 'detailed',
    label: 'Detailed',
    description: 'Full furniture and fixtures',
    preview: '/floor-plan-styles/detailed.png',
  },
} as const;

export const COLOR_SCHEMES = {
  color: {
    id: 'color',
    label: 'Full Color',
    description: 'Colored rooms and accents',
  },
  grayscale: {
    id: 'grayscale',
    label: 'Grayscale',
    description: 'Professional black & white',
  },
  blueprint: {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'Classic blue architectural style',
  },
} as const;

export const ROOM_TYPES = [
  { id: 'living-room', label: 'Living Room', icon: 'Sofa' },
  { id: 'bedroom', label: 'Bedroom', icon: 'Bed' },
  { id: 'bathroom', label: 'Bathroom', icon: 'Bath' },
  { id: 'kitchen', label: 'Kitchen', icon: 'ChefHat' },
  { id: 'dining-room', label: 'Dining Room', icon: 'UtensilsCrossed' },
  { id: 'office', label: 'Office', icon: 'Monitor' },
  { id: 'garage', label: 'Garage', icon: 'Car' },
  { id: 'laundry', label: 'Laundry', icon: 'Shirt' },
  { id: 'closet', label: 'Closet', icon: 'DoorOpen' },
  { id: 'hallway', label: 'Hallway', icon: 'ArrowRight' },
  { id: 'stairs', label: 'Stairs', icon: 'ArrowUp' },
  { id: 'patio', label: 'Patio/Deck', icon: 'Sun' },
  { id: 'balcony', label: 'Balcony', icon: 'Cloud' },
  { id: 'basement', label: 'Basement', icon: 'ArrowDown' },
  { id: 'attic', label: 'Attic', icon: 'Home' },
] as const;

// Pricing helpers
export function calculatePrice(planType: string, options: { rush?: boolean; branded?: boolean } = {}): number {
  const plan = PLAN_TYPES[planType as keyof typeof PLAN_TYPES];
  if (!plan) return 0;
  
  let price = plan.price;
  
  if (options.rush) {
    price += Math.round(plan.price * 0.5); // 50% rush fee
  }
  
  return price;
}

export function calculateCredits(planType: string): number {
  const plan = PLAN_TYPES[planType as keyof typeof PLAN_TYPES];
  return plan?.credits || 5;
}

export function getEstimatedDelivery(planType: string, rush: boolean = false): Date {
  const now = new Date();
  let hours = 24;
  
  switch (planType) {
    case '2d-basic':
      hours = rush ? 6 : 24;
      break;
    case '2d-branded':
      hours = rush ? 12 : 48;
      break;
    case '3d-isometric':
      hours = rush ? 24 : 48;
      break;
    case 'interactive':
      hours = rush ? 36 : 72;
      break;
  }
  
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export type PlanType = keyof typeof PLAN_TYPES;
export type StyleType = keyof typeof STYLES;
export type ColorScheme = keyof typeof COLOR_SCHEMES;
