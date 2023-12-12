'use strict';

function metadata(){
    return {
        name: 'osvc.ExtractUtteranceFromNLP',
        properties: {
            // PARAMETERS
            nlpResult: { required: true, type: 'string' },

            // SETTERS
            utteranceVar: { required: true, type: 'string' }, // sets var of type string
        },
        supportedActions: ['done', 'error']
    };
}

async function invoke(context){
    context.logger().info("------ EXTRACT UTTERANCE FROM NLP START ------");

    try{
        const { nlpResult, utteranceVar } = context.properties();
        const nlpStr = nlpResult.toString();
        context.logger().info(`nlpResult: ${nlpStr}`);

        if ((nlpStr != "") && (typeof nlpStr !== "undefined")) {
            let parsedData = JSON.parse(nlpStr);
            let utterance = '';

            if(parsedData.hasOwnProperty('query')){
                context.logger().info(`Utterance: ${parsedData.query}`);
                utterance = parsedData.query;
            }
            context.variable(utteranceVar, utterance);
        }
        context.keepTurn(true);
        context.transition('done');
    }catch(error){
        context.logger().info(error);
        context.keepTurn(true);
        context.transition('error');
    }

    context.logger().info("------ EXTRACT UTTERANCE FROM NLP END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
};