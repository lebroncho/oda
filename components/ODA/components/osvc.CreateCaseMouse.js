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

const Https = require("https");

class CreateCaseMouse {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.CreateCaseMouse",
      properties: {
        contactId: { type: "int", required: true },
        caseSubject: { type: "string", required: true },
        problemId: { type: "string", required: true },
        categoryId: { type: "string", required: true },
        rmaNumber: { type: "string", required: true },
        orderNumber: { type: "string", required: true },
        serialNumber: { type: "string", required: true },
        productNumber: { type: "string", required: true },
        issue: { type: "string", required: true },
        region: { type: "string", required: true },
        chatSessionId: { type: "string", required: true },
        fileLocalFName: { type: "string", required: true },
        fileUserFName: { type: "string", required: true },
        fileContentType: { type: "string", required: true },
        deviceSymptoms: { type: "string", required: true },
        deviceConnection: { type: "string", required: true },
        deviceTsSteps: { type: "string", required: true },
        deviceUpdated: { type: "string", required: true },
        deviceOccurrence: { type: "string", required: true },
        rmaType: {type: "string", required: true },
        rmaPhone: {type: "string", required: true },
        rmaShippingAddress: {type: "string", required: true },
        rmaBillingAddress: {type: "string", required: true },
        rmaPurchaseDate: {type: "string", required: true },
        rmaPurchasePlace: {type: "string", required: true },
        rmaCountry: {type: "string", required: true },
        rmaZipPostal: {type: "string", required: true },
        rmaStateProvince: {type: "string", required: true },
        rmaCity: {type: "string", required: true },
        rmaStreetAddress: {type: "string", required: true },
        rmaFile: {type: "string", required: true },
        rmaFileTitle: {type: "string", required: true },
        rmaFileType: {type: "string", required: true },
        issueDescription: { type: "string", required: true }
      },
      supportedActions: ["created", "notCreated", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ CreateCaseMouse Invoked ------");

    let siteHost = conversation.variable("system.config.osvcHost");
    let scriptPath = conversation.variable("system.config.caseMouseProcessorScript");
    const options = {
      hostname: siteHost,
      port: 443,
      path: scriptPath,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    conversation.logger().info("hostname " + options.hostname);
    conversation.logger().info("path " + options.path);

    var dataResponse = "";

    const req = Https.request(options, (res) => {
      conversation.logger().info("statusCode:", res.statusCode);
      conversation.logger().info("headers:", res.headers);

      res.on("data", (d) => {
        conversation.logger().info("response received ");
        dataResponse = dataResponse + d;
      });

      res.on("end", () => {
        conversation
          .logger()
          .info("id returned: " + JSON.parse(dataResponse).id);
        conversation
          .logger()
          .info("refNo returned: " + JSON.parse(dataResponse).refNo);
        conversation.variable(
          "caseReferenceNumber",
          JSON.parse(dataResponse).refNo
        );
        conversation.variable("caseIncidentId", JSON.parse(dataResponse).id);

        conversation.transition("created");
        conversation.keepTurn(true);
        done();
        return;
      });
    });

    req.on("error", (e) => {
      conversation.logger().info("Problem calling API:" + e);
      conversation.transition("error");
      done();
    });

    let caseData = {};
    caseData.c_id = conversation.properties().contactId;
    caseData.case_subject = conversation.properties().caseSubject;
    caseData.problem_id = conversation.properties().problemId;
    caseData.category_id = conversation.properties().categoryId;
    caseData.rma_number = conversation.properties().rmaNumber;
    caseData.order_number = conversation.properties().orderNumber;
    caseData.serial_number = conversation.properties().serialNumber;
    caseData.product_number = conversation.properties().productNumber;
    caseData.issue = conversation.properties().issue;
    caseData.region = conversation.properties().region;
    caseData.chat_session_id = conversation.properties().chatSessionId;
    // file attachment
    caseData.file_local_fname = conversation.properties().fileLocalFName;
    caseData.file_user_fname = conversation.properties().fileUserFName;
    caseData.file_content_type = conversation.properties().fileContentType;
    caseData.deviceSymptoms = conversation.properties().deviceSymptoms;
    caseData.deviceConnection = conversation.properties().deviceConnection;
    caseData.deviceTsSteps = conversation.properties().deviceTsSteps;
    caseData.deviceUpdated = conversation.properties().deviceUpdated;
    caseData.deviceOccurrence = conversation.properties().deviceOccurrence;
    caseData.rmaType = conversation.properties().rmaType;
    caseData.rmaPhone = conversation.properties().rmaPhone;
    caseData.rmaShippingAddress = conversation.properties().rmaShippingAddress;
    caseData.rmaBillingAddress = conversation.properties().rmaBillingAddress;
    caseData.rmaPurchaseDate = conversation.properties().rmaPurchaseDate;
    caseData.rmaPurchasePlace = conversation.properties().rmaPurchasePlace;
    caseData.rmaCountry = conversation.properties().rmaCountry;
    caseData.rmaZipPostal = conversation.properties().rmaZipPostal;
    caseData.rmaStateProvince = conversation.properties().rmaStateProvince;
    caseData.rmaCity = conversation.properties().rmaCity;
    caseData.rmaStreetAddress = conversation.properties().rmaStreetAddress;
    caseData.rmaFile = conversation.properties().rmaFile;
    caseData.rmaFileTitle = conversation.properties().rmaFileTitle;
    caseData.rmaFileType = conversation.properties().rmaFileType;
    caseData.issueDescription = conversation.properties().issueDescription;
    
    let jsonPayload = JSON.stringify(caseData);

    conversation.logger().info("json payload: " + jsonPayload);
    conversation.logger().info("sending request ... ");

    req.write(jsonPayload);

    req.end();

    return;
  }
}

module.exports = CreateCaseMouse;
