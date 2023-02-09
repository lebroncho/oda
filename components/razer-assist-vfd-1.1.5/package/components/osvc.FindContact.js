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

class FindContact {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.FindContact",
      properties: {
        userEmail: { type: "string", required: true },
        sessionId: { type: "string", required: false },
      },
      supportedActions: ["found", "notFound", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ FindContact Invoked ------");

    let crestHost = conversation.variable("system.config.osvcHost");
    let crestUser = conversation.variable("system.config.osvcApiUser");
    let crestPass = conversation.variable("system.config.osvcApiPassword");

    conversation.logger().info("sessionId1: " + conversation.sessionId());
    conversation
      .logger()
      .info("sessionId2: " + conversation.properties().sessionId);

    // conversation.logger().info("FindContact channel: "+conversation.channelId());
    // conversation.logger().info("FindContact session: "+conversation.sessionId());
    // conversation.logger().info(JSON.stringify(conversation));

    conversation
      .logger()
      .info(
        "SysConfigs for API: " + crestHost + "|" + crestUser + "|" + crestPass
      );

    this.rnApiClient = new ConnectRestApiClient(
      crestHost,
      crestUser,
      crestPass,
      conversation.logger()
    );

    conversation.logger().info("------ Calling FindContact By Email ------");

    this.rnApiClient
      .getContactByEmail(conversation.properties().userEmail)
      .then((contactQueryResponse) => {
        conversation.logger().info(JSON.stringify(contactQueryResponse));

        if (
          !this.rnApiClient.isHttpStatusCodeOk(contactQueryResponse.statusCode)
        ) {
          conversation.logger().info("------ FindContact Failed ------");
          conversation.keepTurn(true).transition("fail");
          done();
          return;
        }

        conversation.logger().info("------ FindContact OK ------");

        // init
        var contactId = 0;

        // if we found a contact, get the ID
        contactQueryResponse.crestData.items.forEach(function (i) {
          contactId = i.id;
        });

        // existing contact
        if (contactId > 0) {
          conversation.logger().info("contactId: " + contactId);

          //conversation.reply({text: "OK, I found you at contact ID " + contactId});
          conversation.variable("contactId", parseInt(contactId));

          conversation.keepTurn(true).transition("found");
          done();
        }
        // new contact
        else {
          conversation
            .logger()
            .info("------ email not found, need to create a contact! ------");
          conversation.keepTurn(true).transition("notFound");
          done();
        }
      })
      .catch((error) => {
        conversation.logger().error(error.toString());
        conversation.keepTurn(true).transition("fail");
        done();
      });
  }
}

module.exports = FindContact;
