console.log("oda-config-loaded");

//additional checker to separte pay rule and core rule
function isCorePage() {
    return true;
}

//function to use stored fields to generate launch form fields and launch embedded chat with these populated
var loadInlayWithStoredFields = function () {
    var launchFormFields = [
        {
            "hidden": false,
            "name": "FIRST_NAME",
            "required": true,
            "value": "" //getcustomerInfo('fname')
        },
        {
            "hidden": false,
            "name": "LAST_NAME",
            "required": true,
            "value": "" //getcustomerInfo('lname')
        },
        {
            "hidden": false,
            "name": "EMAIL",
            "required": true,
            "value": "" //getcustomerInfo('email')
        },
        {
            "hidden": false,
            "name": "c$chat_serial_num",
            "required": false,
            "value": getWarrantyInfo('serial') || getCookie('serial_number')
        },
        {
            "hidden": true,
            "name": "SUBJECT",
            "required": false,
            "value": getSubject()
        },
        {
            "hidden": true,
            "name": "c$chat_region",
            "required": false,
            "value": getCookie('region')
        },
        {
            "hidden": true,
            "name": "c$web_country",
            "required": false,
            "value": getCookie('country')
        },
        {
            "hidden": true,
            "name": "c$chat_product_sku",
            "required": false,
            "value": getWarrantyInfo('productCode')
        },
        {
            "hidden": true,
            "name": "c$chat_product_desc",
            "required": false,
            "value": getWarrantyInfo('product')
        }
    ];

    var upload_type = ['.bmp', '.doc', '.docx', '.gif', '.jpeg', '.jpg', '.pdf', '.png', '.mp4', '.avi', '.mov', '.mkv', '.JPG', '.JPEG', '.BMP', '.DOC', '.DOCX', '.GIF', '.PDF', '.PNG'];
    //let upload_type = ['.bmp','.gif','.jpeg','.jpg','.pdf','.png','.BMP','.GIF','.JPEG','.JPG','.PDF','.PNG','.mp4','.avi','.mov','.mkv'];

    //function to load embedded chat with prepopulated fields
    var addInlay = function () {
        oit.addOrUpdateInlay(
            "inlay-oracle-chat-embedded", //type of inlay
            "inlay-oracle-chat-embedded", //id of inlay element
            {
                // "queue-id": "270",
                "site-url": "razer--tst2.widget.custhelp.com",
                "inlay-hidden": true,
                "title-icon-url": "https://mysupport.razer.com/euf/assets/images/razerlogo64.png",
                "file-upload-enabled": true,
                "file-upload-valid-types": JSON.stringify(upload_type),
                "launch-form-fields": JSON.stringify(launchFormFields)
            }, //attribute JSON
            undefined, //inlay strings go here
            {
                containerId: "razer-oda-chat", //div id to load inlay in
                replace: true, //to ensure any existing inlay is replaced
                lazy: true // to support loader attributes in config file
            }
        );
    }

    //checks if oit is available, else adds function to load inlay to listener of oit-loaded
    if (window.oit != null) {
        console.log("oit!=null");
        addInlay();
    } else {
        document.addEventListener('oit-loaded', function () {
            console.log("oit-loaded");
            addInlay();
        });
    }
};

//generates the initial subject for ODA skill and intent routing
function getSubject() {
    var subject = '';
    var reason = getWarrantyInfo('family');
    console.log(reason);

    switch (reason) {
        case '7.1 surround sound':
            subject = 'lss71';
            break;
        case 'order':
        case 'orders':
            let data = getStoredData('case_reason');
            if (data > 0 && data != '') {
                subject = 'lRos9 ~' + data + '~';
            } else {
                subject = 'Order Support';
            }
            break;
        case 'audio':
        case 'headset':
        case 'headsets':
        case 'earphone':
        case 'earphones':
        case 'headphone':
        case 'headphones':
            subject = 'lRhs856' + createUtterance();
            break;
        case 'keypad':
        case 'keypads':
        case 'keyboard':
        case 'keyboards':
            subject = 'lRkb891' + createUtterance();
            break;
        case 'mice':
        case 'mouse':
            subject = 'lRps932' + createUtterance('ms');
            break;
        case 'system':
            subject = 'lRlt281' + createUtterance();
            break;
        case 'edge':
            subject = 'Razer Edge Handheld';
            break;
        default:
            subject = 'Hello Support';
            break;
    }

    console.log(subject);
    return subject;
}

//generates a phrase based on selections from the TS page to be used as initial subject in ODA
function createUtterance(key = '') {
    let formData = [];

    formData.push(getStoredData('case_reason'));
    formData.push(getStoredData('case_symptoms', true));
    formData.push(getStoredData('case_connection'));
    if (key == 'ms') formData.push(getStoredData('case_dongle'));
    formData.push(getStoredData('case_solutions', true));

    let phrase = formData.join("|");

    return ' ~' + phrase + '~';
}

function getStoredData(key, multiple = false) {
    const storage = window.localStorage.getItem(key);

    if (storage === 'unspecified') {
        return '';
    }

    const value = JSON.parse(storage);

    if (multiple) {
        if (value.length > 0) {
            return value.join('_');
        } else {
            return '';
        }
    }

    return value;
}

var isCookieSet = function () {
    if (getWarrantyInfo("serial") != "" || getCookie("serial_number") != "") {
        return true;
    }
    return false;
};

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    if (cname == 'serial_number') {
        return '-';
    }

    return "";
}

function getWarrantyInfo(key) {
    let value = 'Unavailable';
    const warrantyInfo = JSON.parse(window.localStorage.getItem('warranty'));
    if (warrantyInfo) {
        const warrantyKeys = Object.keys(warrantyInfo);
        if (warrantyKeys.includes(key)) {
            value = warrantyInfo[key];
        }
    }
    return value.replace('unavailable', 'Unavailable');
}

function getcustomerInfo(fld) {
    let r = '';
    if (RightNow) {
        switch (fld) {
            case 'fname': r = RightNow.Profile.firstName();
                break;
            case 'lname': r = RightNow.Profile.lastName();
                break;
            case 'email': r = RightNow.Profile.emailAddress();
                break;
            default: r = '';
                break;
        }
        console.log(fld + ": " + r);
    }
    return r;
}

//initializes the function that loads the inlay pre-chat fields and settings
loadInlayWithStoredFields();