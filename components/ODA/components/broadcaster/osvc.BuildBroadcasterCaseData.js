'use strict';

function metadata(){
    return {
        name: 'osvc.BuildBroadcasterCaseData',
        properties: {

            // READS THE FOLLOWING PROPERTIES
            rmaNumber: { required: true, type: 'string' },
            orderNumber: { required: true, type: 'string' },
            serialNumber: { required: true, type: 'string' },
            categoryID: { required: true, type: 'string' },
            problemID: { required: true, type: 'string' },
            problemType: { required: true, type: 'string' },
            productNumber: { required: true, type: 'string' },
            productDescription: { required: true, type: 'string' },

            sessionData: { required: true, type: 'map' },
            troubleshootingIssue: { required: true, type: 'string' },
            troubleshootingNote: { required: true, type: 'map' },
            dataCollectionFile: { required: true, type: 'list' },
            dataCollectionNote: { required: true, type: 'map' },
            rmaFile: { required: true, type: 'list' },
            rmaNote: { required: true, type: 'map' },

            // SETS THE FOLLOWING PROPERTIES
            caseDataVar: { required: true, type: 'string' } // sets a var of type map
        },
        supportedActions: ['next', 'error']
    }
}

async function invoke(context){

    context.logger().info("------ BUILD BROADCASTER CASE DATA START ------");

    try{

        context.logger().info("------ osvc.BuildBroadcasterCaseData: extract parameters ------");
        const {
            rmaNumber: rmaNumber, orderNumber: orderNumber,
            serialNumber:serialNumber, categoryID: categoryID,
            problemID: problemID, problemType: problemType,
            productNumber: productNumber, productDescription: productDescription,
            sessionData: sessionData, troubleshootingNote: troubleshootingNote,
            troubleshootingIssue: troubleshootingIssue, dataCollectionFile: dataCollectionFile,
            dataCollectionNote: dataCollectionNote, rmaFile: rmaFile,
            rmaNote: rmaNote, caseDataVar: caseDataVar
    
        } = context.properties();

        context.logger().info("------ osvc.BuildBroadcasterCaseData: build notes ------");
        
        // override entryType, contentType and id properties in note
        let concatenatedNotes = '';
        const checkNotes = [troubleshootingNote, dataCollectionNote, rmaNote];
        for(const checkNote of checkNotes){
            if(checkNote.content != null && checkNote.content != ''){
                concatenatedNotes = `${concatenatedNotes}<br />${checkNote.content}`;
            }
        }

        const notes = [{
            'content': concatenatedNotes, 'entryType': 'custom',
            'contentType': 'html', 'id': 'data-collection'
        }];

        context.logger().info("------ osvc.BuildBroadcasterCaseData: build files ------");
        const files = [];
        const checkFiles = [dataCollectionFile, rmaFile];
        for(const checkFile of checkFiles){
            if(checkFile.path != null && checkFile.path != ''){
                files.push(checkFile);
            }
        }
    
        context.logger().info("------ osvc.BuildBroadcasterCaseData: build case data ------");
        let caseData = {
            'firstname': sessionData.firstname,
            'lastname': sessionData.lastname,
            'email': sessionData.email,
            'region': sessionData.region,
            'chatSessionID': sessionData.chatSessionID,
            'issue': `${problemType} ${troubleshootingIssue}`,
            'rmaNumber': rmaNumber,
            'orderNumber': orderNumber,
            'serialNumber': serialNumber,
            'categoryID': categoryID,
            'subject': `${problemType} - ${troubleshootingIssue}`,
            'productNumber': productNumber,
            'productDescription': productDescription,
            'problemID': problemID,
            'notes': notes,
            'files': files
        };
        context.variable(caseDataVar, caseData);
        context.logger().info(`caseData: ${JSON.stringify(caseData)}`);

        context.logger().info("------ osvc.BuildBroadcasterCaseData: success ------");
        context.keepTurn(true);
        context.transition('next');
    }catch(error){
        context.logger().info("------ osvc.BuildBroadcasterCaseData: error ------");
        context.keepTurn(true);
        context.transition('error');
    }

    context.logger().info("------ BUILD BROADCASTER CASE DATA END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
};
