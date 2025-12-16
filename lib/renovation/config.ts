// Virtual Renovation Configuration
// All available styles, room types, and renovation options

export const ROOM_TYPES = {
  kitchen: {
    id: 'kitchen',
    label: 'Kitchen',
    icon: 'ChefHat',
    renovationTypes: ['full-remodel', 'cabinets', 'counters', 'backsplash', 'flooring', 'appliances'],
  },
  bathroom: {
    id: 'bathroom',
    label: 'Bathroom',
    icon: 'Bath',
    renovationTypes: ['full-remodel', 'vanity', 'shower', 'tub', 'flooring', 'fixtures'],
  },
  bedroom: {
    id: 'bedroom',
    label: 'Bedroom',
    icon: 'Bed',
    renovationTypes: ['flooring', 'paint', 'lighting'],
  },
  'living-room': {
    id: 'living-room',
    label: 'Living Room',
    icon: 'Sofa',
    renovationTypes: ['flooring', 'paint', 'fireplace', 'lighting'],
  },
  'dining-room': {
    id: 'dining-room',
    label: 'Dining Room',
    icon: 'UtensilsCrossed',
    renovationTypes: ['flooring', 'paint', 'lighting'],
  },
  exterior: {
    id: 'exterior',
    label: 'Exterior',
    icon: 'Home',
    renovationTypes: ['full-remodel', 'siding', 'roof', 'landscaping', 'driveway', 'paint'],
  },
} as const;

export const RENOVATION_TYPES = {
  'full-remodel': {
    id: 'full-remodel',
    label: 'Full Remodel',
    description: 'Complete room transformation',
    credits: 5,
    priceDisplay: '$49',
  },
  cabinets: {
    id: 'cabinets',
    label: 'Cabinet Replacement',
    description: 'New cabinet style and color',
    credits: 3,
    priceDisplay: '$29',
  },
  counters: {
    id: 'counters',
    label: 'Countertop Change',
    description: 'New countertop material and color',
    credits: 3,
    priceDisplay: '$29',
  },
  backsplash: {
    id: 'backsplash',
    label: 'Backsplash Update',
    description: 'New backsplash style',
    credits: 2,
    priceDisplay: '$19',
  },
  flooring: {
    id: 'flooring',
    label: 'Flooring Change',
    description: 'New floor type and color',
    credits: 3,
    priceDisplay: '$29',
  },
  paint: {
    id: 'paint',
    label: 'Paint Color',
    description: 'Change wall colors',
    credits: 2,
    priceDisplay: '$19',
  },
  appliances: {
    id: 'appliances',
    label: 'Appliance Upgrade',
    description: 'Modern appliances',
    credits: 2,
    priceDisplay: '$19',
  },
  vanity: {
    id: 'vanity',
    label: 'Vanity Replacement',
    description: 'New bathroom vanity',
    credits: 3,
    priceDisplay: '$29',
  },
  shower: {
    id: 'shower',
    label: 'Shower Remodel',
    description: 'Modern shower design',
    credits: 3,
    priceDisplay: '$29',
  },
  tub: {
    id: 'tub',
    label: 'Tub Replacement',
    description: 'New bathtub style',
    credits: 3,
    priceDisplay: '$29',
  },
  fixtures: {
    id: 'fixtures',
    label: 'Fixture Update',
    description: 'New faucets and hardware',
    credits: 2,
    priceDisplay: '$19',
  },
  fireplace: {
    id: 'fireplace',
    label: 'Fireplace Remodel',
    description: 'Updated fireplace design',
    credits: 3,
    priceDisplay: '$29',
  },
  lighting: {
    id: 'lighting',
    label: 'Lighting Update',
    description: 'New light fixtures',
    credits: 2,
    priceDisplay: '$19',
  },
  siding: {
    id: 'siding',
    label: 'Siding Change',
    description: 'New exterior siding',
    credits: 3,
    priceDisplay: '$29',
  },
  roof: {
    id: 'roof',
    label: 'Roof Replacement',
    description: 'New roof style and color',
    credits: 3,
    priceDisplay: '$29',
  },
  landscaping: {
    id: 'landscaping',
    label: 'Landscaping',
    description: 'Updated yard and plants',
    credits: 3,
    priceDisplay: '$29',
  },
  driveway: {
    id: 'driveway',
    label: 'Driveway Update',
    description: 'New driveway surface',
    credits: 2,
    priceDisplay: '$19',
  },
} as const;

export const STYLES = {
  modern: {
    id: 'modern',
    label: 'Modern',
    description: 'Clean lines, minimalist, contemporary',
    keywords: 'modern, contemporary, minimalist, clean lines, sleek, simple',
    colors: ['white', 'gray', 'black', 'navy'],
  },
  traditional: {
    id: 'traditional',
    label: 'Traditional',
    description: 'Classic, timeless, elegant',
    keywords: 'traditional, classic, elegant, timeless, ornate, detailed',
    colors: ['cream', 'beige', 'brown', 'burgundy'],
  },
  farmhouse: {
    id: 'farmhouse',
    label: 'Farmhouse',
    description: 'Rustic, warm, country charm',
    keywords: 'farmhouse, rustic, country, warm, wood, shiplap, barn',
    colors: ['white', 'cream', 'sage', 'natural wood'],
  },
  contemporary: {
    id: 'contemporary',
    label: 'Contemporary',
    description: 'Current trends, bold choices',
    keywords: 'contemporary, trendy, bold, current, stylish',
    colors: ['white', 'charcoal', 'navy', 'emerald'],
  },
  scandinavian: {
    id: 'scandinavian',
    label: 'Scandinavian',
    description: 'Light, airy, functional',
    keywords: 'scandinavian, nordic, light, airy, functional, hygge, minimal',
    colors: ['white', 'light gray', 'light wood', 'pale blue'],
  },
  luxury: {
    id: 'luxury',
    label: 'Luxury',
    description: 'High-end, premium, opulent',
    keywords: 'luxury, high-end, premium, opulent, marble, gold, designer',
    colors: ['white', 'gold', 'marble', 'black'],
  },
  industrial: {
    id: 'industrial',
    label: 'Industrial',
    description: 'Raw, urban, exposed materials',
    keywords: 'industrial, urban, exposed brick, metal, concrete, loft',
    colors: ['gray', 'black', 'rust', 'natural'],
  },
  coastal: {
    id: 'coastal',
    label: 'Coastal',
    description: 'Beach-inspired, relaxed',
    keywords: 'coastal, beach, nautical, relaxed, breezy, ocean',
    colors: ['white', 'blue', 'sand', 'seafoam'],
  },
  transitional: {
    id: 'transitional',
    label: 'Transitional',
    description: 'Blend of traditional and modern',
    keywords: 'transitional, balanced, blend, neutral, sophisticated',
    colors: ['gray', 'taupe', 'cream', 'navy'],
  },
  mediterranean: {
    id: 'mediterranean',
    label: 'Mediterranean',
    description: 'Warm, textured, old-world charm',
    keywords: 'mediterranean, tuscan, spanish, terracotta, arched, warm',
    colors: ['terracotta', 'ochre', 'blue', 'cream'],
  },
} as const;

// Specific options for each renovation type
export const RENOVATION_OPTIONS = {
  cabinets: {
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'cream', label: 'Cream', hex: '#FFFDD0' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'navy', label: 'Navy Blue', hex: '#000080' },
      { id: 'sage', label: 'Sage Green', hex: '#9DC183' },
      { id: 'black', label: 'Black', hex: '#000000' },
      { id: 'natural-wood', label: 'Natural Wood', hex: '#DEB887' },
      { id: 'walnut', label: 'Dark Walnut', hex: '#5C4033' },
    ],
    styles: [
      { id: 'shaker', label: 'Shaker' },
      { id: 'flat-panel', label: 'Flat Panel / Slab' },
      { id: 'raised-panel', label: 'Raised Panel' },
      { id: 'glass-front', label: 'Glass Front' },
      { id: 'open-shelving', label: 'Open Shelving' },
    ],
  },
  counters: {
    materials: [
      { id: 'quartz', label: 'Quartz' },
      { id: 'granite', label: 'Granite' },
      { id: 'marble', label: 'Marble' },
      { id: 'butcher-block', label: 'Butcher Block' },
      { id: 'concrete', label: 'Concrete' },
      { id: 'laminate', label: 'Laminate' },
    ],
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'black', label: 'Black', hex: '#000000' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'brown', label: 'Brown', hex: '#8B4513' },
      { id: 'veined', label: 'White with Veins', hex: '#F0F0F0' },
    ],
  },
  flooring: {
    types: [
      { id: 'hardwood', label: 'Hardwood' },
      { id: 'laminate', label: 'Laminate' },
      { id: 'tile', label: 'Tile' },
      { id: 'vinyl-plank', label: 'Luxury Vinyl Plank' },
      { id: 'carpet', label: 'Carpet' },
      { id: 'concrete', label: 'Polished Concrete' },
      { id: 'stone', label: 'Natural Stone' },
    ],
    colors: [
      { id: 'light-oak', label: 'Light Oak', hex: '#C4A35A' },
      { id: 'natural-oak', label: 'Natural Oak', hex: '#B8860B' },
      { id: 'dark-walnut', label: 'Dark Walnut', hex: '#5C4033' },
      { id: 'gray-wash', label: 'Gray Wash', hex: '#A9A9A9' },
      { id: 'espresso', label: 'Espresso', hex: '#3C2415' },
      { id: 'white-wash', label: 'White Wash', hex: '#F5F5F5' },
      { id: 'white-tile', label: 'White Tile', hex: '#FFFFFF' },
      { id: 'gray-tile', label: 'Gray Tile', hex: '#808080' },
    ],
  },
  paint: {
    colors: [
      { id: 'white', label: 'Pure White', hex: '#FFFFFF' },
      { id: 'warm-white', label: 'Warm White', hex: '#FAF9F6' },
      { id: 'light-gray', label: 'Light Gray', hex: '#D3D3D3' },
      { id: 'gray', label: 'Medium Gray', hex: '#808080' },
      { id: 'greige', label: 'Greige', hex: '#C0B9A8' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'navy', label: 'Navy Blue', hex: '#000080' },
      { id: 'sage', label: 'Sage Green', hex: '#9DC183' },
      { id: 'blush', label: 'Blush Pink', hex: '#DE9898' },
      { id: 'charcoal', label: 'Charcoal', hex: '#36454F' },
      { id: 'cream', label: 'Cream', hex: '#FFFDD0' },
      { id: 'taupe', label: 'Taupe', hex: '#B38B6D' },
    ],
    finishes: [
      { id: 'matte', label: 'Matte' },
      { id: 'eggshell', label: 'Eggshell' },
      { id: 'satin', label: 'Satin' },
      { id: 'semi-gloss', label: 'Semi-Gloss' },
    ],
  },
  backsplash: {
    types: [
      { id: 'subway', label: 'Subway Tile' },
      { id: 'herringbone', label: 'Herringbone' },
      { id: 'hexagon', label: 'Hexagon Tile' },
      { id: 'marble-slab', label: 'Marble Slab' },
      { id: 'mosaic', label: 'Mosaic' },
      { id: 'brick', label: 'Brick' },
      { id: 'glass', label: 'Glass Tile' },
    ],
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'blue', label: 'Blue', hex: '#4169E1' },
      { id: 'green', label: 'Green', hex: '#228B22' },
      { id: 'black', label: 'Black', hex: '#000000' },
    ],
  },
  siding: {
    types: [
      { id: 'vinyl', label: 'Vinyl Siding' },
      { id: 'wood', label: 'Wood Siding' },
      { id: 'fiber-cement', label: 'Fiber Cement (Hardie)' },
      { id: 'brick', label: 'Brick' },
      { id: 'stone', label: 'Stone Veneer' },
      { id: 'stucco', label: 'Stucco' },
    ],
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'blue', label: 'Blue', hex: '#4682B4' },
      { id: 'green', label: 'Green', hex: '#556B2F' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'brown', label: 'Brown', hex: '#8B4513' },
      { id: 'black', label: 'Black', hex: '#000000' },
      { id: 'red-brick', label: 'Red Brick', hex: '#CB4154' },
    ],
  },
  roof: {
    types: [
      { id: 'asphalt-shingle', label: 'Asphalt Shingle' },
      { id: 'metal', label: 'Metal' },
      { id: 'tile', label: 'Tile' },
      { id: 'slate', label: 'Slate' },
      { id: 'wood-shake', label: 'Wood Shake' },
    ],
    colors: [
      { id: 'charcoal', label: 'Charcoal', hex: '#36454F' },
      { id: 'black', label: 'Black', hex: '#000000' },
      { id: 'brown', label: 'Brown', hex: '#8B4513' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'terracotta', label: 'Terracotta', hex: '#E2725B' },
      { id: 'green', label: 'Green', hex: '#228B22' },
    ],
  },
};

// Helper to get renovation prompt based on selections
export function buildRenovationPrompt(
  roomType: string,
  renovationType: string,
  style: string,
  options: Record<string, string>
): string {
  const styleInfo = STYLES[style as keyof typeof STYLES];
  const roomInfo = ROOM_TYPES[roomType as keyof typeof ROOM_TYPES];
  
  let prompt = `Transform this ${roomInfo?.label || roomType} with a ${styleInfo?.label || style} style renovation. `;
  prompt += `Style characteristics: ${styleInfo?.keywords || style}. `;
  
  // Add specific renovation instructions
  switch (renovationType) {
    case 'full-remodel':
      prompt += `Complete renovation including all surfaces, fixtures, and finishes in ${style} style. `;
      break;
    case 'cabinets':
      if (options.cabinet_color) prompt += `Replace cabinets with ${options.cabinet_color} colored cabinets. `;
      if (options.cabinet_style) prompt += `Cabinet style: ${options.cabinet_style}. `;
      break;
    case 'counters':
      if (options.counter_material) prompt += `Install ${options.counter_material} countertops. `;
      if (options.counter_color) prompt += `Counter color: ${options.counter_color}. `;
      break;
    case 'flooring':
      if (options.floor_type) prompt += `Replace flooring with ${options.floor_type}. `;
      if (options.floor_color) prompt += `Floor color/finish: ${options.floor_color}. `;
      break;
    case 'paint':
      if (options.paint_color) prompt += `Paint walls in ${options.paint_color} color. `;
      if (options.paint_finish) prompt += `Paint finish: ${options.paint_finish}. `;
      break;
    case 'backsplash':
      if (options.backsplash_type) prompt += `Install ${options.backsplash_type} backsplash. `;
      if (options.backsplash_color) prompt += `Backsplash color: ${options.backsplash_color}. `;
      break;
    case 'siding':
      if (options.siding_type) prompt += `Replace siding with ${options.siding_type}. `;
      if (options.siding_color) prompt += `Siding color: ${options.siding_color}. `;
      break;
    case 'roof':
      if (options.roof_type) prompt += `Replace roof with ${options.roof_type}. `;
      if (options.roof_color) prompt += `Roof color: ${options.roof_color}. `;
      break;
  }
  
  prompt += `Maintain the room's structure and perspective. Professional real estate photography quality. Photorealistic result.`;
  
  return prompt;
}

export type RoomType = keyof typeof ROOM_TYPES;
export type RenovationType = keyof typeof RENOVATION_TYPES;
export type StyleType = keyof typeof STYLES;
