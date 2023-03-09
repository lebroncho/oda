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

class SetContactForChat {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.SetContactForChat",
      properties: {
        contactId: { type: "int", required: true },
        webIncidentTypeId: { type: "int", required: true },
      },
      supportedActions: ["contactSetForChat", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ SetContactForChat Invoked ------");

    // configs from Skill
    let siteHost = conversation.variable("system.config.osvcHost");
    let apiUser = conversation.variable("system.config.osvcApiUser");
    let apiPass = conversation.variable("system.config.osvcApiPassword");

    // init
    this.chatApiClient = new ChatRestApiClient(
      apiUser,
      apiPass,
      conversation.logger()
    );

    const { contactId, webIncidentTypeId } = conversation.properties();

    (async () => {
      try {
        let contactUpdateReq = {
          customFields: {
            c: {
              web_incident_type: {
                id: parseInt(webIncidentTypeId),
              },
            },
          },
        };

        let contactUpdateEndpoint = `/services/rest/connect/latest/contacts/${contactId}`;

        const contactUpdate = await this.chatApiClient.request(
          siteHost,
          contactUpdateEndpoint,
          "update contact",
          "PATCH",
          contactUpdateReq
        );
        conversation.logger().info(contactUpdate);

        conversation.keepTurn(true).transition("contactSetForChat");
        done();
      } catch (error) {
        conversation.logger().error(error.toString());
        conversation.keepTurn(true).transition("fail");
        done();
      }
    })();
  }
}

module.exports = SetContactForChat;
