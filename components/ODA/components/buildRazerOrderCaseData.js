'use strict';

function metadata(){
    return {
        name: 'osvc.BuildRazerOrderCaseData',
        properties: {

            // READS THE FOLLOWING PROPERTIES
            rmaNumber: { required: true, type: 'string' },
            orderNumber: { required: true, type: 'string' },
            serialNumber: { required: true, type: 'string' },
            categoryID: { required: true, type: 'string' },
            problemID: { required: true, type: 'string' },
            productNumber: { required: true, type: 'string' },
            productDescription: { required: true, type: 'string' },
            sessionData: { required: true, type: 'map' },

            issue: { required: true, type: 'string' },
            note: { required: true, type: 'map' },

            // SETS THE FOLLOWING PROPERTIES
            caseDataVar: { required: true, type: 'string' } // sets a var of type map
        },
        supportedActions: ['next', 'error']
    }
}

async function invoke(context){

    context.logger().info("------ BUILD RAZER ORDER CASE DATA START ------");

    try{

        context.logger().info("------ osvc.BuildRazerOrderCaseData: extract parameters ------");
        const {
            rmaNumber: rmaNumber, orderNumber: orderNumber,
            serialNumber:serialNumber, categoryID: categoryID,
            problemID: problemID, productNumber: productNumber,
            productDescription: productDescription, sessionData: sessionData,
            issue: issue, note: note,
            caseDataVar: caseDataVar
    
        } = context.properties();

        context.logger().info("------ osvc.BuildRazerOrderCaseData: build notes ------");

        const notes = [ note ];
        const files  = [];

    
        context.logger().info("------ osvc.BuildRazerOrderCaseData: build case data ------");
        let caseData = {
            'firstname': sessionData.firstname,
            'lastname': sessionData.lastname,
            'email': sessionData.email,
            'region': sessionData.region,
            'chatSessionID': sessionData.chatSessionID,

            'issue': issue,
            'rmaNumber': rmaNumber,
            'orderNumber': orderNumber,
            'serialNumber': serialNumber,
            'categoryID': categoryID,
            'subject': issue,
            'productNumber': productNumber,
            'productDescription': productDescription,
            'problemID': problemID,
            'notes': notes,
            'files': files
        };
        context.variable(caseDataVar, caseData);
        context.logger().info(`caseData: ${JSON.stringify(caseData)}`);

        context.logger().info("------ osvc.BuildRazerOrderCaseData: success ------");
        context.keepTurn(true);
        context.transition('next');
    }catch(error){
        context.logger().info("------ osvc.BuildRazerOrderCaseData: error ------");
        context.keepTurn(true);
        context.transition('error');
    }

    context.logger().info("------ BUILD RAZER ORDER CASE DATA END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
};
