//additional checker to separte pay rule and core rule
function isCorePage() {
  return true;
}

//function to use stored fields to generate launch form fields and launch embedded chat with these populated
var loadInlayWithStoredFields = function () {
  var launchFormFields = [{
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
  ];

  let upload_type = ['.bmp','.gif','.jpeg','.jpg','.pdf','.png','.BMP','.GIF','.JPEG','.JPG','.PDF','.PNG','.mp4','.avi','.mov','.mkv'];

  //function to load embedded chat with prepopulated fields
  var addInlay = function () {
      oit.addOrUpdateInlay(
          "inlay-oracle-chat-embedded", //type of inlay
          "inlay-oracle-chat-embedded", //id of inlay element
          {
              // "queue-id": "270",
              "site-url": "razer.widget.custhelp.com",
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
      addInlay();
  } else {
      document.addEventListener('oit-loaded', function () {
          addInlay();
      });
  }
};

function getSubject() {
  var subject;
  var reason = getWarrantyInfo('family');
  var region = getCookie('region');

  if (reason === '7.1 surround sound') {
    subject = "lss71";
  } else if (reason === 'mouse') {
    subject = 'lRps932' + createMouseUtterance();
  } else {
    subject = "hello support";
  }

  return subject;
}

function createMouseUtterance() {
  let mouseData = [];

  mouseData.push(getMouseData('case_reason'));
  mouseData.push(getMouseData('case_symptoms', true));
  mouseData.push(getMouseData('case_connection'));
  mouseData.push(getMouseData('case_solutions', true));

  let phrase = mouseData.join("|");
  return ' ~' + phrase + '~';
}

function getMouseData(key, multiple=false) {
  const storage = window.localStorage.getItem(key);

  if (storage === 'unspecified') {
    return '';
  }

  const value = JSON.parse(storage);

  if (multiple) {
    return value.join('_');
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

  let value = '';
  const warrantyInfo = JSON.parse(window.localStorage.getItem('warranty'));
  if (!warrantyInfo) {
      return '';
  }
  const warrantyKeys = Object.keys(warrantyInfo);

  if (warrantyKeys.includes(key)) {
      value = warrantyInfo[key];
  }
  
  return value;
}