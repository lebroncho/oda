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

class ValidateIssue {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.ValidateIssue",
      properties: {
        nlpResult: { type: "string", required: true },
      },
      supportedActions: ["accepted", "unclear"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ ValidateIssue Invoked ------");

    conversation.logger().info(conversation.properties().nlpResult.toString());

    let nlpResult = conversation.properties().nlpResult.toString();

    conversation.logger().info("nlpResult: " + nlpResult);

    if (nlpResult != "" && nlpResult != "<not set>") {
      let json = JSON.parse(nlpResult);

      let query = json.query;

      conversation.logger().info("query: " + query);

      if (!query.includes("agent")) {
        let count = this.countWords(query);

        conversation.logger().info("word count: " + count);

        if (count > 7) {
          conversation.logger().info("query is accepted");

          conversation.variable("chatQuestion", query);
          conversation.transition("accepted");

          done();
          return;
        }
      }
    }

    conversation.transition("unclear");

    done();
    return;
  }

  countWords(str) {
    return str.trim().split(/\s+/).length;
  }
}

module.exports = ValidateIssue;
