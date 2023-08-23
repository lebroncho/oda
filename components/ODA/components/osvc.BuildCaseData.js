'use strict';

function metadata(){
    return {
        name: 'osvc.BuildCaseData',
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
            file: { required: true, type: 'list' },

            // SETS THE FOLLOWING PROPERTIES
            caseDataVar: { required: true, type: 'string' } // sets a var of type map
        },
        supportedActions: ['next', 'error']
    }
}

async function invoke(context){

    context.logger().info("------ BUILD CASE DATA START ------");

    try{

        context.logger().info("------ osvc.BuildCaseData: extract parameters ------");
        const {
            rmaNumber: rmaNumber, orderNumber: orderNumber,
            serialNumber:serialNumber, categoryID: categoryID,
            problemID: problemID,
            productNumber: productNumber, productDescription: productDescription,
            sessionData: sessionData, issue: issue, note: note, file: file,
            caseDataVar: caseDataVar
    
        } = context.properties();

        context.logger().info("------ osvc.BuildCaseData: build notes ------");
        
        // override entryType, contentType and id properties in note
        let concatenatedNotes = '';
        const checkNotes = [note];
        for(const checkNote of checkNotes){
            if(checkNote.content != null && checkNote.content != ''){
                concatenatedNotes = `${concatenatedNotes}<br />${checkNote.content}`;
            }
        }

        const notes = [];
        if(concatenatedNotes != ''){
            notes.push({
                'content': concatenatedNotes, 'entryType': 'custom',
                'contentType': 'html', 'id': 'data-collection'
            });
        }

        context.logger().info("------ osvc.BuildCaseData: build files ------");
        console.log('file: ' + JSON.stringify(file));
        const files = [];
        const checkFiles = [file];
        for(const checkFile of checkFiles){
            if(checkFile.path != null && checkFile.path != ''){
                files.push(checkFile);
            }
        }

    
        context.logger().info("------ osvc.BuildCaseData: build case data ------");
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

        context.logger().info("------ osvc.BuildCaseData: success ------");
        context.keepTurn(true);
        context.transition('next');
    }catch(error){
        context.logger().info("------ osvc.BuildCaseData: error ------");
        context.keepTurn(true);
        context.transition('error');
    }

    context.logger().info("------ BUILD CASE DATA END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
};
