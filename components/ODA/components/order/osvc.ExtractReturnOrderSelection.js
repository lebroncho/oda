'use strict';

function metadata(){
    return {
        name: 'osvc.ExtractReturnOrderSelection',
        properties: {
            // GETTERS
            utterance: { required: true, type: 'string' },

            // SETTERS
            orderFromVar: { required: true, type: 'string' }, // sets var of type string
            daysReceivedVar: { required: true, type: 'string' }, // string
        },
        supportedActions: ['done', 'error']
    };
}

async function invoke(context){
    context.logger().info("------ EXTRACT RETURN ORDER SELECTION START ------");

    try{

        const ORDER_FROM_INDEX = 1;
        const DAYS_RECEIVED_INDEX = 2;
        const orderFromMapping = {
            '0': '<b>Order from US or Canada</b>: No',
            '1': '<b>Order from US or Canada:</b> Yes',
        };

        const daysReceivedMapping = {
            '0': '<b>Received more than 14 days</b>: No',
            '1': '<b>Received more than 14 days</b>: Yes',
        }

        const { utterance, orderFromVar, daysReceivedVar } = context.properties();
        // let utterance = matches['RefString'][0].replace(/~/g, '');

        const selection = utterance.split(' ')[1].replace(/~/g, '');
        const selections = selection.split('|');

        const orderFrom = orderFromMapping[selections[ORDER_FROM_INDEX]];
        const daysReceived = daysReceivedMapping[selections[DAYS_RECEIVED_INDEX]];

        console.log(orderFrom);
        console.log(daysReceived);
        
        context.variable(orderFromVar, orderFrom);
        context.variable(daysReceivedVar, daysReceived);
        

        context.keepTurn(true);
        context.transition('done');
    }catch(error){
        context.logger().info(error);
        context.keepTurn(true);
        context.transition('error');
    }

    context.logger().info("------ EXTRACT RETURN ORDER SELECTION START END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
};