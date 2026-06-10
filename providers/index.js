const KiroProvider = require('./kiro');

// Future providers can be added here
const providers = {
  kiro: KiroProvider,
  // copilot: CopilotProvider,
  // cursor: CursorProvider
};

function getProvider(name) {
  const ProviderClass = providers[name?.toLowerCase()];
  if (!ProviderClass) {
    throw new Error(`Provider '${name}' is not supported. Supported providers: ${Object.keys(providers).join(', ')}`);
  }
  return new ProviderClass();
}

module.exports = { getProvider };
