  let countryCookie = getCookie('country');
  let countryRegion = getCookie('region');
  var INLAY_ID_EMBEDDED = "inlay-oracle-chat-embedded";
  var chatEmbeddedInlay = null;

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

  document.addEventListener('inlay-oracle-chat-embedded-loaded', function (e) {
    //a360:add display none to remove focus on chat when aria-hidden=true
    setTimeout(function(){ 
      const el = document.getElementById("razer-oda-chat").getElementsByTagName("iframe")[0];
      if((el != undefined || el != null) && el.hasAttribute("aria-hidden") ){
        document.getElementById("razer-oda-chat").classList.add("d-none");
      }
    }, 1500);

    //Check Cookie if exists then show embedded inlay
    $('#chat_button, #chat_button button').attr('disabled', false);

    $('#chat_button').on('click', function (e) {console.log('test1')
      e.preventDefault();
      //check country cookie not needed for new r
      // if (countryCookie.toLowerCase()  == 'us') {
      //     console.log('country is us');
      // }

      //a360:removed the added class
      document.getElementById("razer-oda-chat").classList.remove("d-none");
            
      // Get live NodeLists for triggering "Razer Assist" button created but ODA
      // for more information, https://developer.mozilla.org/en-US/docs/Web/API/NodeList
      document.querySelector('#razer-oda-chat').childNodes.forEach((v,k) => {
        if(v.tagName === 'IFRAME') {
          if(v.contentDocument.querySelector('.screen-minimized').style.display !== 'none') {
            v.contentDocument.querySelector('.screen-minimized #title-link').click();
          }
        }
      });

      window.oit.fire(new oit.CustomEvent('inlay-oracle-chat-embedded-show', {
        detail: {
          id: 'razer-oda-chat'
        }
      }));
    });

    var head = $("#inlay-oracle-chat-embedded").contents().find("head");
    $(head).append($("<link/>", {
      rel: "stylesheet",
      href: "https://mysupport.razer.com/euf/assets/chat/inlays/oda.css",
      type: "text/css"
    }));

    var chatEmbeddedInlayFrame = document.getElementById(INLAY_ID_EMBEDDED);
    chatEmbeddedInlay = chatEmbeddedInlayFrame.contentDocument || chatEmbeddedInlayFrame.contentWindow.document;

    var js =
      'var s_ajaxListener=new Object;s_ajaxListener.tempOpen=XMLHttpRequest.prototype.open,s_ajaxListener.tempSend=XMLHttpRequest.prototype.send,s_ajaxListener.callback=function(){},XMLHttpRequest.prototype.open=function(e,t){if(!e)e="";if(!t)t="";s_ajaxListener.tempOpen.apply(this,arguments),s_ajaxListener.method=e,s_ajaxListener.url=t,"get"==e.toLowerCase()&&(s_ajaxListener.data=t.split("?"),s_ajaxListener.data=s_ajaxListener.data[1])},XMLHttpRequest.prototype.send=function(e,t){if(!e)e="";if(!t)t="";s_ajaxListener.tempSend.apply(this,arguments),this.addEventListener("load",function(){s_ajaxListener.url.includes("/requestEngagement")&&(console.log("engagementId",JSON.parse(this.responseText).engagementId),parent.window.engagementId=JSON.parse(this.responseText).engagementId)},!1),"post"==s_ajaxListener.method.toLowerCase()&&(s_ajaxListener.data=e),s_ajaxListener.callback()};';

    var scriptTag = "<script>" + js + "<";
    scriptTag += "/script>";
    $("#" + INLAY_ID_EMBEDDED).contents().find("body").append(scriptTag);

    window.addEventListener("storage", storageEventHandler, false);

    function storageEventHandler(event) {
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
  });