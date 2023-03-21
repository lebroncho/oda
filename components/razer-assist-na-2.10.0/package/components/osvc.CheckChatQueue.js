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
const util = require("util");

class CheckChatQueue {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.CheckChatQueue",
      properties: {
        webIncidentTypeId: { type: "int", required: true },
      },
      supportedActions: [
        "chatAvailable",
        "chatUnavailableHours",
        "chatUnavailableMaxQueue",
        "fail",
      ],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ CheckChatQueue Invoked ------");

    // configs from Skill
    let siteHost = conversation.variable("system.config.osvcHost");
    let apiUser = conversation.variable("system.config.osvcApiUser");
    let apiPass = conversation.variable("system.config.osvcApiPassword");
    // chat specific configs
    let chatServerHost = conversation.variable("system.config.chatServerHost");
    let chatServerFqSiteName = conversation.variable(
      "system.config.chatServerFqSiteName"
    );
    let defaultMaxQueueSize = conversation.variable(
      "system.config.defaultMaxQueueSize"
    );

    // init
    this.chatApiClient = new ChatRestApiClient(
      apiUser,
      apiPass,
      conversation.logger()
    );

    // order suport = 55 - RZC EN CS L1 (id 201)
    // peripherals = 58 - RZC NA TS L1 (id 202)
    // laptop/system = 57 - RZC NA TS L1.5 (203)
    // hoops applies to NA TS only

    const { webIncidentTypeId } = conversation.properties();
    conversation.logger().info("webIncidentTypeId: " + webIncidentTypeId);

    (async () => {
      try {
        let checkHours = false;
        let queueId = 0;

        switch (webIncidentTypeId) {
          case 332:
            queueId = 201;
            break;
          case 335:
            queueId = 202;
            checkHours = true;
            break;
          case 334:
            queueId = 203;
            checkHours = true;
            break;
          case 428:
            queueId = 325;
            checkHours = true;
            break;
          default:
            conversation.logger().error("unknown webIncidentTypeId - exiting");
            conversation.transition("fail");
            done();
            return;
        }
        conversation.logger().info("checkHours: " + checkHours);
        conversation.logger().info("queueId: " + queueId);

        if (checkHours) {
          conversation.logger().info("checking hours");

          var ptTime = new Date().toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
          });
          var d = new Date(ptTime);
          let minsNow = d.getHours() * 60 + d.getMinutes();
          let minsStart = this.getMinutes("06:00");
          let minsEnd = this.getMinutes("22:00");

          conversation.variable(
            "timeData",
            "start:" + minsStart + "|end:" + minsEnd + "|now:" + minsNow
          );

          if (!this.isWithinOperatingHours(minsNow, minsStart, minsEnd)) {
            conversation.transition("chatUnavailableHours");
            done();
            return;
          } else {
            conversation.logger().info("hours OK");
          }
        }

        if (queueId > 0) {
          conversation.logger().info("checking queue ID: " + queueId);

          conversation.logger().info("---START Chat.MaxQueue CBO---");

          let getMaxQueueEndpoint = `/services/rest/connect/latest/Chat.MaxQueue?q=QueueId=${queueId}&fields=MaxQueueSize&links=self`;
          conversation
            .logger()
            .info("getMaxQueueEndpoint: " + getMaxQueueEndpoint);

          const maxQueueResp = await this.chatApiClient.request(
            siteHost,
            getMaxQueueEndpoint,
            "oda-sdk Chat.MaxQueue"
          );
          conversation
            .logger()
            .info("maxQueueResp: " + JSON.stringify(maxQueueResp));

          // uses defaultMaxQueueSize if CBO query returns empty
          const maxQueueSize =
            JSON.parse(maxQueueResp).items.length === 1
              ? JSON.parse(maxQueueResp).items[0].MaxQueueSize
              : parseInt(defaultMaxQueueSize);
          conversation.logger().info("maxQueueSize: " + maxQueueSize);

          conversation.logger().info("---END Chat.MaxQueue CBO---");

          conversation.logger().info("---START getQueueStats---");

          let statsReqArr = {};
          statsReqArr.chatProactiveAvailableType = "AGENTS";
          statsReqArr.queueId = queueId;
          conversation
            .logger()
            .info("statsReqArr: " + JSON.stringify(statsReqArr));

          let queueStatsReq = encodeURIComponent(JSON.stringify(statsReqArr));
          conversation.logger().info("queueStatsReq: " + queueStatsReq);

          let getQueueStatsEndpoint = util.format(
            "/engagement/api/consumer/%s/v1/getQueueStats?request=%s",
            chatServerFqSiteName,
            queueStatsReq
          );
          conversation
            .logger()
            .info("getQueueStatsEndpoint: " + getQueueStatsEndpoint);

          const getQueueStatsResp = await this.chatApiClient.request(
            chatServerHost,
            getQueueStatsEndpoint,
            "getQueueStats"
          );
          conversation
            .logger()
            .info("getQueueStatsResp: " + JSON.stringify(getQueueStatsResp));

          const engagementsInQueue =
            JSON.parse(getQueueStatsResp).engagementsInQueue;
          conversation
            .logger()
            .info("engagementsInQueue: " + engagementsInQueue);

          conversation.variable("engagementsInQueue", engagementsInQueue);

          conversation.logger().info("---END getQueueStats---");

          let chatAvailable = engagementsInQueue <= maxQueueSize ? true : false;
          conversation.logger().info("chatAvailable: " + chatAvailable);

          if (chatAvailable) {
            conversation.transition("chatAvailable");
            done();
          } else {
            conversation.transition("chatUnavailableMaxQueue");
            done();
          }
        } //queueId
      } catch (error) {
        conversation.logger().error(error.toString());
        conversation.keepTurn(true).transition("fail");
        done();
      }
    })();
  }

  isWithinOperatingHours(now, start, end) {
    return now > start && now < end;
  }

  getMinutes(str) {
    var time = str.split(":");
    return time[0] * 60 + time[1] * 1;
  }
}

module.exports = CheckChatQueue;
