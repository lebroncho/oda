/* * *******************************************************************************************
 *  Copyright (c) 2020 Oracle Corporation. All rights reserved.
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

'use strict';

const https = require('https');
const util = require('util');

/**
 * This is a wrapper client for the Oracle Service Cloud Connect REST API
 */
class ChatRestApiClient {

    constructor(apiUser, apiPass, odaLogger) {
        this.apiUser = apiUser;
        this.apiPass = apiPass;
        this.logger = odaLogger;
        this.logger.info("creating ChatRestApiClient instance");
    }

    async request(host, path, context, method = 'GET', postData, jwtToken, jSessionId, accountId) {

        this.logger.info(`${method} ${host} @ ${path}`);

        let reqHeaders = {
            'Authorization': 'Basic ' + Buffer(this.apiUser + ':' + this.apiPass).toString('base64'),
            'OSvC-CREST-Application-Context': context
        };

        if (postData) {
            reqHeaders['Content-Type'] = 'application/json';
            reqHeaders['Content-Length'] = Buffer.byteLength(JSON.stringify(postData));
        }

        // replace basic auth
        if (jwtToken) {
            reqHeaders['Authorization'] = 'Bearer ' + jwtToken;
        }

        if (jSessionId) {
            reqHeaders['X-JSESSIONID'] = jSessionId;
        }

        if (accountId) {
            reqHeaders['X-AID'] = accountId;
        }

        if (method === 'PATCH') {
            reqHeaders['X-HTTP-Method-Override'] = 'PATCH';
            method = 'POST';
        }

        if (method === 'GET' && context === 'getQueueStats') {
            reqHeaders['Content-Type'] = 'application/json';
        }

        this.logger.info(JSON.stringify(reqHeaders));

        const params = {
            method,
            host,
            port: 443,
            path: path,
            headers: reqHeaders
        };

        return new Promise((resolve, reject) => {
            const req = https.request(params, res => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    //return reject(new Error(`respCode: ${res.statusCode}`));
                }

                const data = [];

                res.on('data', chunk => {
                    data.push(chunk);
                });

                //res.on('end', () => resolve(Buffer.concat(data).toString()));
                res.on('end', () => {
                    const respData = Buffer.concat(data).toString();
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        let errorMessage = JSON.parse(respData).message ? JSON.parse(respData).message : JSON.parse(respData).detail;
                        //return reject(new Error(`${res.statusCode} ${JSON.parse(respData).exceptionCode} | ${JSON.parse(respData).message}`));
                        return reject(new Error(`${res.statusCode} ${JSON.parse(respData).exceptionCode} | ${errorMessage}`));
                    }
                    this.logger.info(`OK: ${res.statusCode}`);
                    resolve(respData);
                });
            });

            //req.on('error', reject);
            req.on('error', (e) => {
                this.logger.info(e);
                reject(new Error(e));
            });

            if (postData) {
                let jsonPayload = JSON.stringify(postData);
                this.logger.info(`payload: ${jsonPayload}`);
                req.write(jsonPayload);
            }

            req.end();
        });
    };
}

module.exports = ChatRestApiClient;