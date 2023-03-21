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

const productIds = require("../json/categories.json");

class MapCaseType {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.MapCaseType",
      properties: {
        selectedOption: { type: "string", required: true },
        nlpResult: { type: "string", required: true },
      },
      supportedActions: [
        "categorized",
        "multiple",
        "specific",
        "uncategorized",
      ],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ MapCaseType Invoked ------");

    let selectedOption = conversation.properties().selectedOption.toString();
    let nlpResult = conversation.properties().nlpResult.toString();

    conversation.logger().info("selectedOption: " + selectedOption);
    conversation.logger().info("nlpResult: " + nlpResult);

    if (selectedOption != "<not set>" && nlpResult != "") {
      this.getCategory(conversation, selectedOption);

      done();
      return;
    } else {
      if (typeof nlpResult !== "undefined") {
        if (nlpResult != "" && nlpResult != "<not set>") {
          let result = JSON.parse(nlpResult);

          if (result.hasOwnProperty("intentMatches")) {
            let intentMatched = result.intentMatches.summary[0].intent;

            conversation.logger().info("intent matched " + intentMatched);

            if (productIds.hasOwnProperty(intentMatched)) {
              this.getCategory(conversation, intentMatched);

              done();
              return;
            }
          }
        }
      }
    }

    conversation.transition("uncategorized");
    done();
    return;
  }

  getCategory(conversation, intent) {
    let productId = productIds[intent].product_id;
    let category = productIds[intent].category_0.toLowerCase();
    let parentCategory = productIds[intent].category_1;
    let subCategory = productIds[intent].category_2;

    conversation.logger().info("product id: " + productId);
    conversation.logger().info("category: " + category);
    conversation.logger().info("parent category: " + parentCategory);
    conversation.logger().info("subcategory: " + subCategory);

    if (productId != "NULL") {
      conversation.variable("caseProductId", productId);
      conversation.variable("caseCategory", category);
      conversation.transition("categorized");
    } else if (category == "multiple categories") {
      conversation.variable("caseCategory", category);
      conversation.variable("caseParentCategory", parentCategory);
      conversation.variable("caseSubCategory", subCategory);

      if (parentCategory != "NULL") {
        conversation.transition("multiple");
      } else {
        conversation.transition("specific");
      }
    } else {
      conversation.transition("uncategorized");
    }
  }
}

module.exports = MapCaseType;
