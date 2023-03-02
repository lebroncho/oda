/* * *******************************************************************************************
 *  Copyright (c) 2020 Oracle Corporation. All rights reserved.
 ***********************************************************************************************
 *  Oracle Digital Assistant: Custom Component
 *  author: robert.surujbhan@oracle.com
 * *********************************************************************************************
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ****************************************************************************************** */

"use strict";

const ChatRestApiClient = require("../lib/ChatRestApiClient");

class UpdateQuestionOnChat {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.UpdateQuestionOnChat",
      properties: {
        newChatQuestion: { type: "string", required: true },
        chatSessionId: { type: "string", required: true },
      },
      supportedActions: ["questionUpdatedOnChat", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ UpdateQuestionOnChat Invoked ------");

    // configs from Skill
    let siteHost = conversation.variable("system.config.osvcHost");
    let apiUser = conversation.variable("system.config.osvcApiUser");
    let apiPass = conversation.variable("system.config.osvcApiPassword");

    let reportIdForChatSessionLookup = conversation.variable(
      "system.config.reportIdForChatSessionLookup"
    );
    let integrationUserAccountId = conversation.variable(
      "system.config.integrationUserAccountId"
    );

    // init
    this.chatApiClient = new ChatRestApiClient(
      apiUser,
      apiPass,
      conversation.logger()
    );

    const { newChatQuestion, chatSessionId } = conversation.properties();

    (async () => {
      try {
        const accountId = parseInt(integrationUserAccountId);

        let chatIdLookupReq = {
          id: parseInt(reportIdForChatSessionLookup),
          filters: [
            {
              name: "session ID",
              values: chatSessionId.toString(),
            },
          ],
        };

        const chatIdLookup = await this.chatApiClient.request(
          siteHost,
          "/services/rest/connect/latest/analyticsReportResults",
          "chat id lookup",
          "POST",
          chatIdLookupReq
        );
        conversation.logger().info(chatIdLookup);

        let reportData = JSON.parse(chatIdLookup);
        let firstRow = reportData.rows[0];
        // first idx
        let chatId = firstRow[0];
        conversation.logger().info("max chat ID from report:" + chatId);

        conversation.logger().info("---serviceSettings---");
        const serviceSettings = await this.chatApiClient.request(
          siteHost,
          "/services/rest/crossChannelServices/latest/serviceSettings/1",
          "get chat server settings"
        );
        conversation.logger().info(serviceSettings);
        const siteName = JSON.parse(serviceSettings).siteName;
        const pool = JSON.parse(serviceSettings).pool;
        const chatServerDomain = JSON.parse(serviceSettings).domain;
        conversation.logger().info("------");

        conversation.logger().info("---agentTokens---");
        const agentToken = await this.chatApiClient.request(
          siteHost,
          "/services/rest/crossChannelServices/latest/agentTokens",
          "get agent token",
          "POST",
          {}
        );
        conversation.logger().info(agentToken);
        const agentSessionToken = JSON.parse(agentToken).sessionToken;
        conversation.logger().info("------");

        conversation.logger().info("---createAutomatedAgentSession---");
        const createAutomatedAgentSessionPath = `/engagement/api/agent/${siteName}/v1/createAutomatedAgentSession?pool=${pool}`;
        const agentSession = await this.chatApiClient.request(
          chatServerDomain,
          createAutomatedAgentSessionPath,
          "start agent chat session",
          "POST",
          { logonOverride: true },
          agentSessionToken
        );
        conversation.logger().info(agentSession);
        const jSessionId = JSON.parse(agentSession).sessionId;
        conversation.logger().info("------");

        conversation.logger().info("---setEngagementProperty---");
        const setEngagementPropertyPath = `/engagement/api/agent/${siteName}/v1/setEngagementProperty?pool=${pool}`;
        let setQuestionReq = {
          engagementId: parseInt(chatId),
          type: "USER",
          name: "QUESTION",
          value: newChatQuestion.toString(),
        };
        const setQuestion = await this.chatApiClient.request(
          chatServerDomain,
          setEngagementPropertyPath,
          "change chat question",
          "POST",
          setQuestionReq,
          agentSessionToken,
          jSessionId,
          accountId
        );
        conversation.logger().info(setQuestion);
        conversation.logger().info("------");

        conversation.logger().info("---logoff---");
        const logOffPath = `/engagement/api/agent/${siteName}/v1/logoff?pool=${pool}`;
        const agentLogOff = await this.chatApiClient.request(
          chatServerDomain,
          logOffPath,
          "end agent chat session",
          "POST",
          { forceLogoff: true },
          agentSessionToken,
          jSessionId,
          accountId
        );
        conversation.logger().info(agentLogOff);
        conversation.logger().info("------");

        conversation.keepTurn(true).transition("questionUpdatedOnChat");
        done();
      } catch (error) {
        conversation.logger().error(error.toString());
        conversation.keepTurn(true).transition("fail");
        done();
      }
    })();
  }
}

module.exports = UpdateQuestionOnChat;
