import { MLSProvider } from './types';
import { SimplyRETSProvider } from './simplyrets';

const providers: Record<string, () => MLSProvider> = {
  simplyrets: () => new SimplyRETSProvider(),
};

export function getMLSProvider(name: string = 'simplyrets'): MLSProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Unknown MLS provider: ${name}`);
  }
  return factory();
}
