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

class CreateContact {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.CreateContact",
      properties: {
        userEmail: { type: "string", required: true },
        userFirstName: { type: "string", required: true },
        userLastName: { type: "string", required: true },
      },
      supportedActions: ["created", "notCreated", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ CreateContact Invoked ------");

    let crestHost = conversation.variable("system.config.osvcHost");
    let crestUser = conversation.variable("system.config.osvcApiUser");
    let crestPass = conversation.variable("system.config.osvcApiPassword");

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

    var contactData = this.createNewContactJsonObj(
      conversation.properties().userFirstName,
      conversation.properties().userLastName,
      conversation.properties().userEmail
    );

    conversation.logger().info("contactData:" + JSON.stringify(contactData));

    conversation.logger().info("------ Calling POST CreateContact ------");

    this.rnApiClient
      .createNewContact(contactData)
      .then((contactCreateResponse) => {
        conversation.logger().info(JSON.stringify(contactCreateResponse));

        if (
          !this.rnApiClient.isHttpStatusCodeOk(contactCreateResponse.statusCode)
        ) {
          conversation.logger().info("------ CreateContact Failed ------");
          conversation.transition("notCreated");
          done();
          return;
        }

        conversation.logger().info("------ CreateContact OK ------");

        var contactId = contactCreateResponse.crestData.id;

        // new contact
        if (contactId > 0) {
          conversation.logger().info("contactId: " + contactId);

          conversation.variable("contactId", parseInt(contactId));

          conversation.transition("created");
          done();
        } else {
          conversation.logger().info("------ contactId invalid! ------");
          conversation.transition("notCreated");
          done();
        }
      })
      .catch((error) => {
        conversation.logger().error(error.toString());
        conversation.transition("fail");
        done();
      });
  }

  createNewContactJsonObj(firstName, lastName, emailAddress) {
    var contactData = {
      name: {
        first: firstName,
        last: lastName,
      },
      emails: [
        {
          address: emailAddress,
          addressType: {
            id: 0,
          },
        },
      ],
    };

    return contactData;
  }
}

module.exports = CreateContact;
