/* * *******************************************************************************************
 *  Copyright (c) 2020 Oracle Corporation. All rights reserved.
 ***********************************************************************************************
 *  Oracle Digital Assistant: Custom Component
 *  Author: josh.cabiles.ext@razer.com
 * *********************************************************************************************
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ****************************************************************************************** */

"use strict";

const refData = require("../json/laptopTroubleshooting.json");

class ExtractLaptopSupportData {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.ExtractLaptopSupportData",
      properties: {
        nlpResult: { type: "string", required: true },
      },
      supportedActions: [],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ ExtractLaptopSupportData Invoked ------");

    let nlpResult = conversation.properties().nlpResult.toString();
    conversation.logger().info("nlpResult: " + nlpResult);

    if ((nlpResult != "") && (typeof nlpResult !== "undefined")) {
      let result = JSON.parse(nlpResult);

      if (result.hasOwnProperty("entityMatches")) {
        let matches = result.entityMatches;
        conversation.logger().info("matches: " + matches);

        if (matches.hasOwnProperty('RefString')) {
          let utterance = matches['RefString'][0].replace(/~/g, '');
          conversation.logger().info("string extracted from entity: " + utterance);

          let values = utterance.split('|');

          let issue = this.createText('issues', values[0]);
          conversation.logger().info("issue: " + issue);
          conversation.variable("deviceIssue", issue);

          let symptoms = this.createText('symptoms', values[1], true);
          conversation.logger().info("symptoms: " + symptoms);
          conversation.variable("deviceSymptoms", symptoms);

          let connection = this.createText('connections', values[2]);
          conversation.logger().info("connection: " + connection);
          conversation.variable("deviceConnection", connection);

          let steps = this.createText('steps', values[3], true);
          conversation.logger().info("steps: " + steps);
          conversation.variable("deviceSteps", steps);
        }
      }
    }

    conversation.transition("next");
    done();
    return;
  }

  createText(category, value, multiple = false) {
    if (value === '') {
      return '';
    }

    if (multiple) {
      let text = '', otherText = '';
      let ids = value.split('_');

      if (category == 'symptoms' && ids.includes('24')) {
        let indexAfterKey = ids.indexOf('24') + 1, otherText = [], spliceCount = 0;
        for (let i = indexAfterKey; i < ids.length; i++) {
          otherText.push(ids[i]);
          spliceCount++;
        }
        ids.splice(indexAfterKey, spliceCount);
        otherText = ': ' + otherText.join(' ');
      }

      text = ids.map(x => {
        return refData[category][x];
      });
      return text.join('</br>') + otherText;
    }

    return refData[category][value];
  }
}

module.exports = ExtractLaptopSupportData;
