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

const Https = require("https");
const products = require("../json/products.json");

class ValidateSerial {
  constructor() {
    //super();
  }

  metadata() {
    return {
      name: "osvc.ValidateSerial",
      properties: {
        serial: { type: "string", required: true },
        product: { type: "string", required: true },
      },
      supportedActions: ["valid", "invalid"],
    };
  }

  invoke(conversation, done) {
    conversation.logger().info("------ ValidateSerial Invoked ------");

    let serial = conversation.properties().serial.toString().toLowerCase();
    let productId = conversation.properties().product.toString();
    let family = products[productId]["family"];
    conversation.logger().info("serial: " + serial);
    conversation.logger().info("family: " + family);

    const nullables = ["na", "n/a", "unavailable", "none", " "];

    if (nullables.includes(serial)) {
      conversation.transition("valid");
      done();
      return;
    } else {
      let postBody = "serial=" + serial;

      if (productId != "") {
        postBody += "&family=" + family;
      }

      var dataResponse = "";

      const headers = {
        "X-Requested-With": "XMLHttpRequest",
        "X-Forwarded-Host": "mysupport.razer.com",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      };

      const options = {
        hostname: "support.razer.com",
        port: 443,
        path: "/?ACT=24&action=warranty_check",
        method: "POST",
        headers: headers,
      };

      const req = Https.request(options, (res) => {
        conversation.logger().info("statusCode:", res.statusCode);
        conversation.logger().info("headers:", res.headers);

        res.on("data", (d) => {
          conversation
            .logger()
            .info("Response received. Status code: " + `${res.statusCode}`);
          dataResponse = dataResponse + d;
        });

        res.on("end", () => {
          try {
            let response = JSON.parse(dataResponse);
            conversation.logger().info("response: " + response);

            let expiryDate = response.expiry_date;

            if (expiryDate) {
              conversation.transition("valid");
              done();
              return;
            }
          } catch (error) {
            conversation.logger().info("Invalid serial data");
          }

          conversation.transition("invalid");
          done();
          return;
        });
      });

      req.on("error", (e) => {
        conversation.logger().info("Problem calling API:" + e);
        conversation.transition("invalid");
        done();
      });

      req.write(postBody);
      req.end();
    }
  }
}

module.exports = ValidateSerial;
