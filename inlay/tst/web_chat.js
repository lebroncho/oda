var uniWarranty = {
    serial: ""
};
var TriggerWebChatVariable = false;
var web_chat_btn = document.getElementById('webchat_btn');
web_chat_btn.addEventListener("click", function () {
    TriggerWebChatVariable = true;
});

var pageCountryCookie = null;
var pageChatRegion = null;
var pageSerialNumber = null;
var pageFname = null;
var pageLname = null;
var pageEmail = null;
var pageSubject = null;
var pageOdaPayload = null;
var pageProductCode = null;
var pageProductDesc = null;
var pagePayRepairFee = null;
var isFSG_Country = null;
function runChatInlayLogic(){
    pageCountryCookie = getCookie('country');
    pageChatRegion = getCookie('region');
    pageSerialNumber = getWarrantyInfo('serial') || getCookie('serial_number');
    pageFname = getcustomerInfo('fname');
    pageLname = getcustomerInfo('lname');
    pageEmail = getcustomerInfo('email');
    pageSubject = getSubject();
    pageOdaPayload = getSubject();
    pageProductCode = getWarrantyInfo('productCode'); 
    pageProductDesc = getWarrantyInfo('product');
    pagePayRepairFee = getWarrantyInfo('pay_repair_fee');
}
function checkRegion(region){
    if(region == pageChatRegion){
        return true;
    }else{
        return false;
    }
}
function checkCountry(country){
    if(country == pageCountryCookie){
        return true;
    }else{
        return false;
    }
}
function checkFSG(){
    if(isFSG_Country){
        return true;
    }else{
        return false;
    }
}
function eeLanguageTest(e) {
    return document.documentElement.lang.toLowerCase().includes(e)
}
function triggerWebChat(){
    if(showWebChat==true){
        return true;
    }else{
        return false;
    }
}
function toggleWebChatDisplay(action){
    //var chatButton = document.querySelector(".oda-chat-button.oda-chat-flex");
    var chatButton = document.querySelector(".oda-chat-wrapper.oda-chat-default.oda-chat- oda-chat-collapsed");
    if (chatButton) {
        chatButton.style.display = action;
    }
}
const isChatAllowedqq = () => {
    const allowedPages = {
        'tst2.dev.mysupport.razer.com': ['contact-support', 'answers', 'warranty-support'],
        'tst2.dev.mysupport-pt.razer.com': ['contact-support'],
        'tst2.dev.mysupport-jp.razer.com': ['contact-support']
    }
    const visitorBrowsingCurrentPageView = window.location.pathname.split('/').slice(2, 3)[0];

    if (Object.keys(allowedPages).includes(location.hostname) || allowedPages[location.hostname].includes(visitorBrowsingCurrentPageView)) {
        console.log('chat allowed');
        return true;
    }
    console.log('chat disallowed');
    return false;
}
function getWarrantyInfo(key) {
    if (key == 'family')
        return uniWarranty.product_category;

    // Return the serial number
    if (key == 'serial') {
        if (uniWarranty.serial == undefined || uniWarranty.serial == null) {
            return ''
        }
        else {
            return uniWarranty.serial;
        }
    }

    // Return the product code
    if (key == 'productCode') {
        if (uniWarranty.product_code == undefined ||
            uniWarranty.product_code == null ||
            uniWarranty.product_code == ""
        ) {
            return 'Not Specified';
        }
        else {
            return uniWarranty.product_code;
        }
    }

    // Return the product description
    if (key == 'product') {
        if (uniWarranty.product == undefined || uniWarranty.product == null) {
            return 'Not Specified';
        }
        else {
            return uniWarranty.product;
        }
    }

    // Return razer care information.
    if (key == 'razer_care')
        return uniWarranty.razer_care;
    if (key == 'pay_repair_fee') {
        if (uniWarranty.willing_to_pay == true) {
            return willing_to_pay_ids.willing_to_pay;
        }
        else if (uniWarranty.razer_care == true) {
            return willing_to_pay_ids.razer_care;
        }
        else {
            return willing_to_pay_ids.default;
        }
    }

    // Catch all
    if (key == '' || key == null)
        return uniWarranty;
}

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
const ready = (fn) => {
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}
ready(runChatInlayLogic);