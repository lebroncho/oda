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

class VerifyIntent {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.VerifyIntent",
      properties: {
        nlpResult: { type: "string", required: true },
        control: { type: "string", required: true },
      },
      supportedActions: ["verified", "unverified"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ VerifyIntent Invoked ------");

    let nlpResult = conversation.properties().nlpResult.toString();
    let control = conversation.properties().control.toString();

    conversation.logger().info("nlpResult: " + nlpResult);
    conversation.logger().info("control: " + control);

    if (typeof nlpResult !== "undefined") {
      if (nlpResult != "" && nlpResult != "<not set>") {
        let result = JSON.parse(nlpResult);

        if (result.hasOwnProperty("intentMatches")) {
          let intentMatched = result.intentMatches.summary[0].intent;

          conversation.logger().info("intent matched " + intentMatched);

          let intents = control.split(",").map((item) => item.trim());

          if (intents.includes(intentMatched)) {
            conversation.transition("verified");
            done();
            return;
          }
        }
      }
    }

    conversation.transition("unverified");
    done();
    return;
  }
}

module.exports = VerifyIntent;
