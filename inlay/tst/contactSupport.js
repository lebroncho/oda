const typesOfGtmTriggers = {
    invalid: "warranty_sn_invalid",
    invalidContactUsLink: "warranty_sn_invalid_contact_us",
    inWarranty: "warranty_sn_valid",
    outOfWarranty: "warranty_sn_out_of_warranty",
    bypassed: "warranty_sn_bypassed",
    bypassed2: "warranty_sn_bypassed2",
};

let warranty = JSON.parse(window.localStorage.getItem("warranty"));

let gtmTriggerType = "";
let has_redirect = false;
const required_warranty_support = [
    'us', 'ca', 'be', 'dk', 'fi', 
    'ie', 'eu', 'lu', 'no', 'nl', 
    'hr', 'cy', 'cz', 'ee', 'gr',
    'hu', 'it', 'lv', 'mt', 'sk', 'si', 'ch', 
    'at', 'pl', 'pt', 'se', 'gb', 
    'sg', 'th', 'au', 'hk', /*'jp', */
    'my', 'nz', 'ph', 'kr', 'tw', 
    'za', 'ch', 'ph', 'nz', 'ap', 
    'bh', 'eg','iq', 'kw', 'lb', 
    'om', 'qa', 'sa', 'ae', 'cn'];
// const required_warranty_support = ['us', 'ca'];

const productSubFamily = {
    '7.1 surround sound': 70,
    'razer id': 268,
    'cortex': 73,
    'synapse': 76,
    'streamer_companion_app': 236,
    'thx_spatial_audio': 269,
}

const searchParamSubFamilyMap = {
    "ss71": "7.1 surround sound"
}

function getSessionCookieOnce(key = '_contactType') {
    const cookies = document.cookie.split('; ').filter(item => item.startsWith(key));
    
    if(cookies.length > 0) {
        document.cookie = `${cookies[0]}; path=/; domain=razer.com; max-age=0`
        return cookies[0].split('=')[1];
    }

    return false;
}

const contactTypeCookieValue = getSessionCookieOnce();

if( newWarrantObj = overwriteWarrantyObj()) {
    warranty = newWarrantObj ? newWarrantObj : warranty
    window.localStorage.setItem(
                        "warranty",
                        JSON.stringify(warranty)
                    );
}

function overwriteWarrantyObj() {
    const searchParamKey = 'i'; // sub product family
    const overwriteType = Object.keys(productSubFamily)
    const searchParams = new URL(window.location).searchParams;
    let inputType = null;
    
    if(contactTypeCookieValue) {
        inputType = contactTypeCookieValue
    } else if(searchParams.get(searchParamKey)) {
        inputType = searchParams.get(searchParamKey).toLowerCase();
    }

    // const inputType = (searchParams.get(searchParamKey))? searchParams.get(searchParamKey).toLowerCase() : null;
    
    let warrantyObj = null;
    const subFamily = searchParamSubFamilyMap[inputType] ? searchParamSubFamilyMap[inputType] : inputType; 
    const found = overwriteType.find(item => item.toLowerCase().trim() === subFamily);

    if(found && found.length > 0 ) {
        warrantyObj = {
        "family": subFamily,
        "serial": "unavailable",
        "ts": Date.now(),
        "skip": true,
        "disable": false,
        "cannotLocateSN": false,
        "fromInvalidContactUsLink": false
        }
    }

    return warrantyObj;
}

if (required_warranty_support.includes(currentCountry? currentCountry : 'us')) {
    if (!window.localStorage.getItem("warranty") || hasExpired(warranty.ts)) {
        console.log("expired ts");
        window.localStorage.removeItem("warranty");
        window.location = `https://${window.location.host}/app/warranty-support/${window.location.search}`;
        has_redirect = true;
    } else {
        if (warranty.hasOwnProperty("inWarranty") && warranty.inWarranty) {
            gtmTriggerType = "inWarranty";
        } else if (
            warranty.hasOwnProperty("inWarranty") &&
            warranty.inWarranty === false
        ) {
            gtmTriggerType = "outOfWarranty";
        } else if (
            warranty.hasOwnProperty("cannotLocateSN") &&
            warranty.cannotLocateSN
        ) {
            gtmTriggerType = "bypassed2";
        } else if (
            warranty.hasOwnProperty("fromInvalidContactUsLink") &&
            warranty.fromInvalidContactUsLink
        ) {
            gtmTriggerType = "invalidContactUsLink";
        } else if (warranty.hasOwnProperty("skip") && warranty.skip) {
            gtmTriggerType = "bypassed";
        }
    }
}

$(document).ready(function () {
    if (warranty) {
        if (warranty.family === "orders" && warranty.skip === true) {
            $(".br").show();
        }

        if(warranty.family === 'mouse' && !['odaap', 'odaeu', 'eu', 'ap', 'me'].includes(Cookies.get('region'))) {
            document.querySelector('.section-email').style.display = "none";
        }

        if (!warranty.disable) {
            let serialText =
                warranty.serial !== undefined
                    ? `<p><strong>Serial number:</strong> ${warranty.serial}</p>`
                    : ``;
            let productText =
                warranty.product !== undefined
                    ? `<p><strong>Product:</strong> ${warranty.product}</p>`
                    : ``;
            let outOfWarrantyText = `
                <div class="warranty-status-container">
                <h2 style="font-weight: 600;">Your product is no longer covered by Razer's Limited Warranty</h2>
                ${serialText}${productText}
            </div>`;

            const inWarrantyText = `<div class="warranty-status-container">
                <h2 style="font-weight: 600;">Your product is covered under Razer's Limited Warranty</h2>
                ${serialText}${productText}
                <!-- <p style="padding: 1.5rem 1rem 0 1rem;text-align:left;">
                    If you believe the information shown for your product is incorrect, please contact us with proof of purchase.<br><br>
                    For details on our warranty support, please review our <a href="https://support.razer.com/supportcost" traget="_blank">warranty terms and conditions</a>.
                </p> -->
            </div>`;

            if (warranty.skip === false)
                $(".warranty-status")
                    .html(
                        warranty.inWarranty ? inWarrantyText : outOfWarrantyText
                    )
                    .show();

            if(warranty.inWarranty === true) {
                $('.topic-in-warranty').removeClass('hide');
            } else {
                $('.topic-in-warranty').remove();
            }

            if (warranty.skip === true || warranty.inWarranty === true) {
                $("#assisted, .support-assisted").removeClass("hide");
                $(".unassisted-content").hide();
                $(".assisted-content-oow").hide();
                $(".assisted-content").show();
            } else {
                $(".assisted-content").hide();
                $(".unassisted-content").hide();
                $(".assisted-content-oow").show();
                $("#assisted, .support-assisted").addClass("hide");
                $("#unassisted").removeClass("hide");
            }
        } else {
            $("#assisted-type").css("min-height", "250px");
            $(".assisted-content-oow").hide();
            $(".assisted-content").hide();
            $(".unassisted-content").show();
            $("#assisted, .support-assisted").addClass("hide");
            $("#unassisted").removeClass("hide");
        }

        switch (warranty.family) {            
            // remove for 'Orders from Razer.com'
            case "orders":
            // case "7.1 surround sound":
                $(".section-call").remove();
                break;

            case "7.1 surround sound":
                $(".section-email").remove();
                break;

            default:
                break;
        }

        // if (warranty.family === "orders") {
        //     // remove for 'Orders from Razer.com'
        //     $(".section-call").remove();
        // }
    }
    if (!has_redirect) $(".contact-support").removeClass("hide");

    const productFamily = {
        "peripheral-accessory": 413,
        accessory: 415,
        audio: 413,
        broadcaster: 413,
        controller: 413,
        displays: 419,
        earphones: 413,
        headphones: 413,
        headset: 413,
        keyboards: 413,
        mobile: 420,
        mouse: 413,
        "razer id": 425,
        "thx audio": 425,
        "mouse mat": 413,
        networking: 419,
        "osvr wearables": 413,
        speaker: 413,
        "swag / gear": 413,
        "razer software": 425,
        software: 425,
        system: 418,
        orders: 410,
        'razer chair': 417,
        chair: 417,
        anzu: 416,
        console: 414,
        razercare: 426,
        desktops: 419,
        "7.1 surround sound": 425,
        'cortex': 425,
        'synapse': 425,
        'streamer_companion_app': 425,
        'thx_spatial_audio': 425,
    };

    const localesForm = {
        "at":'https://mysupport-du.razer.com',
        "cn": 'https://mysupport-chsi.razer.com/',
        "de": 'https://mysupport-du.razer.com',
        "es": 'https://mysupport-sp.razer.com',
        "fr": 'https://mysupport-fr.razer.com',
        "hk": 'https://mysupport-chtr.razer.com',
        "it": 'https://mysupport-it.razer.com',
        "jp": 'https://mysupport-jp.razer.com',
        "kr": 'https://mysupport-ko.razer.com',
        "be": 'https://mysupport-du.razer.com',
        "nl": 'https://mysupport-du.razer.com',
        "pl": 'https://mysupport-po.razer.com',
        "pt": 'https://mysupport-pt.razer.com',
        "tw": 'https://mysupport-chtr.razer.com',
    };

    $("#email-us").click(function (e) {
        const searchParams = new URL(window.location).searchParams;
        let formAction = `https://mysupport.razer.com/${searchParams.toString().length > 0? '?'+searchParams.toString(): ''}`;
        if (localesForm.hasOwnProperty(Cookies.get("country"))) {
            formAction = localesForm[Cookies.get("country")];
        }
        e.preventDefault();
        var form = document.createElement("form");
        form.style.visibility = "hidden";
        form.method = "POST";
        form.action = formAction;
        if(Cookies.get('region') !== 'me') {
            form.target = "_blank";
        }

        // if (["us", "ca"].includes(Cookies.get("country"))) {
        if (warranty && warranty.hasOwnProperty('serial') && warranty["serial"] !== "undefined") {
            var snInput = document.createElement("input");
            snInput.type = "hidden";
            snInput.name = "Incident_CustomFields_CO1_serial_num";
            snInput.value = warranty["serial"];
            form.appendChild(snInput);
        }

        if (warranty &&
            warranty.hasOwnProperty('family') &&
            warranty["family"] !== "undefined" &&
            productFamily[warranty["family"]] !== "undefined"
        ) {
            var witInput = document.createElement("input");
            witInput.type = "hidden";
            witInput.name = "Incident_CustomFields_c_web_incident_type";
            witInput.value = productFamily[warranty["family"].toLowerCase()];
            form.appendChild(witInput);

            if (productSubFamily[warranty["family"]]) {
                //web_ts_sub_category
                var witInput = document.createElement("input");
                witInput.type = "hidden";
                witInput.name = "web_ts_sub_category";
                witInput.value = productSubFamily[warranty["family"]];
                form.appendChild(witInput);
            }
        }
        // }

        if (Cookies.get("country")) {
            var countryInput = document.createElement("input");
            countryInput.type = "hidden";
            countryInput.name = "country";
            countryInput.value = Cookies.get("country");
            form.appendChild(countryInput);
        }

        document.body.appendChild(form);
        form.submit();
    });

    $("#assisted li > a, #unassisted li > a, .gtm_insider2, #show-help").click(
        function (event) {
            // event.preventDefault();
            const supportLabel = $(this).data("label");
            if (supportLabel) {
                const triggerName = `${typesOfGtmTriggers[gtmTriggerType]}_${supportLabel}`;
                triggerGtmClass(triggerName);
            }
        }
    );
});

function showHelp(lol) {
    $(".unassisted-content").hide();
    $(".assisted-content-oow").hide();
    $(".assisted-content").show();
    $("#unassisted").addClass("hide");
    $("#assisted, .support-assisted").removeClass("hide");
}

function hasExpired(ts) {
    const timeDelta = Date.now() - ts;
    const timelimit = 1000 * 60 * 5; // limit to 5 mins
    if (timeDelta < timelimit) {
        return false;
    }

    window.localStorage.removeItem("warranty");

    return true;
}

function triggerGtmClass(trigger) {
    const aTag = document.createElement("a");
    const tagId = `gtm-trigger-${Date.now()}`;
    aTag.classList.add(trigger);
    aTag.id = tagId;
    aTag.href = "javascript:void(0)";

    // aTag.addEventListener('click', function(event) {
    //     event.preventDefault();
    //     console.info(`trigger >>> ${trigger}`);
    // });

    document.body.append(aTag);

    aTag.click();
    document.querySelectorAll(`#${aTag.id}`).forEach(function (a) {
        a.remove();
    });
}

$(document).ready(function () {
    function withinChatOperatingHours(regionData) {
        const region = regionData.replace("oda", "");
        const regionOperatingHours = {
            // region: [startHours, endHours, timeoffset]
            ap: [9, 18, 8], // (0900h - 1800h SGT(GMT+8))
            eu: [9, 18, 1], // (0900h - 1800h CET(GMT+1))
            us: [6, 22, -8], // (0600h - 2200h PST(GMT-8))
        };

        const currentDate = new Date();
        const regionTimeoffset = regionOperatingHours[region][2] * 60; // in minutes
        const regionStartHour = regionOperatingHours[region][0];
        const regionEndHours = regionOperatingHours[region][1];

        currentDate.setUTCMinutes(
            currentDate.getUTCMinutes() + regionTimeoffset
        ); // add region timeoffset to UTC Date

        currentRegionHours = currentDate.getUTCHours(); // get region Hours

        if (
            currentRegionHours >= regionStartHour &&
            currentRegionHours < regionEndHours
        ) {
            // check if within region operating hours
            return true;
        }

        return false;
    }

    function disableHrefClick() {
        return false;
    }

    function toggleChatButton(inOperatingHours) {
        if (inOperatingHours) {
            $(".section-chat .mdc-button").css("background-color", "");
            $(".section-chat > a").off("click", disableHrefClick);
        } else {
            $(".section-chat > a").on("click", disableHrefClick);
            $(".section-chat .mdc-button").css("background-color", "#999");
        }
    }

    var region = window.Cookies().region || "";
    region = region.replace("oda", "");
    const regionsToCheck = ["ap", "eu"];

    if (regionsToCheck.includes(region)) {
        inChatOperatingHours = withinChatOperatingHours(region);
        toggleChatButton(inChatOperatingHours);
    }
});
