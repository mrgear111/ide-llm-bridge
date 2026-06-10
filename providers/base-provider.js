class BaseProvider {
  async checkAuth() {
    throw new Error("Not implemented");
  }

  buildRequestConfig(openAiBody) {
    throw new Error("Not implemented");
  }

  handleStream(proxyDataStream, res) {
    throw new Error("Not implemented");
  }

  handleJson(proxyDataStream, res) {
    throw new Error("Not implemented");
  }
}

module.exports = BaseProvider;
