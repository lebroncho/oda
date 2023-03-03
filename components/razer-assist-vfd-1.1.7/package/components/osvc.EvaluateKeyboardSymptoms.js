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

 const symptoms = require("../json/keyboardSymptoms.json");
 
 class EvaluateKeyboardSymptoms {
   constructor() {
     //super();
   }
 
   metadata() {
     return {
       name: "osvc.EvaluateKeyboardSymptoms",
       properties: {
         issue: { type: "string", required: true },
         input: { type: "string", required: true },
       },
       supportedActions: [],
     };
   }
 
   invoke(conversation, done) {
     conversation.logger().info("------ EvaluateKeyboardSymptoms Invoked ------");
     const issue = conversation.properties().issue.toString();
     const input = conversation.properties().input.toString();
 
     conversation.logger().info("issue: " + issue);
     conversation.logger().info("input: " + input);
 
     const sanitizedInput= input.replace(/[,;\-\.]/g,' ').trim(); 
     const trimmedInput = sanitizedInput.replace(/\s/g,'').trim();
     const selections = [...new Set(trimmedInput.split(""))];
     conversation.logger().info("filtered selections: " + selections);
 
     let symptomString = '';
     let selectionArray = [];
 
     for (let i=0; i<selections.length; i++) {
       let value = symptoms[issue][selections[i]];
     
       if (value === "All of the above") {
         symptomString = symptoms[issue]['all'];
         break;
       } else if (value !== undefined) {
         selectionArray.push(value);
       }
     }
     
     if (symptomString === '') {
       symptomString = selectionArray.join('</br>');
     }
 
     conversation.variable("symptoms", symptomString);
     conversation.transition("next");
     done();
     return;
   }
 }
 
 module.exports = EvaluateKeyboardSymptoms;