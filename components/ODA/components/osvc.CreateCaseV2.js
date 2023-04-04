'use strict';

const fetch = require("node-fetch");

function metadata(){
    return {
      name: 'osvc.CreateCaseV2',
      properties: {
        
        // READS THE FOLLOWING PROPERTIES
        region: { required: true, type: 'string' },
        chatSessionID: { required: true, type: 'string' },
        contactID: { required: true, type: 'int' },

        issue: { required: true, type: 'string' },
        rmaNumber: { required: true, type: 'string' },
        orderNumber: { required: true, type: 'string' },
        serialNumber: { required: true, type: 'string' },
        categoryID: { required: true, type: 'string' },
        subject: { required: true, type: 'string' },
        productNumber: { required: true, type: 'string' },
        productDescription: { required: true, type: 'string' },
        problemID: { required: true, type: 'string' },
        files: { required: true, type: 'list' },
        notes: { required: true, type: 'list' },

        // SETTERS
        caseReferenceNumberVar: { required: true, type: 'string' }, // sets a var of type string
        caseIncidentIDVar: { required: true, type: 'string' }, // int
      },
      supportedActions: ['success', 'failed', 'error']
    }
}

async function invoke(context){

    context.logger().info("------ CREATE CASE V2 START ------");

    try{

        const siteHost = context.variable('system.config.osvcHost');
        const scriptPath = context.variable('system.config.caseProcessorScript');
        const url = `https://${siteHost}${scriptPath}`;

        context.logger().info("------ osvc.CreateCaseV2: extract parameters ------");
        const {
            region, chatSessionID, contactID,
            orderNumber, serialNumber, categoryID,
            productNumber, productDescription,
            problemID, issue,
            files, notes, rmaNumber,
            caseReferenceNumberVar, caseIncidentIDVar

        } = context.properties();

        let subject = context.properties().subject;
        subject = subject? subject.trim() : subject;

        context.logger().info('------ osvc.CreateCaseV2: build case data   ------');
        let caseData = {
            contactID: contactID, subject: subject,
            problemID: problemID, categoryID: categoryID,
            region: region, chatSessionID: chatSessionID,
            orderNumber: orderNumber, 
            productNumber: productNumber,
            productDescription: productDescription,
            serialNumber: serialNumber, issue: issue,
            files: files, rmaNumber: rmaNumber,
            notes: notes
        };
        let payload = JSON.stringify(caseData);
        
        context.logger().info('------ osvc.CreateCaseV2: json payload   ------');
        context.logger().info(payload);

        context.logger().info('------ CREATE CASE V2: posting payload to api   ------');
        context.logger().info(`url: ${url}`);

        const response = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: payload
        });
    
        context.logger().info(`status code: ${response.status}`);
    
        const parsedData = await response.json();

        if(response.status != 200 || parsedData['status'].toLowerCase() == 'failed'){
            throw new Error(`There was an error posting to the api: ${parsedData['exception']}`);
        }

        context.logger().info(`response data: ${JSON.stringify(parsedData)}`);

        context.variable(caseIncidentIDVar, parsedData['id']);
        context.variable(caseReferenceNumberVar, parsedData['referenceNumber']);

        context.logger().info('------ osvc.CreateCaseV2: success ------');
    
        context.keepTurn(true);
        context.transition('success');
    }catch(error){
        context.logger().info('------ osvc.CreateCaseV2: failed ------');
        context.logger().info(`error: ${error}`);

        context.keepTurn(true);
        context.transition('error');
    }

    context.logger().info("------ CREATE CASE V2 END   ------");
    return;
}


module.exports = {
    metadata: metadata,
    invoke: invoke
};
  