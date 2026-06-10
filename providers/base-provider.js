/**
 * BaseProvider serves as an interface and template for all IDE LLM adapters.
 * Anyone contributing a new IDE adapter (e.g. Copilot, Cursor) should export these functions.
 */

class BaseProvider {
  /**
   * Called on startup to ensure the provider has valid authentication.
   * Should throw an error or return false if tokens are missing/expired.
   */
  async checkAuth() {
    throw new Error("Not implemented");
  }

  /**
   * Takes a standard OpenAI /v1/chat/completions JSON body and translates
   * it into the specific proprietary payload required by the IDE's backend.
   * 
   * @param {Object} openAiBody - The parsed JSON body from the client (e.g. { messages: [...] })
   * @returns {Object} - The exact config required for an Axios request { url, method, headers, data, responseType }
   */
  buildRequestConfig(openAiBody) {
    throw new Error("Not implemented");
  }

  /**
   * Handles the streaming response from the IDE's backend.
   * Must parse the backend's data format (e.g. SSE, AWS EventStream, gRPC) 
   * and write standard OpenAI SSE chunks (`data: {...}\n\n`) to the express `res` object.
   * 
   * @param {Stream} proxyDataStream - The raw stream from Axios (response.data)
   * @param {Express.Response} res - The Express response object to write back to the client
   */
  handleStream(proxyDataStream, res) {
    throw new Error("Not implemented");
  }

  /**
   * Handles a non-streaming (blocking) response from the IDE's backend.
   * Must parse the backend's data format and return a standard OpenAI JSON object.
   * 
   * @param {Stream} proxyDataStream - The raw stream from Axios (response.data)
   * @param {Express.Response} res - The Express response object to return JSON
   */
  handleJson(proxyDataStream, res) {
    throw new Error("Not implemented");
  }
}

module.exports = BaseProvider;
