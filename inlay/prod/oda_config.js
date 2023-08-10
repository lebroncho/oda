//additional checker to separte pay rule and core rule
function isCorePage() {
    return true;
}

//generates the initial subject for ODA skill and intent routing
function getSubject() {
    var subject = '';
    var reason = getWarrantyInfo('family');
    var region = getCookie('region');

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
            subject = 'lRps932' + createUtterance();
            break;
        case 'system':
            if (region == 'odaap' || region == 'odaeu') {
                subject = 'lRlt281' + createUtterance();
            } else {
                subject = 'Hello Support';
            }
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
    }
    return r;
}