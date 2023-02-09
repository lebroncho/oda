// Engagement Engine : START
function isPayPage() {
  return true;
}

function isEmpty(str) {
  return (!str || 0 === str.length || str === undefined);
}

function getSurveyData(chatId) {
  var chatData = {
    "chatId": chatId
  };
  return $.ajax({
    type: 'POST',
    url: "/cc/ChatController/GetSurveyData",
    data: chatData,
    dataType: 'json'
  });
}
window.EESvcs = {
  'eeid': 202007311935655
};
$.when(
  $.getScript("//ee.channels.ocs.oraclecloud.com/js/eesvcs.js")
).then(function () {
  EESvcs.start();
});
// Engagement Engine : END

document.addEventListener('inlay-oracle-chat-embedded-loaded', function (e) {
  //console.log('inlay-oracle-chat-embedded-loaded OK');
  var head = $("#inlay-oracle-chat-embedded").contents().find("head");
  $(head).append($("<link/>", {
    rel: "stylesheet",
    href: "https://tst1.dev.mysupport.razer.com/euf/assets/chat/inlays/app.css",
    type: "text/css"
  }));

  var INLAY_ID_EMBEDDED = "inlay-oracle-chat-embedded";
  var chatEmbeddedInlay = null;

  var chatEmbeddedInlayFrame = document.getElementById(INLAY_ID_EMBEDDED);
  chatEmbeddedInlay = chatEmbeddedInlayFrame.contentDocument || chatEmbeddedInlayFrame.contentWindow.document;

  var js = 'var s_ajaxListener=new Object;s_ajaxListener.tempOpen=XMLHttpRequest.prototype.open,s_ajaxListener.tempSend=XMLHttpRequest.prototype.send,s_ajaxListener.callback=function(){},XMLHttpRequest.prototype.open=function(e,t){if(!e)e="";if(!t)t="";s_ajaxListener.tempOpen.apply(this,arguments),s_ajaxListener.method=e,s_ajaxListener.url=t,"get"==e.toLowerCase()&&(s_ajaxListener.data=t.split("?"),s_ajaxListener.data=s_ajaxListener.data[1])},XMLHttpRequest.prototype.send=function(e,t){if(!e)e="";if(!t)t="";s_ajaxListener.tempSend.apply(this,arguments),this.addEventListener("load",function(){s_ajaxListener.url.includes("/requestEngagement")&&(parent.window.engagementId=JSON.parse(this.responseText).engagementId)},!1),"post"==s_ajaxListener.method.toLowerCase()&&(s_ajaxListener.data=e),s_ajaxListener.callback()};';

  var scriptTag = "<script>" + js + "<";
  scriptTag += "/script>";
  $("#" + INLAY_ID_EMBEDDED).contents().find("body").append(scriptTag);

  window.addEventListener("storage", storageEventHandler, false);

  function storageEventHandler(event) {
    if (event.key === "inlay-oracle-chat-embedded-chatStatus") {
      let status = JSON.parse(event.newValue);
      if (!isEmpty(status.chatStatus)) {
        //console.log(status.chatStatus);
        if (status.chatStatus === "connected") {
          var surv = chatEmbeddedInlay.getElementById("chatSurvey");
          //console.log("surv", surv);
          if (surv) {
            surv.remove();
          }
        }
        if (status.chatStatus === "disconnected") {
          setTimeout(function () {
            var getSurveyDataPromise = getSurveyData(window.engagementId);
            getSurveyDataPromise.then(function (response) {
              //console.log(response);
              var _accountID = response.agentId;
              var _surveyBaseUrl = response.surveyUrl;

              var surveyUrl = (_accountID > 0) ? _surveyBaseUrl + `?chat_id=${window.engagementId}&p_acct_id=${_accountID}` : _surveyBaseUrl + `?chat_id=${window.engagementId}`;

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

              var target = chatEmbeddedInlay.getElementsByClassName("oit-inlay-body")[2].getElementsByClassName("transcript-message-container")[0];
              target.appendChild(iframeDiv);

              // scroll the container
              var objDiv = chatEmbeddedInlay.getElementsByClassName("oit-inlay-body")[2];
              objDiv.scrollTop = objDiv.scrollHeight;
            });
          }, 1500);
        }
      }
    }
  }
});