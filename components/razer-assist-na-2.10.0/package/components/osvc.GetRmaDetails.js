/* * *******************************************************************************************
 *  Copyright (c) 2021 Oracle Corporation. All rights reserved.
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

class GetRmaDetails {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.GetRmaDetails",
      properties: {
        variable: { type: "string", required: true },
        rmaNumber: { type: "string", required: true },
        userEmail: { type: "string", required: true },
        clientLanguage: { type: "string", required: true },
      },
      supportedActions: [
        "rmaNumberFormatInvalid",
        "rmaFound",
        "rmaNotFound",
        "fail",
      ],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ GetRmaDetails Invoked ------");

    const { variable, rmaNumber, userEmail, clientLanguage } =
      conversation.properties();

    const regex = RegExp(/^rzc-\d{7}$/i);

    conversation.logger().info(`regex testing rma number ${rmaNumber}`);

    if (!regex.test(rmaNumber)) {
      conversation.logger().info("regex test failed");
      conversation.transition("rmaNumberFormatInvalid");
      done();
      return;
    }

    conversation.logger().info("regex test OK");

    // get 123456 from RZC-0123456
    let rmaNumberPieces = rmaNumber.split("-");
    const rmaId = parseInt(rmaNumberPieces[1]);

    conversation.logger().info(`rma id via split: ${rmaId}`);

    conversation.logger().info(`received lang/locale ${clientLanguage}`);

    // consider the first two chars only - get "en" from "en_US" or "EN_US"
    let clientLangCode = clientLanguage.substring(0, 2).toLowerCase();

    conversation.logger().info(`clientLangCode2charsL: ${clientLangCode}`);

    // OSvC language codes
    // 1    en_US   English (US)
    // 3    de_DE   German
    // 6    es_ES   Spanish
    // 9    fr_FR   French
    // 10   it_IT   Italian
    // 11   ja_JP   Japanese
    // 12   nl_NL   Dutch
    // 15   pl_PL   Polish
    // 17   zh_CN   Simplified Chinese
    // 18   zh_TW   Traditional Mandarin
    // 20   ko_KR   Korean
    // 39   pt_PT   Portuguese
    let languages = [
      { id: 1, language: "en_US", name: "English (US)" },
      { id: 3, language: "de_DE", name: "German" },
      { id: 6, language: "es_ES", name: "Spanish" },
      { id: 9, language: "fr_FR", name: "French" },
      { id: 10, language: "it_IT", name: "Italian" },
      { id: 11, language: "ja_JP", name: "Japanese" },
      { id: 12, language: "nl_NL", name: "Dutch" },
      { id: 15, language: "pl_PL", name: "Polish" },
      { id: 17, language: "zh_CN", name: "Simplified Chinese" },
      { id: 18, language: "zh_TW", name: "Traditional Mandarin" },
      { id: 20, language: "ko_KR", name: "Korean" },
      { id: 39, language: "pt_PT", name: "Portuguese" },
    ];
    let langCodeArr = languages.filter((langCodeArr) =>
      langCodeArr.language.includes(clientLangCode)
    );
    conversation
      .logger()
      .info(`TEMP langCodeArr results: ${langCodeArr.length}`);

    // default to English
    let langId = 1;

    // if (langCodeArr.length > 0) {
    //     langId = langCodeArr[0].id;
    // }
    // TODO: what if langCodeArr.length is > 1, e.g. for a match on "zh"
    // TODO: what if RMA status map values are not configured for a given language yet

    conversation.logger().info(`langId for RmaRecordLookup: ${langId}`);

    // configs from Skill
    const siteHost = conversation.variable("system.config.osvcHost");
    const apiUser = conversation.variable("system.config.osvcApiUser");
    const apiPass = conversation.variable("system.config.osvcApiPassword");
    const reportIdForRmaRecordLookup = conversation.variable(
      "system.config.reportIdForRmaRecordLookup"
    );

    // init
    this.chatApiClient = new ChatRestApiClient(
      apiUser,
      apiPass,
      conversation.logger()
    );

    (async () => {
      try {
        let rmaLookupReq = {
          id: parseInt(reportIdForRmaRecordLookup),
          filters: [
            {
              name: "rma ID",
              values: rmaId.toString(),
            },
            {
              name: "email",
              values: userEmail.toString(),
            },
            {
              name: "language",
              values: langId.toString(),
            },
          ],
        };

        const rmaLookup = await this.chatApiClient.request(
          siteHost,
          "/services/rest/connect/latest/analyticsReportResults",
          "oda-sdk rma lookup",
          "POST",
          rmaLookupReq
        );
        conversation.logger().info(rmaLookup);

        let reportData = JSON.parse(rmaLookup);

        if (reportData.count === 0) {
          conversation
            .logger()
            .warn("report count zero - exiting with rmaNotFound");
          conversation.transition("rmaNotFound");
          done();
          return;
        }

        conversation.logger().info("report count OK");

        const columnNames = reportData.columnNames;
        const firstRow = reportData.rows[0];

        let rmaData = {};
        for (let i = 0; i < firstRow.length; i++) {
          let keyName = columnNames[i].split(" ").join("").toLowerCase();
          rmaData[keyName] = firstRow[i];
        }

        conversation.logger().info(`returning rma data to var: ${variable}`);

        conversation.variable(variable, rmaData);

        conversation.keepTurn(true).transition("rmaFound");
        done();
      } catch (error) {
        conversation.logger().error(error.toString());
        conversation.keepTurn(true).transition("fail");
        done();
      }
    })();
  }
}

module.exports = GetRmaDetails;
