'use strict';

function metadata(){
    return {
        name: 'osvc.DetermineLaptopDataCollection',
        properties: {
            // GETTERS
            issue: { required: true, type: 'string' },
            symptoms: { required: true, type: 'string' },
            issueToKeywordMapping: { required: true, type: 'map' },

            // SETTERS
            keywordVar: { required: true, type: 'string' }

        },
        supportedActions: ['next', 'error']
  };
}

async function invoke(context){

    context.logger().info("------ DETERMINE LAPTOP DATA COLLECTION START ------");

    try{
        const {
            issue, symptoms,
            issueToKeywordMapping, keywordVar
        } = context.properties();

        context.logger().info(`osvc.DetermineLaptopDataCollection: issue -> ${issue}`);
        context.logger().info(`osvc.DetermineLaptopDataCollection: symptoms -> ${symptoms}`);

        let anotherIssue = '';
        if(issue == 'Power & Battery Issues' && symptoms == 'Unable to power on'){
            anotherIssue = 'Cosmetic & Physical Issues';
        }else if(issue == 'Systems Performance Issues' && symptoms == 'Blue screen appears intermittently'){
            anotherIssue = 'BSOD Issues'
        }
        else{
            anotherIssue = issue;
        }
        const keyword = issueToKeywordMapping[anotherIssue];

        context.logger().info(`osvc.DetermineLaptopDataCollection: keyword -> ${keyword}`);
        
        context.variable(keywordVar, keyword);

        context.logger().info(`osvc.DetermineLaptopDataCollection: success`);

        context.keepTurn(true);
        context.transition("next");
    }catch(error){
        context.logger().info(`osvc.DetermineLaptopDataCollection: error`);

        context.logger().info(error);
        context.keepTurn(true);
        context.transition("error");
    }

    context.logger().info("------ DETERMINE LAPTOP DATA COLLECTION END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
}