/**
 * AI Director - On-device Lighting Analyzer
 * Estimates lighting quality from ambient light sensor data.
 */

export interface LightingAssessment {
  score: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  tips: string[];
}

/**
 * Assess lighting quality for real estate photography.
 *
 * @param ambientLux - Ambient light level in lux from device sensor.
 *   Typical: 0=dark, 50=dim room, 300=office, 1000=overcast, 10000+=bright sun
 * @param isExterior - Whether the shot is an exterior (outdoor) shot
 */
export function assessLighting(ambientLux: number, isExterior: boolean): LightingAssessment {
  return isExterior ? assessExteriorLighting(ambientLux) : assessInteriorLighting(ambientLux);
}

function assessExteriorLighting(lux: number): LightingAssessment {
  if (lux >= 5000) {
    return {
      score: 90,
      quality: 'excellent',
      description: 'Bright natural light',
      tips: ['Great lighting! Watch for harsh shadows if shooting midday'],
    };
  }
  if (lux >= 1000) {
    return {
      score: 95,
      quality: 'excellent',
      description: 'Ideal overcast/golden hour light',
      tips: ['Perfect soft lighting for exterior photos'],
    };
  }
  if (lux >= 300) {
    return {
      score: 70,
      quality: 'good',
      description: 'Moderate light — may need enhancement',
      tips: ['Try to capture when skies are brighter', 'AI enhancement can boost this'],
    };
  }
  if (lux >= 50) {
    return {
      score: 40,
      quality: 'fair',
      description: 'Low light — not ideal for exteriors',
      tips: ['Wait for better natural light if possible', 'Photos may appear grainy'],
    };
  }
  return {
    score: 15,
    quality: 'poor',
    description: 'Too dark for exterior photos',
    tips: ['Wait for daylight', 'Exterior photos need natural light'],
  };
}

function assessInteriorLighting(lux: number): LightingAssessment {
  if (lux >= 500) {
    return {
      score: 90,
      quality: 'excellent',
      description: 'Well-lit room',
      tips: ['Great lighting! Consider opening curtains for even more light'],
    };
  }
  if (lux >= 200) {
    return {
      score: 80,
      quality: 'good',
      description: 'Good interior lighting',
      tips: ['Turn on all lights in the room for best results'],
    };
  }
  if (lux >= 80) {
    return {
      score: 60,
      quality: 'fair',
      description: 'Dim — turn on more lights',
      tips: [
        'Turn on ALL lights in the room',
        'Open curtains and blinds',
        'AI HDR enhancement will help',
      ],
    };
  }
  if (lux >= 20) {
    return {
      score: 35,
      quality: 'poor',
      description: 'Very dim — needs more light',
      tips: [
        'Turn on every light source available',
        'Open all curtains and blinds',
        'Move lamps into the room if possible',
      ],
    };
  }
  return {
    score: 10,
    quality: 'poor',
    description: 'Too dark — photos will be unusable',
    tips: [
      'This room needs much more light',
      'Turn on all lights and open all windows',
      'Consider coming back when natural light is available',
    ],
  };
}
