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

class GetCaseCategory {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.GetCaseCategory",
      properties: {
        id: { type: "string", required: true },
      },
      supportedActions: [],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ GetCaseCategory Invoked ------");

    const products = require("../json/products.json");
    let id = conversation.properties().id.toString();

    conversation.logger().info("id: " + id);
    conversation.logger().info("category name: " + products[id]["name"]);
    conversation.variable("caseProductCategory", products[id]["name"]);
    conversation.keepTurn(true);
    conversation.transition("showCaseDataAll");

    done();
    return;
  }
}

module.exports = GetCaseCategory;
