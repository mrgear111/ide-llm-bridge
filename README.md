<div align="center">
  <h1>🌉 IDE LLM Bridge</h1>
  <p><b>Liberate your Enterprise IDE's LLM and use it anywhere!</b></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
  [![OpenAI Compatible](https://img.shields.io/badge/API-OpenAI%20Compatible-blue)](https://platform.openai.com/docs/api-reference)

  *Turn locked-down agentic IDE backends (like Kiro, AWS CodeWhisperer, Copilot) into a **free, universal, local API** running on your machine.*
</div>

---

## 🤯 The Problem
You have access to a top-tier enterprise AI model (like Claude 3.5 Sonnet or GPT-4o) through an expensive or company-provided IDE subscription. But there's a catch: **you can only use it inside their specific code editor.** Want to use it in ChatbotUI? LibreChat? Your own local Python scripts? You can't.

## 🚀 The Solution
**IDE LLM Bridge** is a lightweight, universal Node.js proxy that intercepts standard OpenAI API requests from any app and invisibly tunnels them through your IDE's authenticated backend. 

**Get free API access to the exact same models powering your IDE!**

### ✨ Why this is awesome
- **100% OpenAI Compatible:** Drop-in replacement. Just change your API base URL to `http://localhost:3000/v1`.
- **Zero-Config Auth:** No more manual token copying! Our plugins dynamically extract live `accessTokens` directly from your Mac's cached credentials.
- **Universal Plugin Architecture:** Built to easily switch between IDE backends using modular Provider Adapters.
- **System Prompt Injection:** Captures standard OpenAI `system` messages and forces them into the IDE's custom history schema to override the backend's hidden instructions.

---

## 🔌 Supported Providers

Set your active provider in the `.env` file using `ACTIVE_PROVIDER=provider_name`.

| Provider Name | Status | Description |
|---|---|---|
| `kiro` | 🟢 **Active** | Supports AWS Kiro IDE. Automatically extracts tokens from `~/.aws/sso/cache` and parses AWS EventStream binary chunks. |
| `copilot` | 🟡 *Coming Soon* | Support for GitHub Copilot |
| `cursor` | 🟡 *Coming Soon* | Support for Cursor IDE |

🔥 **Want to add your favorite IDE?** See the **Contributing** section below! It's incredibly easy to build a new adapter.

---

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/mrgear111/ide-llm-bridge.git
   cd ide-llm-bridge
   npm install
   ```

2. **Configure Provider**
   Copy `.env.example` to `.env` (or just create `.env`) and set:
   ```env
   ACTIVE_PROVIDER=kiro
   ```

3. **Wake up your IDE**
   Open your target IDE (e.g., Kiro) for a few seconds to ensure your SSO token is fresh and cached.

4. **Start the Bridge!**
   ```bash
   npm start
   ```

```text
🚀 Universal IDE Proxy running on http://localhost:3000
🔌 Active Provider: [KIRO]
```

---

## 💻 How to Use It

You can now use `http://localhost:3000/v1` as your base URL in **any standard AI app** (LibreChat, Open-WebUI, Cursor, etc.).

### Python SDK
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="fake-key" # Token is handled magically by the Bridge!
)

response = client.chat.completions.create(
    model="agent", 
    messages=[{"role": "user", "content": "Write a python function to sort an array."}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

---

## ⚠️ The "Alignment" Problem (Important!)

While this bridge works perfectly for standard chat and coding assistance, **you may struggle to use it as the "brain" for autonomous agent frameworks (like Trace, AutoGPT, etc.).**

Enterprise IDE backends heavily fine-tune their models with strict, un-deletable server-side System Prompts forcing the model to maintain its identity as an "IDE Assistant." If your agent framework demands strict machine-readable formats (like JSON tool calls), the IDE backend might ignore those instructions and instead reply conversationally: *"Hi, I'm Kiro, how can I help you code today?"*

**Best Use Case:** Connect Chat UIs or simple automation scripts to get free access to top-tier coding models!

---

## 🤝 Contributing (Build a new IDE plugin!)

Want to be a hero and add support for Cursor, Copilot, or JetBrains AI? 
1. Use `mitmproxy` to intercept the target IDE's traffic.
2. Check out `providers/base-provider.js` for the template interface.
3. Create `providers/your-ide.js` implementing the `checkAuth`, `buildRequestConfig`, and `handleStream` methods to map standard OpenAI JSON to your IDE's proprietary schema.
4. Submit a Pull Request! We love contributors! ❤️

---

## 📜 License
MIT License. Free the LLMs!
