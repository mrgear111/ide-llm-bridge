require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { getProvider } = require('./providers');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACTIVE_PROVIDER_NAME = process.env.ACTIVE_PROVIDER || 'kiro';

let activeProvider;
try {
  activeProvider = getProvider(ACTIVE_PROVIDER_NAME);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const isStreaming = req.body.stream === true;
    console.log(`[PROXY] Intercepted chat request. Routing to ${ACTIVE_PROVIDER_NAME.toUpperCase()} provider...`);

    // 1. Check Authentication
    try {
      await activeProvider.checkAuth();
    } catch (authErr) {
      return res.status(401).json({ error: { message: "Authentication Failed", details: authErr.message } });
    }

    // 2. Build the Provider-Specific Request Configuration
    const requestConfig = activeProvider.buildRequestConfig(req.body);

    // 3. Forward the Request to the IDE Backend
    const response = await axios(requestConfig);

    // 4. Handle the Response Stream based on the Provider's custom parsing logic
    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      activeProvider.handleStream(response.data, res);
    } else {
      activeProvider.handleJson(response.data, res);
    }
    
  } catch (error) {
    console.error("[PROXY] Request failed:", error.message);
    if (error.response && error.response.status === 403) {
      console.error(`-> Token likely expired. Please check the ${ACTIVE_PROVIDER_NAME} auth mechanism.`);
    }
    res.status(500).json({ error: { message: "Internal Proxy Error", details: error.message } });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Universal IDE Proxy running on http://localhost:${PORT}`);
  console.log(`🔌 Active Provider: [${ACTIVE_PROVIDER_NAME.toUpperCase()}]`);
});
