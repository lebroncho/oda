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

const Https = require('https');
const util = require('util');

/**
 * This is a wrapper client for the Oracle Service Cloud Connect REST API
 */
class ConnectRestApiClient {

    /**
     * Retrieve an instance of the OSvC REST API client.
     * @param apiEndpoint the endpoint of the API
     * @param apiUser the login/username of a valid account
     * @param apiPass the password of a valid account
     * @param odaLogger object instance of the ODA Logger
     */
    constructor(apiEndpoint, apiUser, apiPass, odaLogger) {
        this.endpoint = apiEndpoint.replace(/^https?:\/\//i, "");
        this.apiUser = apiUser;
        this.apiPass = apiPass;
        this.logger = odaLogger;
        this.logger.info("creating ConnectRestApiClient instance");
    }

    getContactByEmail(emailAddress) {
        var reqType = 'getContact';
        var objPath = "contacts/?q=emails.address='" + emailAddress + "'";
        const options = this.__getRequestOptions(objPath, reqType);
        this.logger.info("__getRequestOptions:"+JSON.stringify(options));

        return new Promise((resolve, reject) => {
            this.__handleCrestGetApiRequest(reqType, options, resolve, reject);
        });
    }

    createNewContact(contactData) {
        var reqType = 'createContact';
        var objPath = 'contacts';
        const options = this.__postRequestOptions(objPath, reqType, contactData);
        this.logger.info("__postRequestOptions:"+JSON.stringify(options));

        return new Promise((resolve, reject) => {
            this.__handleCrestPostApiRequest(reqType, options, resolve, reject, contactData);
        });
    }

    createNewIncident(incidentData) {
        var reqType = 'createIncident';
        var objPath = 'incidents';
        const options = this.__postRequestOptions(objPath, reqType, incidentData);
        this.logger.info("__postRequestOptions:"+JSON.stringify(options));

        return new Promise((resolve, reject) => {
            this.__handleCrestPostApiRequest(reqType, options, resolve, reject, incidentData);
        });
    }

    runAnalyticsReport(reportData) {
        var reqType = 'runReport';
        var objPath = 'analyticsReportResults';
        const options = this.__postRequestOptions(objPath, reqType, reportData);
        this.logger.info("__postRequestOptions:"+JSON.stringify(options));

        return new Promise((resolve, reject) => {
            this.__handleCrestPostApiRequest(reqType, options, resolve, reject, reportData);
        });
    }

    isHttpStatusCodeOk(statusCode) {
        var statusCodeOkEval = (statusCode < 200 || statusCode > 299) ? false : true;
        return statusCodeOkEval;
    }
     
    __handleCrestGetApiRequest(requestType, requestOptions, resolve, reject) {
        Https.get(requestOptions, (response) => {
            this.logger.info(`${requestType} CREST API request responded with status code: ${response.statusCode}`);
            
            var responseData = "";

            response.setEncoding("UTF-8");
            
            response.on('data', (data) => {
                responseData += data;
            });

            response.on('end', () => {
                this.logger.info(requestType + ' __handleCrestGetApiRequest ending');
                
                let responsePayloadObject = JSON.parse(responseData);

                const crestResponse = {
                    statusCode: response.statusCode,
                    crestData: responsePayloadObject
                };

                resolve(crestResponse);
            });

        }).on('error', (e) => {
            this.logger.error(e);
            reject(new Error(e));
        });
    }

    __handleCrestPostApiRequest(requestType, requestOptions, resolve, reject, payloadData) {

        var dataResponse = "";

        const postReq = Https.request(requestOptions, (response) => {
            response.on('data', (d) => {
                this.logger.info(`${requestType} response received: ${d}`);
                dataResponse = dataResponse + d;
            });
            response.on('end', () => {
                this.logger.info(`${requestType} ended`);
                let responsePayloadObject = JSON.parse(dataResponse);
                const crestResponse = {
                    statusCode: response.statusCode,
                    crestData: responsePayloadObject
                };
                resolve(crestResponse);
            });
        });

        postReq.on('error', (e) => {
            this.logger.error("__handleCrestPostApiRequest problem calling CREST:" + e);
            reject(new Error(e));
        });

        let jsonPayload = JSON.stringify(payloadData)
        //this.logger.info("json payload: " + jsonPayload);
        this.logger.info(`${requestType} json payload: ${jsonPayload}`);
        postReq.write(jsonPayload);
    }

    __getRequestOptions(objectWithParams, apiContext) {
        var crestGetHeaders = {
            'Authorization': 'Basic ' + new Buffer(this.apiUser + ':' + this.apiPass).toString('base64'),
            'OSvC-CREST-Application-Context': 'oda-sdk ' + apiContext
        };
        
        this.logger.info("crestGetHeaders:"+JSON.stringify(crestGetHeaders));

        return {
            hostname: this.endpoint,
            port: 443,
            path: '/services/rest/connect/latest/'+objectWithParams,
            method: 'GET',
            headers: crestGetHeaders
        };
    }

    __postRequestOptions(object, apiContext, postData) {
        var crestPostHeaders = {
            'Authorization': 'Basic ' + new Buffer(this.apiUser + ':' + this.apiPass).toString('base64'),
            'OSvC-CREST-Application-Context': 'oda-sdk ' + apiContext,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(postData))
        };
        
        this.logger.info("crestPostHeaders:"+JSON.stringify(crestPostHeaders));
        this.logger.info("crestPostData: "+JSON.stringify(postData));

        return {
            hostname: this.endpoint,
            port: 443,
            path: '/services/rest/connect/latest/'+object,
            method: "POST",
            headers: crestPostHeaders
        };
    }
}

module.exports = ConnectRestApiClient;