document.addEventListener('DOMContentLoaded', initialize);
var xmlURL = "https://mattie432.com/YouTweak/message.xml";
var lastOpenedOptionsPage;
var debug = false;

window.onbeforeunload = function() {
    save_options();
};
function initialize() {
	arrangePage();
  	toggleSecondaryButtons()
	restore_options();
	checkForDate();
	checkMessages();
};

function checkMessages(){

	chrome.storage.sync.get(['lastOpenedOptionsPage'], function(r) {

		var hoursBetweenChecks = 2;
		var tmp = r.lastOpenedOptionsPage + (60 * 60 * hoursBetweenChecks);
    var currentTime = new Date().getTime() / 1000;


    if(debug){
      //enables always download message
      tmp = currentTime - 1000;
      //empty local message
      chrome.storage.local.set({"keyMessage" : null});
      chrome.storage.local.set({"keyDate" : null});
    }

		if( isNaN(tmp) |tmp==undefined | tmp==null | tmp == "" | tmp < currentTime){

			var xhr = new XMLHttpRequest();
			xhr.open("GET", xmlURL, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {

					var response = getMessages(xhr);
          //alert("checkttl =" + checkTTL(response.date, response.ttl) + "\n response.date=" + response.date + "\nttl = " + response.ttl)
					if((response.show == "true" && checkTTL(response.date, response.ttl)) || debug == true ){
						addMessageToPage(response.message,response.date);
						//save message locally
					  chrome.storage.local.set({"keyMessage" : response.message});
						chrome.storage.local.set({"keyDate" : response.date});

					}else{
						//empty local message
					  chrome.storage.local.set({"keyMessage" : null});
						chrome.storage.local.set({"keyDate" : null});
					}

				}
			};
			xhr.send();

			lastOpenedOptionsPage = new Date().getTime() / 1000;
		}else{
			chrome.storage.local.get(["keyMessage","keyDate"], function(result){
            var keyMessage = result.keyMessage
            var keyDate = result.keyDate
            if(keyMessage !== undefined && keyMessage !== null && keyDate !== undefined && keyDate !== null){
        			//show cached message
              addMessageToPage(keyMessage,keyDate);
        		}
    		});


		}
	});


}

//add days to date
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
/*
 * Checks if the current date is within the response date & the time to live of the message.
 */
function checkTTL(responseDate, ttl){
  var responseSplit = responseDate.split(" ");
  var responseDay = responseSplit[0].substring(0,responseSplit[0].length -2);
  var responseMonth;
  if(responseSplit[1].toLowerCase().indexOf("jan") > -1 ){
    responseMonth = 0;
  }else if(responseSplit[1].toLowerCase().indexOf("feb") > -1 ){
    responseMonth = 1;
  }else if(responseSplit[1].toLowerCase().indexOf("mar") > -1 ){
    responseMonth = 2;
  }else if(responseSplit[1].toLowerCase().indexOf("apr") > -1 ){
    responseMonth = 3;
  }else if(responseSplit[1].toLowerCase().indexOf("may") > -1 ){
    responseMonth = 4;
  }else if(responseSplit[1].toLowerCase().indexOf("jun") > -1 ){
    responseMonth = 5;
  }else if(responseSplit[1].toLowerCase().indexOf("jul") > -1 ){
    responseMonth = 6;
  }else if(responseSplit[1].toLowerCase().indexOf("aug") > -1 ){
    responseMonth = 7;
  }else if(responseSplit[1].toLowerCase().indexOf("sep") > -1 ){
    responseMonth = 8;
  }else if(responseSplit[1].toLowerCase().indexOf("oct") > -1 ){
    responseMonth = 9;
  }else if(responseSplit[1].toLowerCase().indexOf("nov") > -1 ){
    responseMonth = 10;
  }else if(responseSplit[1].toLowerCase().indexOf("dec") > -1 ){
    responseMonth = 11;
  }

  var dateFrom = new Date(responseSplit[2], responseMonth, responseDay);
  //dateFrom = dateFrom.getTime();

  var dateTo = new Date();
  //Need to set the date this way, adding time, other ways are buggy.
  dateTo.setTime( dateFrom.getTime() + parseInt(ttl) * 86400000 );

  var today = new Date().getTime();

  if( today >= dateFrom && today <= dateTo){
    return true;
  }else{
    return false;
  }

}

function toggleSecondaryButtons(){
    //For the automatically remove videos button
    var removeButton = document.getElementById("deleteWatchedVids");
    removeButton.addEventListener('click', function(){
        var automated = document.getElementById("deleteWatchedVidsAutomated");

        if (removeButton.checked == true) {
            automated.removeAttribute("disabled");
        } else {
            automated.setAttribute("disabled","");
            automated.checked = false
        }
  });

  //for the collapse subscriptions groups buttons
  var collapseSubscriptionButton = document.getElementById("collapseSubscriptionVideos");
  collapseSubscriptionButton.addEventListener('click', function(){
      var automated = document.getElementById("collapseStartOldHidden");

      if (collapseSubscriptionButton.checked == true) {
          automated.removeAttribute("disabled");
      } else {
          automated.setAttribute("disabled","");
          automated.checked = false
      }
});

}

function addMessageToPage(message,messageDate){
	var child = document.createElement("div");
	child.setAttribute("class", "alert alert-dismissable alert-danger");

	var icon = document.createElement("div");
	icon.setAttribute("class", "alertIcon");

	var text = document.createElement("div");
	text.setAttribute("class","alertText");
	text.innerHTML = linkify(message);

	var br = document.createElement("div");

	var date = document.createElement("h4");
	date.innerHTML = "<strong>Alert!</strong> - " + messageDate;

	br.appendChild(date);
	br.appendChild(text);

	child.appendChild(br);

	var note = document.getElementById("AlertsAddedBelowHere");
	note.insertBefore(child, note.firstElementChild);

}

function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}


/**
 *	Gets all messages from the XML
 * @param {Object} xml1
 * @param {Object} msgNum
 */
function getMessages(xml1, msgNum) {

	var xml = xml1.responseXML.childNodes[0];
	if(xml !== undefined && xml !== null){
		var messages = xml.childNodes;

		var num = -1;
		var date;
		var text;
    var ttl;
		var show;

		for (var i = 0; i < messages.length; i++) {
			if (messages[i].nodeName == "show") {
				//show msg
				show = messages[i].textContent;
			}

			if (messages[i].nodeName == "message") {
				var msg = messages[i].childNodes;
				var tempnum;
				var tempdate;
				var temptext;
        var tempttl;

				for (var j = 0; j < msg.length; j++) {
					if (msg[j].nodeName == "num") {
						tempnum = msg[j].textContent;
					} else if (msg[j].nodeName == "date") {
						tempdate = msg[j].textContent;
					} else if (msg[j].nodeName == "text") {
						temptext = msg[j].textContent;
					} else if (msg[j].nodeName == "ttl") {
            tempttl = msg[j].textContent;
          }
				}

				var case1 = (msgNum == undefined);
				var case2 = (tempnum > msgNum);//|| true;
				var case3 = tempnum > num;
				if ((case1 || case2) && case3) {
					num = tempnum;
					date = tempdate;
					text = temptext;
          ttl = tempttl;

					return {
						show : show,
						num : num,
						date : date,
						message : text,
            ttl : ttl
					};

				}

			}
		}
	}

}

// Saves options to localStorage.
function save_options() {

	var deleteSubsBtnState = document.getElementById("deleteSubsBtn").checked;
	var changeIconURLState = document.getElementById("changeIconURL").checked;
	var removeWatchedVideosState = document.getElementById("deleteWatchedVids").checked;
	var iconURLLink = document.getElementById("iconURL").value;
	//var redirectYouTube = document.getElementById("redirectYouTube").checked;
	var details = chrome.runtime.getManifest();
	var clearAllVideos = document.getElementById("clearAllVideos").checked;
	var loadAllVideos = document.getElementById("loadAllVideos").checked;
	var deleteWatchedVidsAutomated = document.getElementById("deleteWatchedVidsAutomated").checked;
	//var autoLike = document.getElementById("autoLike").checked;
	//var autoLikeNames = document.getElementById("autoLikeTextBox").value;
	//    autoLikeNames.replace(" ","");
	//    autoLikeNames.replace(",","");
	//    autoLikeNames.replace(/[\n\r]/g,",");
	//var removeRecomendedChannels = document.getElementById("removeRecomendedChannels").checked;
	//var versionSelectionPrevious = document.getElementById("selectVersionCombobox").value;
	var collapseSubscriptionVideos = document.getElementById("collapseSubscriptionVideos").checked;
	var collapseStartOldHidden = document.getElementById("collapseStartOldHidden").checked;
	//seconds since last page opened

	if(isValidURL(iconURLLink)){
	chrome.storage.sync.set({
		'reviewed' : "false",
		'lastOpenedOptionsPage' : lastOpenedOptionsPage,
		'reviewDateDays' : setDays,
		'deleteSubsBtn' : deleteSubsBtnState,
		'changeIconURL' : changeIconURLState,
		'removeWatchedVideos' : removeWatchedVideosState,
		'iconURLTxt' : iconURLLink,
		'clearAllVideos' : clearAllVideos,
		'loadAllVideos' : loadAllVideos,
		'deleteWatchedVidsAutomated' : deleteWatchedVidsAutomated,
		//'removeRecomendedChannels' : removeRecomendedChannels,
		//'redirectYouTube' : redirectYouTube,
		//'autoLike' : autoLike,
		//'autoLikeNames' : autoLikeNames,
		//'extensionVersionToUse' : versionSelectionPrevious,
		'collapseSubscriptionVideos' : collapseSubscriptionVideos,
		'collapseStartOldHidden' : collapseStartOldHidden
	}, function() {
	    // Notify that we saved.
	});
	document.getElementById("iconURL").removeAttribute("class");
	}else{
		alert("URL not valid!");
		document.getElementById("iconURL").setAttribute("class","error");
		document.getElementById("iconURL").focus();
	}
}

// Restores select box state to saved value from localStorage.
function restore_options() {

	if(debug){
			chrome.storage.sync.set({
        		'extensionVersionPrevious' : null
        	}, function() {
        	    // Notify that we saved.
        	});
	}

	chrome.storage.sync.get([ 'changeIconURL', 'removeWatchedVideos', 'linksInHD',
							'deleteSubsBtn', 'iconURLTxt', 'pauseVideos', 'installDate','loadAllVideos',
							'clearAllVideos','deleteWatchedVidsAutomated', 'removeRecomendedChannels','qualitySelect',
							'repeatVideos','redirectYouTube','setVideoSize', 'centerHomePage','autoLike','autoLikeNames',
							'lastOpenedOptionsPage', 'extensionVersionToUse', 'extensionVersionPrevious', 'collapseSubscriptionVideos', 'collapseStartOldHidden'],
		function(r) {
			lastOpenedOptionsPage = r.lastOpenedOptionsPage;
			//document.getElementById("autoLike").checked = (r.autoLike);
			//document.getElementById("autoLikeTextBox").value =(function() {
			//													if (r.autoLikeNames !== "" && r.autoLikeNames !== null && r.autoLikeNames !== undefined){
			//														return r.autoLikeNames.replace(",", /\n/);
			//													}else{
			//														return "";
			//													}
			//												})();
			document.getElementById("changeIconURL").checked = (r.changeIconURL);
			document.getElementById("deleteSubsBtn").checked = (r.deleteSubsBtn);
			document.getElementById("clearAllVideos").checked = (r.clearAllVideos);
			document.getElementById("loadAllVideos").checked = (r.loadAllVideos);
			document.getElementById("deleteWatchedVidsAutomated").checked = (r.deleteWatchedVidsAutomated);
			//document.getElementById("removeRecomendedChannels").checked = (r.removeRecomendedChannels);
			// document.getElementById("redirectYouTube").checked = (r.redirectYouTube);
			document.getElementById("collapseSubscriptionVideos").checked = (r.collapseSubscriptionVideos);
            if(r.collapseSubscriptionVideos) {
                document.getElementById("collapseStartOldHidden").removeAttribute("disabled");
            }
			document.getElementById("collapseStartOldHidden").checked = (r.collapseStartOldHidden);
			if(r.iconURLTxt === undefined || r.iconURLTxt == ""){
				 document.getElementById("iconURL").value = "http://www.youtube.com/feed/subscriptions";
			}else{
				 document.getElementById("iconURL").value  = r.iconURLTxt;
			}

            document.getElementById("deleteWatchedVids").checked = (r.removeWatchedVideos);
			if (r.removeWatchedVideos) {
          		document.getElementById("deleteWatchedVidsAutomated").removeAttribute("disabled");
			}
	//		if(r.extensionVersionToUse) {
	//			document.getElementById("selectVersionCombobox").value = r.extensionVersionToUse;
	//		}
	//		if(r.extensionVersionPrevious) {
	//			var versions = document.getElementById("selectVersionCombobox").children;
	//			for (var i = 0; i < versions.length; i++){
	//				if(versions[i].value == r.extensionVersionPrevious){
	//					versions[i].text = versions[i].text + " (Previously installed version)";
	//				}
	//			}
	//		}
    //
	});

}

//Review
//Date used to check if can review yet.
var setDays;
function checkForDate(){
	chrome.storage.sync.get(['reviewed','reviewDateDays'], function(r) {
		if(r.reviewed != true && (r.reviewDateDays === undefined)){
			setDays = convertDateToDays(new Date());
		}else{
			setDays = r.reviewDateDays;
		}
	});
}
function convertDateToDays(date){
	var temp;
	var month = date.getMonth();
	var aggregateMonths = [0, // January
                           31, // February
                           31 + 28, // March
                           31 + 28 + 31, // April
                           31 + 28 + 31 + 30, // May
                           31 + 28 + 31 + 30 + 31, // June
                           31 + 28 + 31 + 30 + 31 + 30, // July
                           31 + 28 + 31 + 30 + 31 + 30 + 31, // August
                           31 + 28 + 31 + 30 + 31 + 30 + 31 + 31, // September
                           31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30, // October
                           31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31, // November
                           31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31 + 30, // December
                         ];
	return (date.getDate() + aggregateMonths[month]);
}



function arrangePage(){
	document.getElementById("iconURL").value = "http://www.youtube.com/feed/subscriptions";
	document.getElementById("resetTxt").addEventListener("click", restoreTxt, false);
	document.getElementById("deleteWatchedVids").addEventListener("click", toggleDeleteWatchedVidsAutomatic, false);
}
function isValidURL(url){
    var RegExp = /^(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,4}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?$/;
    if(RegExp.test(url)){
        return true;
    }else{
        return false;
    }
}
function restoreTxt(){
	document.getElementById("iconURL").value=("http://www.youtube.com/feed/subscriptions");
}
function editTxt(){
	document.getElementById("editTxt").setAttribute("disabled","true");
	document.getElementById("resetTxt").removeAttribute("disabled");
	document.getElementById("iconURL").removeAttribute("disabled");
}
function toggleDeleteWatchedVidsAutomatic(){
	var temp = document.getElementById("deleteWatchedVids").checked;
	if(temp){
	    document.getElementById("deleteWatchedVidsAutomated").removeAttribute("disabled");
	}else{
	    document.getElementById("deleteWatchedVidsAutomated").setAttribute("disabled","true");
	}
}
function contactShow(){
//	document.getElementById("emf-form").removeAttribute("style");
	window.open("http://about.mattie432.com",'_newtab');
}
function toggleEnabled(c){
    if(c.getAttribute("disabled")){
	c.removeAttribute("disabled");
    }else{
	c.setAttribute("disabled","true");
    }
}
// convert string to boolean
function stringToBoolean(str) {
	if (str == "true") {
		return true;
	} else {
		return false;
	}
}
