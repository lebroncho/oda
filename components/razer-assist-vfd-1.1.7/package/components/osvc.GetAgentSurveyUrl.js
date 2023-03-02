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

const ConnectRestApiClient = require("../lib/ConnectRestApiClient");
const util = require("util");

class GetAgentSurveyUrl {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.GetAgentSurveyUrl",
      properties: {
        chatId: { type: "string", required: true },
      },
      supportedActions: ["surveyUrlGenerated", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ GetAgentSurveyUrl Invoked ------");

    let crestHost = conversation.variable("system.config.osvcHost");
    let crestUser = conversation.variable("system.config.osvcApiUser");
    let crestPass = conversation.variable("system.config.osvcApiPassword");
    let agentSurveyUrlBase = conversation.variable(
      "system.config.surveyUrlAgent"
    );
    let reportIdForChatLookup = conversation.variable(
      "system.config.reportIdForChatLookup"
    );

    const { chatId } = conversation.properties();

    conversation
      .logger()
      .info(
        "SysConfigs for API:" + crestHost + "|" + crestUser + "|" + crestPass
      );

    this.rnApiClient = new ConnectRestApiClient(
      crestHost,
      crestUser,
      crestPass,
      conversation.logger()
    );

    var reportData = this.createReportDataJsonObj(
      parseInt(reportIdForChatLookup),
      chatId
    );

    conversation.logger().info("reportData:" + JSON.stringify(reportData));

    conversation.logger().info("------ Calling POST RunAnalyticsReport ------");

    this.rnApiClient
      .runAnalyticsReport(reportData)
      .then((reportDataResponse) => {
        conversation.logger().info(JSON.stringify(reportDataResponse));

        if (
          !this.rnApiClient.isHttpStatusCodeOk(reportDataResponse.statusCode)
        ) {
          conversation.logger().info("------ RunAnalyticsReport Failed ------");
          conversation.transition("fail");
          done();
          return;
        }

        conversation.logger().info("------ RunAnalyticsReport OK ------");

        var firstRow = reportDataResponse.crestData.rows[0];
        conversation.logger().info("firstRow: " + JSON.stringify(firstRow));

        // second idx
        let agentId = firstRow[1];

        if (this.isEmpty(agentId)) {
          conversation.logger().info("------ agentId invalid! ------");
          conversation.transition("fail");
          done();
          return;
        }

        let finalAgentSurveyUrl = util.format(
          agentSurveyUrlBase + "?chat_id=%s&p_acct_id=%s",
          chatId,
          agentId
        );
        conversation
          .logger()
          .info("finalAgentSurveyUrl: " + finalAgentSurveyUrl);

        conversation.variable("finalAgentSurveyUrl", finalAgentSurveyUrl);

        conversation.transition("surveyUrlGenerated");
        done();
      })
      .catch((error) => {
        conversation.logger().error(error.toString());
        conversation.transition("fail");
        done();
      });
  }

  createReportDataJsonObj(reportId, chatId) {
    var reportData = {
      id: reportId,
      filters: [
        {
          name: "chat ID",
          values: chatId.toString(),
        },
      ],
    };
    return reportData;
  }

  isEmpty(str) {
    return !str || 0 === str.length || str === undefined;
  }
}

module.exports = GetAgentSurveyUrl;
