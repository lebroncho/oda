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

class CreateCaseRMA {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.CreateCaseRMA",
      properties: {
        contactId: { type: "int", required: true },
        caseSubject: { type: "string", required: true },
        orderNumber: { type: "string", required: true },
        serialNumber: { type: "string", required: true },
        productNumber: { type: "string", required: true },
        placeOfPurchase: { type: "string", required: true },
        description: { type: "string", required: true },
        chatSessionId: { type: "string", required: true },
        rmaType: { type: "string", required: true },
        fileLocalFName: { type: "string", required: true },
        fileUserFName: { type: "string", required: true },
        fileContentType: { type: "string", required: true },
        region: { type: "string", required: true },
        type: { type: "string", required: true },
      },
      supportedActions: ["created", "notCreated", "fail"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ CreateCaseRMA Invoked ------");

    // const { fileUrl, fileType, fileTitle} = conversation.properties();
    // conversation.logger().info("fileUrl: "+fileUrl);
    // conversation.logger().info("fileType: "+fileType);
    // conversation.logger().info("fileTitle: "+fileTitle);

    // var filePromise = new Promise((resolve, reject) => {

    //     conversation.logger().info("filePromise getting: "+fileUrl);

    //     Https.get(fileUrl, (resp) => {
    //         resp.setEncoding('base64');
    //         //let data = '';
    //         let data = "data:" + resp.headers["content-type"] + ";base64,";

    //         // A chunk of data has been recieved.
    //         resp.on('data', (chunk) => {
    //             data += chunk;
    //         });

    //         // The whole response has been received. Print out the result.
    //         resp.on('end', () => {
    //             conversation.logger().info("filePromise DONE");
    //             //conversation.logger().info(data);
    //             //var base64Val = new Buffer(data).toString('base64');
    //             var message = {};
    //             resolve(data);
    //         });
    //     }).on("error", (err) => {
    //         reject(err);
    //         conversation.logger().info("Error: " + err.message);
    //     });
    // });

    // filePromise.then((message) => {
    //conversation.logger().info('message = ' + message);

    //debug
    // conversation.transition("created");
    // conversation.keepTurn(true);
    // done();
    // return;

    let siteHost = conversation.variable("system.config.osvcHost");
    let scriptPath = conversation.variable(
      "system.config.rmaCaseProcessorScript"
    );
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
      res.on("data", (d) => {
        conversation.logger().info("response received " + d);
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
        //conversation.reply("Your Case Reference Number: " + (JSON.parse(dataResponse)).refNo);
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

    let rmaCaseData = {};
    rmaCaseData.c_id = conversation.properties().contactId;
    rmaCaseData.case_subject = conversation.properties().caseSubject;
    rmaCaseData.order_number = conversation.properties().orderNumber;
    rmaCaseData.serial_number = conversation.properties().serialNumber;
    rmaCaseData.product_number = conversation.properties().productNumber;
    rmaCaseData.place_of_purchase = conversation.properties().placeOfPurchase;
    rmaCaseData.description = conversation.properties().description;
    rmaCaseData.chat_session_id = conversation.properties().chatSessionId;
    rmaCaseData.rma_type = conversation.properties().rmaType;
    rmaCaseData.region = conversation.properties().region;
    // file attachment
    rmaCaseData.file_local_fname = conversation.properties().fileLocalFName;
    rmaCaseData.file_user_fname = conversation.properties().fileUserFName;
    rmaCaseData.file_content_type = conversation.properties().fileContentType;
    rmaCaseData.type = conversation.properties().type;

    let jsonPayload = JSON.stringify(rmaCaseData);

    conversation.logger().info("json payload: " + jsonPayload);
    conversation.logger().info("sending request ... ");

    req.write(jsonPayload);

    req.end();

    return;

    // }).catch(e => {
    //     conversation.logger().error('error = ' + JSON.stringify(e));
    // });
  }
}

module.exports = CreateCaseRMA;
