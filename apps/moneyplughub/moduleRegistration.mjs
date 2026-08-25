import { checkPaywall } from './api/paywall.js';
import { subscribe } from './api/billing.js';
import { buyPoints } from './api/sigil.js';

export function registerModule(loader) {
  const moduleConfig = {
    name: 'moneyplughub',
    routes: [
      { method: 'GET', path: '/api/paywall/check', handler: checkPaywall },
      { method: 'POST', path: '/api/billing/subscribe', handler: subscribe },
      { method: 'POST', path: '/api/sigil/points/buy', handler: buyPoints }
    ]
  };

  if (loader && typeof loader.registerModule === 'function') {
    loader.registerModule(moduleConfig);
  }
  return moduleConfig;
}

export default registerModule;
