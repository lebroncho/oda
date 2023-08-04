'use strict';

const troubleshootingData = require("../../json/broadcaster/troubleshooting.json");
const symptomsIndexMap = require("../../json/broadcaster/symptoms-index-map.json");

const SYMPTOMS_INDEX = 1;
const ALL_OF_THE_ABOVE_INDEX = -1;

const DEFAUT_BUILD_PROPERTIES = {
    prepend: '', append: '',
    joinChar: ''
};


function metadata(){
  return {
    name: 'osvc.EvaluateBroadcasterSymptoms',
    properties: {
        // GETTERS
        issueKeyword: { required: true, type: 'string' },
        input: { requred: true, type: 'string' },

        // SETTERS
        symptomsVar: { requred: true, type: 'string' },
    },
    supportedActions: ['next', 'error']
  }
}

function stringIntegerSort(a, b){
    return parseInt(a) - parseInt(b);
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

async function invoke(context){
    context.logger().info("------ EVALUATE BROADCASTER SYMPTOMS START ------");
    try{
        const {
            issueKeyword, input,
            symptomsVar
        } = context.properties();

        context.logger().info(`osvc.EvaluateBroadcasterSymptoms: issue keyword ${issueKeyword}`);
        context.logger().info(`osvc.EvaluateBroadcasterSymptoms: input ${input}`);

        let sanitizedInput= input.replace(/[,;\-\.]/g,' ').trim();
        let selections = sanitizedInput.split(' ');

        context.logger().info(`osvc.EvaluateBroadcasterSymptoms: selections ${selections}`);

        selections = selections.sort(stringIntegerSort);
        
        let indexes = []
        for(const selection of selections){
            indexes.push(symptomsIndexMap[issueKeyword][selection]);
        }

        const allOfTheAboveIndex = indexes.indexOf(ALL_OF_THE_ABOVE_INDEX);
        if(allOfTheAboveIndex > - 1){
            let symptomKeys = Object.keys(symptomsIndexMap[issueKeyword]);
            symptomKeys.sort(stringIntegerSort);

            symptomKeys = symptomKeys.splice(0, symptomKeys.length - 1);
            indexes = [];
            for(const symptomKey of symptomKeys){
                indexes.push(symptomsIndexMap[issueKeyword][symptomKey]);
            }
        }
        const indexesString = indexes.join('_');
        const symptomsBuildProperties = {
            append: '', prepend: '',
            joinChar: ', '
        }
        let symptoms = buildText(indexesString,
            troubleshootingData['symptoms'],
            symptomsBuildProperties
        );

        context.variable(symptomsVar, symptoms);

        context.keepTurn(true);
        context.transition("next");
    }catch(error){

        context.logger().info(error);
        context.keepTurn(true);
        context.transition("error");
    }

    context.logger().info("------ EVALUATE BROADCASTER SYMPTOMS END ------");
    return;
}

module.exports = {
    metadata: metadata,
    invoke: invoke
}
