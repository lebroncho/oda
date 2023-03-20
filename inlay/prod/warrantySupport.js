function warrantySupport() {
    var serialNumber = mdc.textField.MDCTextField.attachTo(
        document.querySelector(".mdc-text-field")
    );
    var submitButton = document.querySelector(".mdc-button");
    var logDebug = false;
    var urlRegex =
        /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,:.]+$/g;
    var typesOfTriggers = {
        invalid: "warranty_sn_invalid",
        invalidContactUsLink: "warranty_sn_invalid_contact_us",
        inWarranty: "warranty_sn_valid",
        outOfWarranty: "warranty_sn_out_of_warranty",
        bypassed: "warranty_sn_bypassed",
        bypassed2: "warranty_sn_bypassed2",
    };
    var familyNotRequired = [
        "software",
        "mouse mat",
        "wearables",
        "orders",
        "razer id thx audio",
        "chair",
        "anzu",
    ];
    var disableAssistedList = ["software", "mouse mat", "wearables"];
    var apiHost = `${window.location.host}`;

    var categoriesSelectOptions = {
        services: [
            {
                id: "https://mysupport.razer.com/app/self-help/index",
                // submitText: "Razer Gold Support",
                reason: "services",
                text: "Get System Image Recovery",
                selected: true,
            },
            {
                id: "https://mysupport.razer.com/app/self-help/surround-sound/search",
                // submitText: "Razer Gold Support",
                reason: "services",
                text: " 7.1 Surround Sound Activation Code",
            },
            {
                id: "https://mysupport.razer.com/app/self-help/virtual-ring-light/search",
                // submitText: "Razer Gold Support",
                reason: "services",
                text: "Virtual Ring Light Activation Code",
            },
            {
                id: "razer id",
                serialValidation: false,
                reason: "services",
                text: "Razer ID",
            },
            {
                id: "razercare",
                serialValidation: false,
                reason: "services",
                text: "RazerCare",
            },
            {
                id: "https://gold.razer.com/ticket-inbox/submit",
                submitText: "Razer Gold Support",
                reason: "services",
                text: "Razer Gold",
            },
            {
                id: "https://www.respawnbyrazer.com/contact-us",
                submitText: "Respawn Support",
                reason: "services",
                text: "Razer RESPAWN",
            },
        ],
        software: [
            {
                id: "https://mysupport.razer.com/app/self-help/surround-sound/search",
                reason: "software",
                text: "Razer 7.1 Surround Sound",
                selected: true,
            },
            {
                id: "cortex",
                serialValidation: false,
                reason: "software",
                text: "Razer Cortex",
            },
            {
                id: "cortex games",
                serialValidation: false,
                reason: "software",
                text: "Razer Cortex Games",
            },
            {
                id: "synapse",
                serialValidation: false,
                reason: "software",
                text: "Razer Synapse",
            },
            {
               id: "axon",
               serialValidation: false,
               reason: "software",
               text: "Razer Axon",
            },
            {
                id: "streamer_companion_app",
                serialValidation: false,
                reason: "software",
                text: "Razer Streamer Companion App",
            },
            {
                id: "thx_spatial_audio",
                serialValidation: false,
                reason: "software",
                text: "THX Spatial Audio",
            },
            {
                id: "chroma rgb app",
                serialValidation: false,
                reason: "software",
                text: "Razer Chroma RGB App",
            },
            {
                id: "audio app",
                serialValidation: false,
                reason: "software",
                text: "Razer Audio App",
            },
        ],
        system: [
            // {
                // id: "system",
                // reason: "system",
                // text: "Laptops",
                // selected: true,
            // },
            {
                id: "desktops",
                reason: "desktops",
                text: "Tomahawk Desktop & Case",
            },
            {
                id: "desktops",
                reason: "desktops",
                text: "Razer Core",
            },
            {
                id: "displays",
                reason: "displays",
                text: "Monitor (Raptor)",
            },
            {
                id: "desktops",
                serialValidation: false,
                reason: "system",
                text: "Accessories & Components",
            },
        ],
        peripheral: [
            {
                id: "mouse",
                reason: "peripheral",
                text: "Mouse",
                selected: true,
            },
            {
                id: "keyboards",
                reason: "peripheral",
                text: "Keyboard & Keypad",
            },
            {
                id: "earphones",
                reason: "peripheral",
                text: "Headsets, Microphone, Earbuds",
            },
            {
                id: "broadcaster",
                reason: "peripheral",
                text: "Streaming (Kiyo, Ripsaw, Seiren, Speakers, Broadcasting Devices)",
            },
            {
                id: "controller",
                reason: "peripheral",
                text: "Razer Controller",
            },
            {
                id: "peripheral-accessory",
                serialValidation: false,
                reason: "peripheral",
                text: "Accessories",
            },
        ],
        mobile: [
            {
                id: "https://mysupport.razer.com/app/answers/detail/a_id/3759",
                reason: "mobile",
                text: "Razer Phones",
            },
            {
                id: "https://mysupport.razer.com/app/answers/detail/a_id/3758",
                reason: "mobile",
                text: "Razer Phones 2",
            },
            {
                id: "cortex games",
                serialValidation: false,
                reason: "mobile",
                text: "Razer Cortex Games",
            },
            {
                id: "anzu",
                serialValidation: false,
                reason: "mobile",
                text: "Smart Glasses (Anzu)",
                selected: true,
            },
            {
                id: "chroma rgb app",
                serialValidation: false,
                reason: "mobile",
                text: "Razer Chroma RGB App",
            },
            {
                id: "audio app",
                serialValidation: false,
                reason: "mobile",
                text: "Razer Audio App",
            },
            {
                id: "edge",
                serialValidation: false,
                reason: "mobile",
                text: "Razer Edge",
            }
        ],
    };

    function preloadSelection(crSelect) {
        const searchParamMaps = {
            // key: [categoriesSelectOptions[key], categoriesSelectOptions[key].id]
            'cortex': ['software', 'cortex'],
            'synapse': ['software', 'synapse'],
            'cortex games': ['software', 'cortex games'],
            'cortex games mobile': ['mobile', 'cortex games'],
        }

        const searchParams = new URLSearchParams(location.search)
        const preloadParam = searchParams.get('cr')

        if(preloadParam && searchParamMaps[preloadParam]) {
            const [key, id] = searchParamMaps[preloadParam]
            
            if(!categoriesSelectOptions[key]) return;
            
            categoriesSelectOptions[key].forEach((item, idx) => {
                delete item.selected
                if(id === item.id) {
                    item.selected = 'selected'
                }
            })

            crSelect.find('option[selected="selected"]')[0]?.removeAttribute('selected')
            crSelect.find(`option[data-category="${key}"]`)[0]?.setAttribute('selected', 'selected')
            crSelect.trigger('change')
        }
    }

    function updateForm(contactReasonObj) {
        // submitButton.disabled = contactReasonObj.selectedIndex <= 0 ? true : false;
        if (contactReasonObj.submitDisabled) {
            submitButton.setAttribute("disabled", true);
        } else {
            submitButton.removeAttribute("disabled");
        }

        document.querySelector(".error-msg").classList.add("hide");
        findSerialLink = document.querySelector(".find-serial");
        // findIMEILink = document.querySelector(".find-imei");
        cantLocateSerialNumberField = document.querySelector(
            ".cant-locate-sn-field"
        );
        request71SurroundSoundCodeField = document.querySelector(
            ".request-71ss-activation-code-field"
        );
        // submitButtonText = 'Submit';

        if (contactReasonObj.value === "earphones") {
            cantLocateSerialNumberField.classList.remove("hide");
            request71SurroundSoundCodeField?.classList.remove("hide");
        } else {
            cantLocateSerialNumberField.classList.add("hide");
            request71SurroundSoundCodeField?.classList.add("hide");
        }

        // if (familyNotRequired.includes(e.detail.value)) { // Check if serial number validation needed
        if (!contactReasonObj.serialValidation) {
            serialNumber.required = false;
            serialNumber.root_.parentElement.classList.add("hide");
            findSerialLink.classList.add("hide");
            // findIMEILink.classList.add("hide");
        } else if (contactReasonObj.value.match(urlRegex)) {
            serialNumber.required = false;
            // submitButtonText = contactReasonsSelect.getSelectAdapterMethods_().getSelectedMenuItem().dataset.submitText;

            serialNumber.root_.parentElement.classList.add("hide");
            findSerialLink.classList.add("hide");
            // findIMEILink.classList.add("hide");
        } else if (contactReasonObj.index === 0) {
            serialNumber.root_.parentElement.classList.add("hide");
            findSerialLink.classList.add("hide");
            // findIMEILink.classList.add("hide");
        } else {
            serialNumber.required = true;
            serialNumberLabel = serialNumber.root_.parentElement
                .getElementsByClassName("label")
                .item(0);
            // if (contactReasonObj.value === "mobile") {
            //     if (serialNumberLabel)
            //         serialNumberLabel.innerText += " / IMEI number";
            //     serialNumber.input_.placeholder += " / IMEI number";
            //     findIMEILink.classList.remove("hide");
            // } else {
            //     findIMEILink.classList.add("hide");
            //     if (serialNumberLabel)
            //         serialNumberLabel.innerText =
            //             serialNumberLabel.innerText.replace(
            //                 " / IMEI number",
            //                 ""
            //             );
            //     serialNumber.input_.placeholder =
            //         serialNumber.input_.placeholder.replace(
            //             " / IMEI number",
            //             ""
            //         );
            // }
            serialNumber.root_.parentElement.classList.remove("hide");
            findSerialLink.classList.remove("hide");
        }

        submitButton.innerText = contactReasonObj.submitText;
    }

    function skip(family, serial, skipOptions) {
        const options = {
            cannotLocateSN: false,
            disableAssisted: false,
            triggerGtm: true,
            fromInvalidContactUsLink: false,
        };
        const timestamp = Date.now();

        if (typeof skipOptions === "object") {
            Object.entries(skipOptions).forEach(([key, value]) => {
                options[key] = value;
            });
        }


        const warranty = {
            family: family,
            serial:
                serial === undefined || serial === "" ? "unavailable" : serial,
            ts: timestamp,
            skip: true,
            disable: options.disableAssisted ? true : false,
            cannotLocateSN: options.cannotLocateSN,
            fromInvalidContactUsLink: options.fromInvalidContactUsLink,
        };

        if(warranty.family === 'mouse') {
            saveCaseDetails();
        }

        window.localStorage.setItem("warranty", JSON.stringify(warranty));
        if (options.triggerGtm) {
            if (options.cannotLocateSN === true) {
                triggerGtmClass(typesOfTriggers["bypassed2"]);
            } else {
                triggerGtmClass(typesOfTriggers["bypassed"]);
            }
        }

        if(['me'].includes(Cookies.get('region'))) {
            submitContactUsForm();
        // }else if(warranty.family === 'mouse' && !['odaeu', 'odaap', 'ap', 'eu'].includes(Cookies.get('region'))) {
                    }else if(allowedOPA(warranty) && warranty.family == 'orders') {
                        window.location = `https://mysupport.razer.com/app/answers/detail/a_id/6386`;
        }else if(allowedOPA(warranty) && warranty.family == 'mouse') {
            window.location = `https://mysupport.razer.com/app/answers/detail/a_id/6085/`;
        }else if (allowedOPA(warranty) && ['audio', 'earphones', 'headset', 'headphones'].includes(warranty.family)){
            window.location = `https://mysupport.razer.com/app/answers/detail/a_id/9716`;
        }else if (allowedOPA(warranty) && warranty.family == 'keyboards'){
            window.location = `https://mysupport.razer.com/app/answers/detail/a_id/9717`;
        } else {
            // window.location =`${window.location.protocol}//${window.location.host}/contact-support/${window.location.search}`;
            window.location = `${window.location.protocol}//${window.location.host}/app/contact-support/${window.location.search}`;
        }
    }

    function allowedOPA(warranty) {
        allowedFamily = ['orders', 'mouse', 'keyboards', 'audio', 'earphones', 'headset','headphones', 'system'].includes(warranty.family);
        // isMouse = warranty.family === 'mouse'
        allowedRegions = true; //!['odaap', 'ap'].includes(Cookies.get('region')) || false;
        allowedCountries = !['at', 'de', 'fr', 'es', 'cn'].includes(Cookies.get('country')) || false;
        return allowedFamily && allowedRegions && allowedCountries;
    }

    function allowedMouseOPA(warranty) {
        isMouse = warranty.family === 'mouse'
        allowedRegions = true; //!['odaap', 'ap'].includes(Cookies.get('region')) || false;
        allowedCountries = !['at', 'de', 'fr', 'es', 'cn'].includes(Cookies.get('country')) || false;
        return isMouse && allowedRegions && allowedCountries;
    }

    function redirectToMysupportForm(wit) {
        var form = document.createElement("form");
        form.style.visibility = "hidden";
        form.method = "GET";
        form.action = "https://mysupport.razer.com/app";

        var witInput = document.createElement("input");
        witInput.name = "wit";
        witInput.value = wit;
        form.appendChild(witInput);
        document.body.appendChild(form);
        setTimeout(function () {
            form.submit();
        }, 10000);
    }

    function get_warranty_status(
        serial,
        family,
        csrf,
        selectedText,
        cantLocateSN,
        logContactReason,
        logSubContactReason
    ) {
        var dataObj = {
            serial: `${serial}`,
            family: `${family}`,
            reason: `${selectedText}`,
            tf_bypass: `${cantLocateSN ? 1 : 0}`,
            logContactReason: logContactReason,
            logSubContactReason: logSubContactReason
        };

        var settings = {
            // "url": `${window.location.protocol}//${apiHost}/?ACT=${actID}&action=warranty_check`,
            url: `${window.location.protocol}//${apiHost}/cc/rest/warranty/check`,
            type: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                // "X-Forwarded-Host": `${window.location.host}`
                "X-Forwarded-Host": `${apiHost}`,
            },
            processData: true,
            dataType: "json",
            data: dataObj,
        };
        $.ajax(settings)
            .done(function (data) {
                if (
                    data === "" ||
                    data.hasOwnProperty("error_type") ||
                    (data.hasOwnProperty("expiry_date") &&
                        (data.expiry_date === null ||
                            data.expiry_date === undefined))
                ) {
                    document
                        .querySelector(".error-msg")
                        .classList.remove("hide");
                    triggerGtmClass(typesOfTriggers["invalid"]);
                    submitButton.disabled = false;
                } else {
                    var ts = Date.now();
                    expiryTimestampEpoch = data.expiry_date * 1000;
                    const withinWarranty =
                        expiryTimestampEpoch - ts > 0 ? true : false;
                    var warranty = {
                        serial: data.serial_number,
                        product: data.product_name,
                        productCode: data.product_code,
                        status: withinWarranty
                            ? "In Warranty"
                            : "Out of Warranty",
                        family: familyMapping(family, data.product_category),
                        inWarranty: withinWarranty ? true : false,
                        ts: ts,
                        skip: familyNotRequired.includes(data.product_category)
                            ? true
                            : false,
                        disable: false,
                        test: data.test,
                    };

                    if(warranty.family === 'mouse') {
                        saveCaseDetails();
                    }

                    window.localStorage.setItem(
                        "warranty",
                        JSON.stringify(warranty)
                    );
                    if (warranty.inWarranty) {
                        triggerGtmClass(typesOfTriggers["inWarranty"]);
                    } else {
                        triggerGtmClass(typesOfTriggers["outOfWarranty"]);
                    }
                    submitButton.disabled = false;

                    console.log(warranty.family)

                    if(['me'].includes(Cookies.get('region'))) {
                        submitContactUsForm();
                    // }else if(warranty.family === 'mouse' && !['odaeu', 'odaap', 'ap', 'eu'].includes(Cookies.get('region'))) {
                    }else if(allowedOPA(warranty) && warranty.family == 'orders') {
                        window.location = `https://mysupport.razer.com/app/answers/detail/a_id/6386`;
                    }else if(allowedOPA(warranty) && warranty.family == 'mouse') {
                        window.location = `https://mysupport.razer.com/app/answers/detail/a_id/6085/`;
                    }else if (allowedOPA(warranty) && ['audio', 'earphones', 'headset', 'headphones'].includes(warranty.family)){
                        window.location = `https://mysupport.razer.com/app/answers/detail/a_id/9716`;
                    }else if (allowedOPA(warranty) && warranty.family == 'keyboards'){
                        window.location = `https://mysupport.razer.com/app/answers/detail/a_id/9717`;
                    } else {
                        // window.location =`${window.location.protocol}//${window.location.host}/contact-support/${window.location.search}`;
                        window.location = `${window.location.protocol}//${window.location.host}/app/contact-support/${window.location.search}`;
                    }
                }
            })
            .fail(function (data) {
                console.info(data.responseText);
                submitButton.disabled = false;
            });
    }

    function submitContactUsForm() {
        let warranty = JSON.parse(window.localStorage.getItem("warranty"));
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
                'edge': 461,
                'headphones': 413
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
        const productSubFamily = {
            '7.1 surround sound': 70,
            'razer id': 268,
            'cortex': 73,
            'synapse': 76,
            'streamer_companion_app': 236,
            'thx_spatial_audio': 269,
        }

        const searchParams = new URL(window.location).searchParams;
        let formAction = `https://mysupport.razer.com/${searchParams.toString().length > 0? '?'+searchParams.toString(): ''}`;
        if (localesForm.hasOwnProperty(Cookies.get("country"))) {
            formAction = localesForm[Cookies.get("country")];
        }
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

    }

    function familyMapping(familySelected, familyFromApi) {
        switch(familySelected) {
            case 'desktops':
            case 'displays':
                return familySelected;
                break;

            default:
                return familyFromApi;
                break;
        }
    }

    function log(serial, family, selectedText, cantLocateSN, logContactReason, logSubContactReason) {
        const actID = 24;

        const dataObj = {
            serial: `${serial}`,
            family: `${family}`,
            reason: `${selectedText}`,
            tf_bypass: `${cantLocateSN || !serial ? 1 : 0}`,
            logContactReason: logContactReason || null,
            logSubContactReason: logSubContactReason || null
        };

        if (logDebug) {
            console.info("Logging disabled");
            console.group("Logging");
            console.log(dataObj);
            console.groupEnd();

            return;
        }

        var settings = {
            url: `${window.location.protocol}//${apiHost}/cc/rest/warranty/log`,
            type: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-Forwarded-Host": `${apiHost}`,
            },
            processData: true,
            dataType: "json",
            data: dataObj,
            done: function () {},
            error: function (data) {
                console.info(data.responseText);
                submitButton.disabled = false;
            },
        };

        if (logDebug) {
            console.log(settings);
            // return false;
        } else {
            $.ajax(settings);
        }

        return;
    }

    function triggerGtmClass(trigger) {
        const aTag = document.createElement("a");
        const tagId = `gtm-trigger-${Date.now()}`;
        aTag.classList.add(trigger);
        aTag.id = tagId;
        aTag.href = "javascript:void(0)";

        document.body.append(aTag);

        if (logDebug) {
            console.log(aTag);
        } else {
            aTag.click();
        }
        document.querySelectorAll(`#${aTag.id}`).forEach(function (a) {
            a.remove();
        });
    }

    function actionRedirect(obj) {
        // Redirect to URL
        selectedText = obj.text;
        const url = obj.value;
        const witValue = obj.wit;
        const service = obj.service;
        var serial = obj.serialNumber;
        var family = obj.value;
        var cantLocateSerialNumber = obj.cannotLocateSN;
        // var csrf = $('input[name="razer_csrf_token"]').val();
        var logContactReason = obj.logContactReason;
        var logSubContactReason = obj.logSubContactReason;

        log(serial, family, selectedText, cantLocateSerialNumber, logContactReason, logSubContactReason);

        if (service === "mysupport") {
            var form = document.createElement("form");
            form.style.visibility = "hidden";
            form.method = "POST";
            form.action = url;

            if (witValue !== "undefined") {
                var witInput = document.createElement("input");
                witInput.type = "hidden";
                witInput.name = "Incident_CustomFields_c_web_incident_type";
                witInput.value = witValue;
                form.appendChild(witInput);
            }
            
            document.body.appendChild(form);
            form.submit();
        } else {
            window.location.href = url;
        }
    }

    function actionSkipSerialValidation(obj) {
        var selectedText = obj.text;
        var serial = obj.serialNumber;
        var family = obj.value;
        var cantLocateSN = obj.cannotLocateSN;
        var cantLocateSerialNumber = obj.cannotLocateSN;
        var disableAssisted = !obj.assisted;
        // Skip serial validation
        var skipOptions = {
            disableAssisted: disableAssisted,
            cannotLocateSN: cantLocateSerialNumber,
        };
        var logContactReason = obj.logContactReason;
        var logSubContactReason = obj.logSubContactReason;

        log(serial, family, selectedText, cantLocateSerialNumber, logContactReason, logSubContactReason);

        skip(family, serial, skipOptions);
    }

    function updateElementAria(obj) {
        var elem = obj.elem;
        var value = obj.value;
        var ariaAttribute = obj.ariaAttribute;
        if(value === null || value === undefined) {
            elem.removeAttribute(ariaAttribute)
            return;
        }
        elem.setAttribute(ariaAttribute, value);
    }

    function saveCaseDetails() {
        saveCaseDetails = {
            case_category: "mouse",
            case_solutions: ["Windows updated","Connected directly to PC","Firmware updated","Sensor cleaned","Tested on another surface"],
            case_symptomps: ["Erratic Cusrsor Movement","Cursor is jumping on skipping","Cursor does not move but buttons are working"],
            case_reason: "tracking sensor issues",
            case_connection: "cable"
        }

        for (const key in saveCaseDetails) {
            if (Object.hasOwnProperty.call(saveCaseDetails, key)) {
                const element = saveCaseDetails[key];

                window.localStorage.setItem(key, Array.isArray(element) || element instanceof Object ? JSON.stringify(element) : element);
            }
        }
    }

    return {
        preloadSelection,
        logDebug,
        urlRegex,
        typesOfTriggers,
        categoriesSelectOptions,
        disableAssistedList,
        updateForm,
        redirectToMysupportForm,
        get_warranty_status,
        skip,
        triggerGtmClass,
        log,
        actionRedirect,
        actionSkipSerialValidation,
        updateElementAria,
    };
}


function replaceOrderReturnLinks() {

    var country = Cookies.get('country')

    if(['us', 'ca'].includes(country)) {
        var foundArr = [...document.querySelectorAll('a[href^="https://www.razer.com/legal/returns-refunds"]')]

        foundArr.forEach((item) => {
            item.href = 'https://returns.narvar.com/razer/returns'
        })  
    }
}

$(document).ready(function () {
    replaceOrderReturnLinks();
    var warranty = warrantySupport();

    var serialNumber = mdc.textField.MDCTextField.attachTo(
        document.querySelector(".mdc-text-field")
    );
    var submitButton = document.querySelector(".mdc-button");
    var form = document.querySelector("#warranty-check");
    var cantLocateSerialNumbercheckbox =
        document.querySelector("#cant-locate-sn");
    var request71SurroundSoundCodecheckbox =
        document.querySelector("#request-71ss-activation-code");
    var contactReasonSelect = $("#contact-reasons");
    var contactReasonsCategorySelect = $("#contact-reasons-category");

    // contactReasonsSelect.selectedText_.style.color = 'var(--text-color, rgba(165, 165, 165, .52))';
    submitButton.disabled = true;

    var contactReasonObj = {
        value: "",
        text: "",
        serialNumber: "",
        selectedIndex: 0,
        serialValidation: true,
        assisted: true,
        isURL: false,
        service: "",
        submitText: "Submit",
        submitDisabled: true,
        hasCategory: false,
        wit: 0,
        category: null,
        cannotLocateSN: false,
    };

    // init Select2: Start
    contactReasonSelect.select2({
        minimumResultsForSearch: -1,
    });

    contactReasonSelect.on('select2:open', function(e) {
        const resultsElement = $('.select2-results [role="listbox"]').get(0)
        const targetLabel = $(e.target).parent().find('.select2-container .select2-selection__rendered[role="textbox"]')

        warranty.updateElementAria({
            elem: resultsElement,
            ariaAttribute: 'aria-labelledby',
            value: targetLabel.attr('id')
        })
    })

    warranty.updateElementAria({
        elem: contactReasonSelect.get(0),
        ariaAttribute: 'aria-hidden',
        value: null
    })
    warranty.updateElementAria({
        elem: contactReasonSelect
            .closest(".select-contact-reasons")
            .find('[role="combobox"]')
            .get(0),
        ariaAttribute: "aria-haspopup",
        value: 'listbox'
    });
    warranty.updateElementAria({
        elem: contactReasonSelect
            .closest(".select-contact-reasons")
            .find('[role="combobox"]')
            .get(0),
        ariaAttribute: "aria-labelledby",
        value: (
            () => {
                let ariaLabelledby = [];
                ariaLabelledby = [...ariaLabelledby , contactReasonSelect
                    .closest(".select-contact-reasons")
                    .find("label")
                    .get(0)
                    .getAttribute("id")]
                
                    ariaLabelledby = [...ariaLabelledby , contactReasonSelect
                        .closest(".select-contact-reasons")
                        .find('.select2-selection__rendered[role="textbox"]')
                        .get(0)
                        .getAttribute('id')]

                return ariaLabelledby.join(' ')
            }
        )(),
    });

    contactReasonsCategorySelect.select2({
        minimumResultsForSearch: -1,
    });

    contactReasonsCategorySelect.on('select2:open', function(e) {
        const resultsElement = $('.select2-results [role="listbox"]').get(0)
        const targetLabel = $(e.target).parent().find('.select2-container .select2-selection__rendered[role="textbox"]')

        warranty.updateElementAria({
            elem: resultsElement,
            ariaAttribute: 'aria-labelledby',
            value: targetLabel.attr('id')
        })
    })

    warranty.updateElementAria({
        elem: contactReasonsCategorySelect
            .closest(".select-contact-reasons-category")
            .find('[role="combobox"]')
            .get(0),
        ariaAttribute: "aria-haspopup",
        value: 'listbox'
    });

    warranty.updateElementAria({
        elem: contactReasonsCategorySelect
            .closest(".select-contact-reasons-category")
            .find('[role="combobox"]')
            .get(0),
        ariaAttribute: "aria-labelledby",
        value: (() => {
            let ariaLabelledby = [];

            ariaLabelledby = [...ariaLabelledby, 
                contactReasonsCategorySelect
                .closest(".select-contact-reasons-category")
                .find("label")
                .get(0)
                .getAttribute("id"),
                contactReasonsCategorySelect
                    .closest(".select-contact-reasons-category")
                    .find('.select2-selection__rendered[role="textbox"]')
                    .get(0)
                    .getAttribute('id')
            ]


            return ariaLabelledby.join(' ')
        })(),
    });
    // init Select2: END

    // cantLocateSerialNumbercheckbox
    cantLocateSerialNumbercheckbox.addEventListener("change", (e) => {
        serialNumber.required = e.target.checked ? false : true;
        contactReasonObj.cannotLocateSN = e.target.checked ? true : false;
    });

    //request71SurroundSoundCodecheckbox
    request71SurroundSoundCodecheckbox?.addEventListener('change', (e) => {
        serialNumber.required = e.target.checked ? false : true;
        contactReasonObj.request71SurroundSoundCode = e.target.checked ? true : false;
    })

    // contact-reason
    contactReasonSelect.on("select2:select", function (event) {
        var selectedItemDataset = event.params.data.element.dataset;

        contactReasonObj.text = event.params.data.text;
        contactReasonObj.value = event.params.data.id;
        contactReasonObj.isURL = event.params.data.id.match(warranty.urlRegex)
            ? true
            : false;
        contactReasonObj.service = selectedItemDataset.service;

        // if(e.detail.index > 0) {
        // contactReasonObj.selectedIndex = e.detail.index;
        // }
        contactReasonObj.logContactReason = event.params.data.text;
        contactReasonObj.logSubContactReason = null;

        if (
            "serialValidation" in selectedItemDataset &&
            selectedItemDataset.serialValidation === "false"
        ) {
            contactReasonObj.serialValidation = false;
        } else {
            contactReasonObj.serialValidation = true;
        }

        if ("submitText" in selectedItemDataset) {
            contactReasonObj.submitText = selectedItemDataset.submitText;
        } else {
            contactReasonObj.submitText = "Submit";
        }

        if ("wit" in selectedItemDataset) {
            contactReasonObj.wit = selectedItemDataset.wit;
        } else {
            contactReasonObj.wit = NaN;
        }

        // contactReasonsSelect.selectedText_.style.color = e.detail.index === 0 ?
        // 'var(--text-color, rgba(165, 165, 165, .52))' : '';

        // contactReasonsCategorySelect.selectedIndex = 0;

        if (
            "category" in selectedItemDataset &&
            selectedItemDataset.category.trim().length > 0
        ) {
            contactReasonObj.hasCategory = true;
            contactReasonObj.submitDisabled = true;
            contactReasonObj.category = selectedItemDataset.category.trim();

            var categoriesSelectOptions =
                warranty.categoriesSelectOptions[
                    selectedItemDataset.category.trim()
                ];

            // clear previous data, load new data and disable search field in select2
            contactReasonsCategorySelect.empty();
            // unbind keydown event
            $('.select-contact-reasons-category .select2').off('keydown');
            
            contactReasonsCategorySelect.select2({
                data: categoriesSelectOptions,
                minimumResultsForSearch: -1,
            });
            warranty.updateElementAria({
                elem: contactReasonsCategorySelect.get(0),
                ariaAttribute: 'aria-hidden',
                value: null
            });
            warranty.updateElementAria({
                elem: contactReasonsCategorySelect
                    .closest(".select-contact-reasons-category")
                    .find('[role="combobox"]')
                    .get(0),
                ariaAttribute: "aria-labelledby",
                value: (() => {
                    let ariaLabelledby = [];
        
                    ariaLabelledby = [...ariaLabelledby, 
                        contactReasonsCategorySelect
                        .closest(".select-contact-reasons-category")
                        .find("label")
                        .get(0)
                        .getAttribute("id"),
                        contactReasonsCategorySelect
                            .closest(".select-contact-reasons-category")
                            .find('.select2-selection__rendered[role="textbox"]')
                            .get(0)
                            .getAttribute('id')
                    ]
        
        
                    return ariaLabelledby.join(' ')
                })()
            });

            // bind keydown for category selector
            $('.select-contact-reasons-category .select2').on('keydown', function(e) {
                if(e.keyCode === 40 || e.keyCode === 38) {
                    e.preventDefault();
                    if(!$(this).hasClass('select2-container--open')) {
                    console.log(`${e.keyCode} - ${e.key}`);
                        contactReasonsCategorySelect.select2('open');
                    }
                }
            })

            // fire select2:select event after new data loaded for category select
            var preSelectedReason =
                contactReasonsCategorySelect.select2("data");
            contactReasonsCategorySelect.trigger({
                type: "select2:select",
                params: {
                    data: preSelectedReason[0],
                },
            });

            contactReasonsCategorySelect
                .closest(".field-container")
                .removeClass("hide");
        } else {
            contactReasonObj.hasCategory = false;
            contactReasonObj.submitDisabled = false;
            contactReasonsCategorySelect
                .closest(".field-container")
                .addClass("hide");
            // contactReasonsCategorySelect.required = false;
        }
        warranty.updateForm(contactReasonObj);
    });

    // bind keydown for contact reasons selector 
    $('.select-contact-reasons .select2').on('keydown', function(e) {
        if(e.keyCode === 40 || e.keyCode === 38) {
            e.preventDefault();
            if(!$(this).hasClass('select2-container--open')) {
            console.log(`${e.keyCode} - ${e.key}`);
                contactReasonSelect.select2('open');
            }
        }
    })

    // contact reason category
    contactReasonsCategorySelect.on("select2:select", function (event) {
        if (contactReasonObj.hasCategory) {
            const selectedItemDataset = event.params.data;

            contactReasonObj.text = selectedItemDataset.text;
            contactReasonObj.value = selectedItemDataset.id;
            contactReasonObj.isURL = selectedItemDataset.id.match(
                warranty.urlRegex
            )
                ? true
                : false;
            
            contactReasonObj.logSubContactReason = selectedItemDataset.text;

            // if (e.detail.index > 0) {
            //     contactReasonObj.selectedIndex = e.detail.index;
            //     contactReasonObj.submitDisabled = false;
            // } else {
            //     contactReasonObj.submitDisabled = true;
            // }
            contactReasonObj.submitDisabled = false;

            if (
                "serialValidation" in selectedItemDataset &&
                selectedItemDataset.serialValidation === false
            ) {
                contactReasonObj.serialValidation = false;
            } else {
                contactReasonObj.serialValidation = true;
            }

            if ("submitText" in selectedItemDataset) {
                contactReasonObj.submitText = selectedItemDataset.submitText;
            } else {
                contactReasonObj.submitText = "Submit";
            }

            if ("wit" in selectedItemDataset) {
                contactReasonObj.wit = selectedItemDataset.wit;
            } else {
                contactReasonObj.wit = NaN;
            }
            warranty.updateForm(contactReasonObj);
        }
    });

    // serialNumber element on blur event
    serialNumber.root_.querySelector("#serial-number").onblur = function (
        event
    ) {
        var validity = event.target.validity;
        if (!validity.valid && validity.valueMissing) {
            serialNumber.helperTextContent = `Please enter serial number`;
        } else if (!validity.valid && validity.patternMismatch) {
            serialNumber.helperTextContent = `invalid alphanumeric characters`;
        } else if (!validity.valid && validity.tooShort) {
            let imeiText = "";
            serialNumber.helperTextContent = `Please enter 15-digit alphanumeric serial number${imeiText}`;
        } else {
            contactReasonObj.serialNumber = event.target.value;
        }
    };

    serialNumber.root_
        .querySelector(`#serial-number`)
        .addEventListener(`invalid`, (e) => {
            serialNumber.root_.querySelector(`#serial-number`).focus();
            serialNumber.root_.querySelector(`#serial-number`).blur();
        });

    $("#invalid-sn-link").click((e) => {
        e.preventDefault();

        var family = contactReasonObj.value;
        var serial = serialNumber.value;
        var skipOptions = {
            disableAssisted: warranty.disableAssistedList.includes(
                family
            )
                ? true
                : false,
            fromInvalidContactUsLink: true,
        };

        warranty.triggerGtmClass(warranty.typesOfTriggers["invalidContactUsLink"]);

        warranty.skip(family, serial, skipOptions);
    });

    // Form submit event
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if(contactReasonObj?.request71SurroundSoundCode) {
            window.location.href = "https://mysupport.razer.com/app/self-help/index";
            return;
        }

        serialNumber.root_.querySelector(`#serial-number`).focus();
        serialNumber.root_.querySelector(`#serial-number`).blur();
        submitButton.setAttribute("disabled", "disabled");

        selectedText = contactReasonObj.text;

        var isURL = contactReasonObj.isURL;
        var serialNumberRequired = contactReasonObj.serialValidation;
        var cantLocateSerialNumber = contactReasonObj.cannotLocateSN;
        var serial = contactReasonObj.serialNumber;
        var family = contactReasonObj.value;
        var csrf = $('input[name="razer_csrf_token"]').val();
        var logContactReason = contactReasonObj.logContactReason || null;
        var logSubContactReason = contactReasonObj.logSubContactReason || null;

        var enableGetWarrantyStatus =
            !isURL &&
            serialNumberRequired &&
            !cantLocateSerialNumber &&
            serialNumber.valid &&
            family;

        var enableRedirect =
            (contactReasonObj.value || contactReasonObj.category) && isURL;
        var skipSerialValidation =
            !serialNumberRequired || cantLocateSerialNumber;

        if (enableGetWarrantyStatus) {
            // Get warranty status
            warranty.get_warranty_status(
                serial,
                family,
                csrf,
                selectedText,
                cantLocateSerialNumber,
                logContactReason,
                logSubContactReason
            );
        } else if (enableRedirect) {
            warranty.actionRedirect(contactReasonObj);
        } else if (skipSerialValidation) {
            warranty.actionSkipSerialValidation(contactReasonObj);
        }

        submitButton.removeAttribute("disabled");
    });

    warranty.preloadSelection(contactReasonSelect);

    $(".cant-locate-sn-field, .request-71ss-activation-code-field").keydown(function(e){
        if([32, 13].includes(e.keyCode)){ // enter & space to toggle checkbox
            e.preventDefault();
            $(e.target).find('input[type="checkbox"]').trigger('click')
        }
    });

    // fire select2:select event after new data loaded for contact reason select
    var preSelectedReason = contactReasonSelect.select2("data");
    contactReasonSelect.trigger({
        type: "select2:select",
        params: {
            data: preSelectedReason[0],
        },
    });
});
