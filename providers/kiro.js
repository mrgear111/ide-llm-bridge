const fs = require('fs');
const path = require('path');
const os = require('os');
const BaseProvider = require('./base-provider');

class KiroProvider extends BaseProvider {
  constructor() {
    super();
    this.tokenPath = path.join(os.homedir(), '.aws', 'sso', 'cache', 'kiro-auth-token.json');
    this.targetUrl = process.env.IDE_TARGET_URL || "https://runtime.us-east-1.kiro.dev/generateAssistantResponse";
  }

  async checkAuth() {
    if (!fs.existsSync(this.tokenPath)) {
      throw new Error(`Kiro token file not found at ${this.tokenPath}. Please install and log into Kiro.`);
    }
    const data = fs.readFileSync(this.tokenPath, 'utf8');
    const auth = JSON.parse(data);
    
    if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
      console.warn("⚠️  WARNING: Kiro token has expired! Please open the Kiro IDE for a few seconds to refresh it.");
    }
    return auth;
  }

  buildRequestConfig(openAiBody) {
    const auth = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
    const messages = openAiBody.messages || [];
    let lastUserMessage = "";
    const kiroHistory = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (i === messages.length - 1 && msg.role !== "assistant") {
        lastUserMessage = msg.content;
        const systemMsgs = messages.filter(m => m.role === 'system');
        if (systemMsgs.length > 0 && messages.length === 1 + systemMsgs.length) {
           const sysPrompt = systemMsgs.map(m => m.content).join("\\n");
           lastUserMessage = `[SYSTEM INSTRUCTIONS: ${sysPrompt}]\\n\\n${lastUserMessage}`;
        }
        break;
      }
      if (msg.role === "system" || msg.role === "user") {
        kiroHistory.push({
          "userInputMessage": {
            "content": msg.role === "system" ? `[SYSTEM INSTRUCTIONS: ${msg.content}]\\nAdhere strictly.` : msg.content,
            "origin": "AI_EDITOR",
            "modelId": "simple-task"
          }
        });
      } else if (msg.role === "assistant") {
        kiroHistory.push({
          "assistantResponseMessage": { "content": msg.content || "", "toolUses": [] }
        });
      }
    }

    if (!lastUserMessage && messages.length > 0) {
      lastUserMessage = messages[messages.length - 1].content;
    }

    const kiroPayload = {
      "conversationState": {
        "currentMessage": {
          "userInputMessage": { "content": lastUserMessage, "origin": "AI_EDITOR", "modelId": "simple-task" }
        },
        "chatTriggerType": "MANUAL",
        "conversationId": process.env.KIRO_CONVERSATION_ID || "c0cf963f-c448-4a0e-9b17-9f1c8d6a3d35",
        "history": kiroHistory,
        "agentContinuationId": process.env.KIRO_AGENT_CONTINUATION_ID || "7b3e44f7-527d-4947-8d66-2a304c03de82",
        "agentTaskType": "vibe"
      },
      "profileArn": auth.profileArn
    };

    return {
      method: 'post',
      url: this.targetUrl,
      data: kiroPayload,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
        'x-amzn-kiro-agent-mode': 'intent-classification',
        'x-amz-user-agent': 'aws-sdk-js/1.0.39 KiroIDE-0.12.292',
        'user-agent': 'aws-sdk-js/1.0.39 ua/2.1 os/darwin#25.5.0 lang/js md/nodejs#22.22.0 api/codewhispererstreaming#1.0.39 m/N KiroIDE-0.12.292',
        'host': 'runtime.us-east-1.kiro.dev',
        'amz-sdk-invocation-id': 'af252fc0-7171-4c79-ba34-341ea268d092',
        'amz-sdk-request': 'attempt=1; max=3'
      },
      responseType: 'stream'
    };
  }

  handleStream(proxyDataStream, res) {
    let buffer = '';
    proxyDataStream.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const regex = /\{"content":"((?:[^"\\]|\\.)*)","modelId"/g;
      let match;
      let lastIndex = 0;

      while ((match = regex.exec(buffer)) !== null) {
        try {
           const parsedText = JSON.parse(`"${match[1]}"`); 
           const openAiChunk = {
             id: "chatcmpl-kiro",
             object: "chat.completion.chunk",
             created: Math.floor(Date.now() / 1000),
             model: "kiro-agent",
             choices: [{ index: 0, delta: { content: parsedText }, finish_reason: null }]
           };
           res.write(`data: ${JSON.stringify(openAiChunk)}\n\n`);
        } catch(e) {}
        lastIndex = regex.lastIndex;
      }
      if (lastIndex > 0) buffer = buffer.substring(lastIndex);
    });

    proxyDataStream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
    proxyDataStream.on('error', (err) => res.end());
  }

  handleJson(proxyDataStream, res) {
    let fullText = "";
    let buffer = '';
    proxyDataStream.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const regex = /\{"content":"((?:[^"\\]|\\.)*)","modelId"/g;
      let match;
      while ((match = regex.exec(buffer)) !== null) {
         try { fullText += JSON.parse(`"${match[1]}"`); } catch(e){}
      }
      buffer = "";
    });
    
    proxyDataStream.on('end', () => {
      res.json({
        id: "chatcmpl-kiro",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "kiro-agent",
        choices: [{ index: 0, message: { role: "assistant", content: fullText }, finish_reason: "stop" }]
      });
    });
  }
}

module.exports = KiroProvider;
