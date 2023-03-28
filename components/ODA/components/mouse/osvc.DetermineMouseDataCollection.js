'use strict';

function metadata(){
    return {
        name: 'osvc.DetermineMouseDataCollection',
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

    context.logger().info("------ DETERMINE MOUSE DATA COLLECTION START ------");

    try{
        const {
            issue, symptoms,
            issueToKeywordMapping, keywordVar
        } = context.properties();

        context.logger().info(`osvc.DetermineMouseDataCollection: issue -> ${issue}`);
        context.logger().info(`osvc.DetermineMouseDataCollection: symptoms -> ${symptoms}`);

        let anotherIssue = issue;
        const keyword = issueToKeywordMapping[anotherIssue];

        context.logger().info(`osvc.DetermineMouseDataCollection: keyword -> ${keyword}`);
        
        context.variable(keywordVar, keyword);

        context.logger().info(`osvc.DetermineMouseDataCollection: success`);

        context.keepTurn(true);
        context.transition("next");
    }catch(error){
        context.logger().info(`osvc.DetermineMouseDataCollection: error`);

        context.logger().info(error);
        context.keepTurn(true);
        context.transition("error");
    }

    context.logger().info("------ DETERMINE MOUSE DATA COLLECTION END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
}