'use strict';

function metadata(){
    return {
        name: 'osvc.LinkVerifier',
        properties: {

            // READS THE FOLLOWING PROPERTIES
            input: { required: true, type: 'string' },
        },
        supportedActions: ['success', 'failed', 'error']
    }
}

async function invoke(context){
    context.logger().info("------ LINK VERIFIER START ------");

    const { input } = context.properties();
    const validator = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i;

    try{
        const matches = validator.exec(input);

        if(matches && matches.length > 0){

            context.logger().info('------ osvc.LinkVerifier: match success ------');
            context.keepTurn(true);
            context.transition('success');
        }else{

            context.logger().info('------ osvc.LinkVerifier: match failed ------');
            context.keepTurn(true);
            context.transition('failed');
        }
    }catch(error){
        context.logger().info('------ osvc.LinkVerifier: error ------');
        context.logger().info(`error: ${error}`);

        context.keepTurn(true);
        context.transition('error');
    }

    context.logger().info("------ LINK VERIFIER END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
};
