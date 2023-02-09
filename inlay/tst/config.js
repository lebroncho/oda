//--------------------Scenario 1----------------------------
connectLater = null;

//function to store data customer enters in the customer pages
//as an example serial Number and incident type are stored here
var storeFields = function(){
    localStorage.setItem("serialNumber", $("#serialNum").val());
}

//function to use stored fields to generate launch form fields and launch embedded chat with these populated
var loadInlayWithStoredFields = function(){
    var launchFormFields = [
        {
            "hidden": false,
            "name": "FIRST_NAME",
            "required": true,
            "value": ""
        },
        {
            "hidden": false,
            "name": "LAST_NAME",
            "required": true,
            "value": ""
        },
        {
            "hidden": false,
            "name": "EMAIL",
            "required": true,
            "value": ""
        },
        {
            "hidden": false,
            "name": "c$chat_serial_num",
            "required": false,
            "value": localStorage.getItem("serialNumber") //fetching the stored values
        },
        {
            "hidden": true,
            "name": "SUBJECT",
            "required": false,
            "value": "hello support!"
        }
    ];

    //function to load embedded chat with prepopulated fields
    var addInlay = function(){
        oit.addOrUpdateInlay(
            "inlay-oracle-chat-embedded", //type of inlay
            "inlay-oracle-chat-embedded", //id of inlay element
            {
                "queue-id": "189",
                "site-url": "razer--tst1.widget.custhelp.com",
                "inlay-hidden": true,
                "title-icon-url": "https://tst1.dev.mysupport.razer.com/euf/assets/images/razerlogo30.png",
                "file-upload-enabled": true,
                "launch-form-fields": JSON.stringify(launchFormFields)
            },//attribute JSON
            undefined, //inlay strings go here
            {
                containerId: "chatDiv", //div id to load inlay in
                replace: true, //to ensure any existing inlay is replaced
                lazy: true // to support loader attributes in config file
            }
        );
    }

    //checks if oit is available, else adds function to load inlay to listener of oit-loaded
    if (window.oit!=null) {
        addInlay();
    } else {
        document.addEventListener('oit-loaded', function(){
            addInlay();
        });
    }

}

//clear all the locally stored data used for prepopulate
var clearStoredFields = function(){
    localStorage.removeItem("serialNumber");
}


//--------------------Scenario 2----------------------------

//Used to store the data from the ODA chat
//Should be executed AFTER Chat is Connected.
var storePrevChatData = function(){
    var localData = JSON.parse(localStorage.getItem("inlay-oracle-chat-embedded-chatLaunchData"));

    if(localData!=null){
        var data = localData.ChatLaunchData;

        //keeping all launch form fields as hidden allows chat to directly connect instead of
        //showing the fields and waiting for user to start the chat
        var launchFormFields = [
            {
                "name": "FIRST_NAME",
                "hidden": true,
                "required": true,
                "value": data.firstName
            },{
                "name": "LAST_NAME",
                "hidden": true,
                "required": true,
                "value": data.lastName
            },{
                "name": "SUBJECT",
                "hidden": true,
                "required": true,
                "value": data.subject
            },{
                "name": "EMAIL",
                "hidden": true,
                "required": true,
                "value": data.email
            }];

        var customFields = JSON.parse(data.customFields);

        //logic to parse custom data fields
        for(i in customFields){
            launchFormFields.push(
                {
                    "hidden": true,
                    "required": true,
                    "name": "c$"+i.split('.')[3],
                    "value": customFields[i]
                });
        }

        localStorage.setItem("prevChatData", JSON.stringify(launchFormFields));
    }

}


//Used to set "connectLater" to true, when user selects the option in the inlay
var setConnectLater = function(){
    localStorage.setItem("connectLater",true);
};

//function whose return value is used as a EE rule condition to see if user opted to connect later
var isConnectLater = function(){
    if(localStorage.getItem("connectLater")=="true"){
        return true;
    }
    return false;
};

//function whose return value is used as a EE rule condition to see if user opted to connect later
var isNotConnectLater = function(){
    if(localStorage.getItem("connectLater")=="true"){
        return false;
    }
    return true;
};

//function to load an embedded chat inlay with data from the ODA chat, stored earlier using storePrevChatData
//looks for this data in localStorage variable prevChatData
var loadInlayWithPrevChatData = function(){

    //function to load embedded chat with all launch form fields pre-populated
    var addInlay = function(){
        oit.addOrUpdateInlay(
            "inlay-oracle-chat-embedded", //type of inlay
            "inlay-oracle-chat-embedded", //id of inlay element
            {
                "site-url": "razer--tst1.widget.custhelp.com",
                "inlay-hidden": true,
                "file-upload-enabled": true,
                "launch-form-fields": localStorage.getItem("prevChatData")
            },//attribute JSON
            undefined, //inlay strings go here
            {
                containerId: "chatDiv", //div id to load inlay in
                replace: true, //to ensure any existing inlay is replaced
                lazy: true // to support loader attributes in config file
            }
        );
    }

    //checks if oit is available, else adds function to load inlay to listener of oit-loaded
    console.log(window.oit);
    if (window.oit!=null) {
        addInlay();
    }
    else {
        document.addEventListener('oit-loaded', function(){
            addInlay();
        });
    }
}

//clear all the locally stored data from previous chat and the flag to connect later
var clearPrevChat = function(){
    localStorage.removeItem("connectLater");
    localStorage.removeItem("prevChatData");
}


//------------Scenario 2: Load PAC with dynamic Queue Id------------------

var computeQueueId = function(){
    // var incidentType = localStorage.getItem("incidentType");
    var incidentType = "n/a";
    var qId;
    switch(incidentType){
        case "Razer Mice": qId = 3;
            break;
        default: qId = 190;
    }
    return qId;
}

var loadPACWithDynamicQueueId = function() {
    //function to load PAC chat with queue Id generated based on incident type
    var addInlay = function(){
        oit.addOrUpdateInlay(
            "inlay-oracle-chat-pac", //type of inlay
            "inlay-oracle-chat-pac", //id of inlay element
            {
                "site-url": "razer--tst1.widget.custhelp.com",
                "confirm-action": "fireEvent",
                "queue-id": computeQueueId()
            },//attribute JSON
            undefined, //inlay strings go here
            {
                containerId: "chatDiv", //div id to load inlay in
                replace: true //to ensure any existing inlay is replaced
            }
        );
    }

    //checks if oit is available, else adds function to load inlay to listener of oit-loaded
    console.log(window.oit);
    if (window.oit!=null) {
        addInlay();
    }
    else {
        document.addEventListener('oit-loaded', function(){
            addInlay();
        });
    }
}

//------------Scenario 2.5: Load Embedded with Offer-Enabled, use dynamic queue-id---------
//------------and polling max queue size to check new definition of Availability-----------

//function to load an embedded chat inlay with data from the ODA chat, stored earlier using storePrevChatData
//looks for this data in localStorage variable prevChatData
var loadInlayWithPrevChatDataWithOffer = function(){

    var queueId = computeQueueId(); //uses appropriate function to calculate which agent queue to route to

    //function to load embedded chat with all launch form fields pre-populated
    var addInlay = function(){
        oit.addOrUpdateInlay(
            "inlay-oracle-chat-embedded", //type of inlay
            "inlay-oracle-chat-embedded", //id of inlay element
            {
                "site-url": "razer--tst1.widget.custhelp.com",
                "inlay-hidden": true,
                "file-upload-enabled": true,
                "offer-enabled": true, //displays proactive offer
                "polling-enabled": true,
                "polling-max-queue-size": 4, //to ensure availability in the restricted sense
                "launch-form-fields": localStorage.getItem("prevChatData"),
                "queue-id": queueId, //as returned by computeQueueId
                "title-icon-url": "https://tst1.dev.mysupport.razer.com/euf/assets/images/razerlogo30.png"
            },//attribute JSON
            undefined, //inlay strings go here
            {
                containerId: "chatDiv", //div id to load inlay in
                replace: true, //to ensure any existing inlay is replaced
                lazy: true // to support loader attributes in config file
            }
        );
    }

    //checks if oit is available, else adds function to load inlay to listener of oit-loaded
    if (window.oit!=null) {
        oit.removeInlay("inlay-oracle-chat-pac"); //to remove the dummy PAC
        addInlay();

    }
    else {
        document.addEventListener('oit-loaded', function(){
            oit.removeInlay("inlay-oracle-chat-pac"); //to remove the dummy PAC
            addInlay();

        });
    }
}

var loadInlayAfterConnectLater = function () {
    loadInlayWithPrevChatDataWithOffer();
    oit.load("inlay-oracle-chat-embedded");
}


function setWithExpiry(key, value, ttl) {
    const now = new Date()

    // `item` is an object which contains the original value
    // as well as the time when it's supposed to expire
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item))
}


