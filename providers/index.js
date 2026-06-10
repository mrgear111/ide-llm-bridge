const KiroProvider = require('./kiro');

const providers = {
  kiro: KiroProvider,
};

function getProvider(name) {
  const ProviderClass = providers[name?.toLowerCase()];
  if (!ProviderClass) {
    throw new Error(`Provider '${name}' is not supported. Supported providers: ${Object.keys(providers).join(', ')}`);
  }
  return new ProviderClass();
}

module.exports = { getProvider };
