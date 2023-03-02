/* * *******************************************************************************************
 *  Copyright (c) 2020 Oracle Corporation. All rights reserved.
 ***********************************************************************************************
 *  Oracle Digital Assistant: Custom Component
 *  author: herzon.tan.ext@razer.com
 * *********************************************************************************************
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ****************************************************************************************** */

"use strict";

const mouseTs = require("../json/mouseTroubleshooting.json");

class ExtractMouseSupportData {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.ExtractMouseSupportData",
      properties: {
        nlpResult: { type: "string", required: true },
      },
      supportedActions: [],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ ExtractMouseSupportData Invoked ------");

    let nlpResult = conversation.properties().nlpResult.toString();
    conversation.logger().info("nlpResult: " + nlpResult);

    if ((nlpResult != "") && (typeof nlpResult !== "undefined")) {
      let result = JSON.parse(nlpResult);

      if (result.hasOwnProperty("entityMatches")) {
        let matches = result.entityMatches;
        conversation.logger().info("matches: " + matches);

        if (matches.hasOwnProperty('MouseCase')) {
          let utterance = matches['MouseCase'][0].replace(/~/g, '');
          conversation.logger().info("string extracted from entity: " + utterance);

          let values = utterance.split('|');
          
          let issue = this.createText('issues', values[0]);
          conversation.logger().info("issue: " + issue);
          conversation.variable("mouseIssue", issue);

          let symptoms = this.createText('symptoms', values[1], true);
          conversation.logger().info("symptoms: " + symptoms);
          conversation.variable("mouseSymptoms", symptoms);

          let connection = this.createText('connections', values[2]);
          conversation.logger().info("connection: " + connection);
          conversation.variable("mouseConnection", connection);

          let dongle = this.createText('dongle', values[3]);
          conversation.logger().info("dongle: " + dongle);
          conversation.variable("mouseDongle", dongle);

          let steps = this.createText('steps', values[4], true);
          conversation.logger().info("steps: " + steps);
          conversation.variable("mouseSteps", steps);
        }
      }
    }

    conversation.transition("next");
    done();
    return;
  }

  createText(category, value, multiple=false) {
    if ((category=='steps') && (value=='14')) {
      return '';
    }

    if (value===''){
      return '';
    }

    if (multiple) {
      let text = '';
      let ids = value.split('_');
  
      text = ids.map(x => {
        return mouseTs[category][x];
      });
  
      return text.join('</br>');
    }
  
    return mouseTs[category][value];
  }
}

module.exports = ExtractMouseSupportData;
