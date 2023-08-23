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
            name: "osvc.MapCaseTypeV2",
            properties: {
                intentMatched: { type: "string", required: true },
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
        conversation.logger().info("------ MapCaseTypeV2 Invoked ------");

 
        let intentMatched = conversation.properties().intentMatched.toString();
 
        conversation.logger().info("intentMatched: " + intentMatched);
 
        if (intentMatched != "" && intentMatched != null && intentMatched != undefined ) {
            this.getCategory(conversation, intentMatched);
    
            done();
            return;
        }
        conversation.transition("uncategorized");
        done();
        return;
    }
 
    getCategory(conversation, intent) {
        try{
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
        }catch(error){
            conversation.transition("uncategorized");
        }
    }
}

module.exports = MapCaseType;
 