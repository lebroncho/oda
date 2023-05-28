'use strict';

const troubleshootingData = require("../../json/headset/troubleshooting.json");

const ISSUES_INDEX = 0;
const SYMPTOMS_INDEX = 1;
const CONNECTIONS_INDEX = 2;
const TROUBLESHOOTING_STEPS_INDEX = 3;

const OTHER_COSMETIC_INDEX = 24;
const DEFAUT_BUILD_PROPERTIES = {
    prepend: '', append: '',
    joinChar: ''
};

function metadata(){
    return {
        name: 'osvc.ExtractHeadsetSupportData',
        properties: {
            // GETTERS
            nlpResult: { required: true, type: 'string' },

            // SETTERS
            issueVar: { required: true, type: 'string' }, // sets var of type string
            symptomsVar: { required: true, type: 'string' }, // string
            connectionVar: { required: true, type: 'string' }, // string
            troubleshootingStepsVar: { required: true, type: 'string' } // string
        },
        supportedActions: ['next', 'error']
    };
}

function buildText(indexesString, reference, properties){
    if(indexesString == '') return '';
    if(!properties) properties = DEFAUT_BUILD_PROPERTIES;
    
    const values = [];
    const indexes = indexesString.split('_');
    for(const index of indexes){
        values.push(`${properties.prepend}${reference[index]}${properties.append}`);
    }
    const text = values.join(properties.joinChar);
    return text.trim();
}

function buildSymptomsText(indexesString, reference, properties){
    if(indexesString == '') return '';
    if(!properties) properties = DEFAUT_BUILD_PROPERTIES;

    let text = ''; let extraText = ''
    const indexes = indexesString.split('_');
    const otherSymptomIndex = indexes.indexOf(OTHER_COSMETIC_INDEX.toString());
    if(otherSymptomIndex > -1){
        let otherSymptoms = indexes.splice(otherSymptomIndex, indexes.length);
        let index24 = otherSymptoms.shift();
        let joinedText = otherSymptoms.join(' ');
        extraText = `${properties.prepend}${reference[index24]} ${joinedText}${properties.append}`;
    }
    text = buildText(indexes.join('_'), reference, properties);
    if(text != '') text = extraText != ''? `${text}${properties.joinChar}${extraText}` : text;
    else text = extraText;

    return text.trim();
}

async function invoke(context){
    context.logger().info("------ EXTRACT HEADSET SUPPORT DATA START ------");

    try{
        const {
            issueVar, symptomsVar, connectionVar,
            troubleshootingStepsVar
        } = context.properties();
        const nlpResult = context.properties().nlpResult.toString();
        context.logger().info(`nlpResult: ${nlpResult}`);

        if ((nlpResult != "") && (typeof nlpResult !== "undefined")) {
            let parsedData = JSON.parse(nlpResult);

            if(parsedData.hasOwnProperty('entityMatches')){
                let matches = parsedData.entityMatches;
                context.logger().info(`matches: ${matches}`);

                if (matches.hasOwnProperty('RefString')) {
                    let utterance = matches['RefString'][0].replace(/~/g, '');
                    context.logger().info(`string extracted from entity: ${utterance}`);
                    
                    const selections = utterance.split('|');

                    const symptomsBuildProperties = {
                        append: '', prepend: '',
                        joinChar: ', '
                    }
                    const troubleshootingStepsBuildProperties = {
                        append: '</li>', prepend: '<li>',
                        joinChar: '',
                    };

                    let issues = buildText(selections[ISSUES_INDEX], troubleshootingData['issues']);
                    let symptoms = buildSymptomsText(
                        selections[SYMPTOMS_INDEX],
                        troubleshootingData['symptoms'],
                        symptomsBuildProperties
                    );
                    let connection = buildText(selections[CONNECTIONS_INDEX], troubleshootingData['connections']);
                    let troubleshootingSteps = buildText(
                        selections[TROUBLESHOOTING_STEPS_INDEX],
                        troubleshootingData['steps'],
                        troubleshootingStepsBuildProperties
                    );
                    troubleshootingSteps = troubleshootingSteps != ''? `<ul>${troubleshootingSteps}</ul>` : troubleshootingSteps;

                    context.variable(issueVar, issues);
                    context.variable(symptomsVar, symptoms);
                    context.variable(connectionVar, connection);
                    context.variable(troubleshootingStepsVar, troubleshootingSteps);
                }
            }

        }
        context.keepTurn(true);
        context.transition("next");
    }catch(error){
        context.logger().info(error);
        context.keepTurn(true);
        context.transition("error");
    }

    context.logger().info("------ EXTRACT HEADSET SUPPORT DATA END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
};