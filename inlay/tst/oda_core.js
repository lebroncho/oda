let countryCookie = getCookie('country');
let countryRegion = getCookie('region');
var INLAY_ID_EMBEDDED = "inlay-oracle-chat-embedded";
var chatEmbeddedInlay = null;
var uniWarranty = {
    serial: ""
};

function isEmpty(str) {
    return (!str || 0 === str.length || str === undefined);
}

function getSurveyData(chatId, source) {
    var chatData = {
        "chatId": chatId,
        "source": source,
        "country": countryCookie,
        "region": countryRegion,
    };
    return $.ajax({
        type: 'POST',
        url: "/cc/ChatController/GetSurveyData",
        data: chatData,
        dataType: 'json'
    });
}

const INLAY_ID = INLAY_ID_EMBEDDED;
const INLAY_CONTAINER_ID = "razer-oda-chat";
// const allowedPages = ['contact-support','answers'];
// const visitorBrowsingCurrentPageView = window.location.pathname.split('/').slice(2,3)[0];
const upload_type = ['.bmp', '.gif', '.jpeg', '.jpg', '.pdf', '.png', '.BMP', '.GIF', '.JPEG', '.JPG', '.PDF', '.PNG', '.mp4', '.avi', '.mov', '.mkv'];

const isChatAllowed = () => {
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

const addInlayToUx = () => {

    const oitElemCheck = setInterval(() => {
        if (document.getElementById(INLAY_CONTAINER_ID) !== null) {
            clearInterval(oitElemCheck);
            // document.getElementById("razer-oda-chat").style.display = "block";
            console.log("000 enabling oit el");
            document.getElementById(INLAY_CONTAINER_ID).classList.remove("d-none");
            document.getElementById(INLAY_CONTAINER_ID).style.setProperty('display', 'block', 'important');

            var launchFormFields = [{
                "hidden": false,
                "name": "FIRST_NAME",
                "required": true,
                "value": getcustomerInfo('fname')
            },
            {
                "hidden": false,
                "name": "LAST_NAME",
                "required": true,
                "value": getcustomerInfo('lname')
            },
            {
                "hidden": false,
                "name": "EMAIL",
                "required": true,
                "value": getcustomerInfo('email')
            },
            {
                "hidden": false,
                "name": "c$chat_serial_num",
                "required": false,
                "value": getWarrantyInfo('serial') || getCookie('serial_number') //fetching the stored values
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
            },
            {
                "hidden": true,
                "name": "c$pay_repair_fee",
                "required": false,
                "value": getWarrantyInfo('pay_repair_fee')
            }
            ];

            /**
            * Embedded Chat Inlay element
            */
            let chatInlayElemEmbed = document.createElement("inlay-oracle-chat-embedded");
            chatInlayElemEmbed.setAttribute("id", INLAY_ID);
            chatInlayElemEmbed.setAttribute("class", "inlay");
            chatInlayElemEmbed.setAttribute("site-type", "b2c-service");
            chatInlayElemEmbed.setAttribute("site-url", "razer--tst2.widget.custhelp.com");
            chatInlayElemEmbed.setAttribute("site-url", "razer.widget.custhelp.com");
            chatInlayElemEmbed.setAttribute("file-upload-valid-types", JSON.stringify(upload_type));
            if (isCookieSet()) {
                chatInlayElemEmbed.setAttribute("launch-form-fields", JSON.stringify(launchFormFields));
            }
            //document.getElementById(INLAY_CONTAINER_ID).appendChild(chatInlayElemEmbed);
            document.body.appendChild(chatInlayElemEmbed);

            /**
            * OIT Loader Script
            */
            let chatInlayLoader = document.createElement('script');
            chatInlayLoader.setAttribute("id", "oit-loader");
            chatInlayLoader.setAttribute("data-oit-lazy", true);
            chatInlayLoader.setAttribute("src", "https://tst2.dev.mysupport.razer.com/s/oit/latest/common/v0/libs/oit/loader.js?v=" + Date.now());
            chatInlayLoader.setAttribute("data-oit-config-url", "https://tst2.dev.mysupport.razer.com/euf/assets/chat/inlays/oit-config.json");
            chatInlayLoader.setAttribute("async", "");
            document.body.appendChild(chatInlayLoader);

            showChatInlay();
        }
    }, 100); // check every 100ms
}

// 1. Wait for the OIT API to load
const showChatInlay = () => {
    (window.oit && oit.inlayIsLoaded)
        ? waitForChatInlay()
        : document.addEventListener('oit-loaded', waitForChatInlay);
}

// 2. Wait for the Embedded Chat Inlay to load
const waitForChatInlay = () => {

    setTimeout(() => {
        window.oit.load();

        (oit.inlayIsLoaded(INLAY_ID))
            ? fireChatInlayShowEvent()
            : document.addEventListener('inlay-oracle-chat-embedded-loaded', fireChatInlayShowEvent);

    }, 2500);
}

// 3. Show the Embedded Chat Inlay by firing a custom show event
const fireChatInlayShowEvent = () => {
    console.log("inlay-oracle-chat-embedded-loaded OK");
    const showFn = () => {

        if (document.getElementById("chat_button") !== null) {
            $('#chat_button, #chat_button button').attr('disabled', false);
            document.getElementById("chat_button").addEventListener("click", () => {
                window.oit.fire(new oit.CustomEvent('inlay-oracle-chat-embedded-show', {
                    detail: { id: INLAY_ID }
                }));
            });
        }

        var buttons = document.getElementsByName('chat_button');

        // Iterate through the buttons and add event listeners
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                // Your event handling code here
                window.oit.fire(new oit.CustomEvent('inlay-oracle-chat-embedded-show', {
                    detail: { id: INLAY_ID }
                }));
            });
        }

        const inlayLaunchForm = window.document.getElementById(INLAY_ID);
        const chatEmbeddedInlay = inlayLaunchForm.contentDocument || inlayLaunchForm.contentWindow.document;
        const inlayHead = chatEmbeddedInlay.getElementsByTagName('head')[0];

        // inject custom styling overrides
        let link = document.createElement('link');
        link.rel = "stylesheet";
        link.href = "https://tst2.dev.mysupport.razer.com/euf/assets/chat/inlays/oda.css?v=" + Date.now();
        link.type = "text/css";

        inlayHead.appendChild(link);

        let scriptTag = document.createElement("script");
        scriptTag.innerHTML =
            'var s_ajaxListener=new Object;s_ajaxListener.tempOpen=XMLHttpRequest.prototype.open,s_ajaxListener.tempSend=XMLHttpRequest.prototype.send,s_ajaxListener.callback=function(){},XMLHttpRequest.prototype.open=function(e,t){if(!e)e="";if(!t)t="";s_ajaxListener.tempOpen.apply(this,arguments),s_ajaxListener.method=e,s_ajaxListener.url=t,"get"==e.toLowerCase()&&(s_ajaxListener.data=t.split("?"),s_ajaxListener.data=s_ajaxListener.data[1])},XMLHttpRequest.prototype.send=function(e,t){if(!e)e="";if(!t)t="";s_ajaxListener.tempSend.apply(this,arguments),this.addEventListener("load",function(){s_ajaxListener.url.includes("/requestEngagement")&&(console.log("engagementId",JSON.parse(this.responseText).engagementId),parent.window.engagementId=JSON.parse(this.responseText).engagementId)},!1),"post"==s_ajaxListener.method.toLowerCase()&&(s_ajaxListener.data=e),s_ajaxListener.callback()};';

        chatEmbeddedInlay.body.append(scriptTag);

        const storageEventHandler = (event) => {
            if (event.key === "inlay-oracle-chat-embedded-chatStatus") {
                let status = JSON.parse(event.newValue);

                if (!isEmpty(status.chatStatus)) {

                    if (status.chatStatus === "connected") {
                        var surv = chatEmbeddedInlay.getElementById("chatSurvey");
                        if (surv) {
                            surv.remove();
                        }
                    }

                    if (status.chatStatus === "disconnected") {

                        setTimeout(function () {
                            var getSurveyDataPromise = getSurveyData(window.engagementId, "core");

                            getSurveyDataPromise.then(function (response) {

                                var _accountID = response.agentId;
                                var _surveyBaseUrl = response.surveyUrl;

                                var surveyUrl = (_accountID > 0) ? _surveyBaseUrl +
                                    `?chat_id=${window.engagementId}&p_acct_id=${_accountID}` : _surveyBaseUrl +
                                `?chat_id=${window.engagementId}`;

                                var iframe = document.createElement('iframe');
                                iframe.id = "chatSurvey";
                                iframe.setAttribute("name", "chatSurvey");
                                iframe.setAttribute("src", surveyUrl);
                                iframe.setAttribute("scrolling", "no");
                                iframe.setAttribute("allowfullscreen", "");
                                iframe.style.position = "relative";
                                iframe.style.border = "0";
                                iframe.style.height = "560px";
                                iframe.style.width = "100%";
                                iframe.style.left = "0";
                                iframe.style.top = "0";

                                var iframeDiv = document.createElement('div');
                                iframeDiv.style.position = "initial";
                                iframeDiv.style.overflow = "hidden";

                                iframeDiv.appendChild(iframe);

                                var target = chatEmbeddedInlay.getElementsByClassName("oit-inlay-body")[2]
                                    .getElementsByClassName("transcript-message-container")[0];
                                target.appendChild(iframeDiv);

                                // scroll the container
                                var objDiv = chatEmbeddedInlay.getElementsByClassName("oit-inlay-body")[2];
                                objDiv.scrollTop = objDiv.scrollHeight;
                                // setTimeout(function () {
                                // }, 500);
                            });
                        }, 2500);
                    }
                }
            }
        }
        window.addEventListener("storage", storageEventHandler, false);
    }
    setTimeout(showFn, 0);
}

const runChatInlayLogic = () => {
    console.log("000 ready-1");
    if (isCorePage() && isChatAllowed()) {
        console.log("000 ready-2");
        addInlayToUx();
        console.log("000 addInlayToUx OK");
    }
}

const ready = (fn) => {
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
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

ready(runChatInlayLogic);
