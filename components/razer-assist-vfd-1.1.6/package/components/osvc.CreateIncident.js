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

class CreateIncident {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.CreateIncident",
      properties: {
        contactId: { type: "int", required: true },
        caseSubject: { type: "string", required: true },
        description: { type: "string", required: true },
        serialNumber: { type: "string", required: true },
      },
      supportedActions: ["created", "notCreated", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ CreateIncident Invoked ------");

    // configs from Skill
    let siteHost = conversation.variable("system.config.osvcHost");
    let apiUser = conversation.variable("system.config.osvcApiUser");
    let apiPass = conversation.variable("system.config.osvcApiPassword");

    // init
    this.rnApiClient = new ConnectRestApiClient(
      siteHost,
      apiUser,
      apiPass,
      conversation.logger()
    );

    const { contactId, caseSubject, description, serialNumber } =
      conversation.properties();

    let newSerialNumber = serialNumber.toUpperCase();

    // SysAttrib Length of Field=20
    newSerialNumber =
      newSerialNumber.length > 20
        ? newSerialNumber.substring(0, 20)
        : newSerialNumber;

    let incData = this.createNewIncidentJsonObj(
      contactId,
      caseSubject,
      description,
      newSerialNumber
    );

    conversation.logger().info("incData:" + JSON.stringify(incData));

    conversation.logger().info("------ Calling POST CreateIncident ------");

    (async () => {
      try {
        // TO DO....

        const incidentCreateResponse = await this.rnApiClient.createNewIncident(
          incData
        );

        conversation.logger().info(JSON.stringify(incidentCreateResponse));

        if (
          !this.rnApiClient.isHttpStatusCodeOk(
            incidentCreateResponse.statusCode
          )
        ) {
          conversation.logger().info("------ CreateIncident Failed ------");
          conversation.transition("notCreated");
          done();
          return;
        }

        conversation.logger().info("------ CreateIncident OK ------");

        let incId = incidentCreateResponse.crestData.id;
        let incRefNo = incidentCreateResponse.crestData.lookupName;

        if (incId > 0) {
          conversation.logger().info(`new incident id: ${incId}`);
          conversation.logger().info(`new incident refNo: ${incRefNo}`);

          // send data into dialog as vars
          conversation.variable("caseIncidentId", parseInt(incId));
          conversation.variable("caseReferenceNumber", incRefNo);

          conversation.keepTurn(true).transition("created");
          done();
        } else {
          conversation.logger().info("------ incidentId invalid! ------");
          conversation.transition("notCreated");
          done();
        }
      } catch (error) {
        conversation.logger().error(error.toString());
        conversation.keepTurn(true).transition("fail");
        done();
      }
    })();
  }

  createNewIncidentJsonObj(contactId, subject, description, serialNumber) {
    let incData = {
      primaryContact: {
        id: contactId,
      },
      subject: subject.toString(),
      threads: [
        {
          text: description.toString(),
          contentType: {
            id: 1,
          },
          entryType: {
            id: 3,
          },
        },
      ],
      customFields: {
        CO1: {
          serial_num: serialNumber.toString(),
        },
      },
    };
    return incData;
  }
}

module.exports = CreateIncident;
