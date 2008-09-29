var msim_optionsDataBoolean = new Array();
var msim_optionsDataInteger = new Array();
var msim_optionsDataString  = new Array();

//Adds a device
function msim_addDevice(){
	var retVals = {};
	if(window.openDialog("chrome://msim/content/options/dialogs/device.xul", "msim-device-dialog", "centerscreen,chrome,modal,resizable", "add", null, null, retVals)){
		if(retVals.id && retVals.carrier){
			var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
			var deviceBox    = pageDocument.getElementById("msim-listbox");
			var listItem = deviceBox.appendItem(retVals.carrier + ":" + retVals.deviceName, retVals.userAgent);
			listItem.setAttribute("carrier", retVals.carrier);
			listItem.setAttribute("id", retVals.id);
			deviceBox.ensureElementIsVisible(listItem);
			deviceBox.selectItem(listItem);
		}
	}else{
		dump("canceld?\n");
	}
}

//Handles changing the options page
function msim_changePage(pageList){
	msim_storeOptions();
	document.getElementById("msim-options-iframe").setAttribute("src", pageList.selectedItem.getAttribute("value"));
}

//Deletes a device
function msim_deleteDevice(){
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox    = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	if(selectedItem && confirm(document.getElementById("msim-string-bundle").getString("msim_deleteConfirmation"))){
		var carrier = selectedItem.getAttribute("carrier");
		var deletedId = parseInt(selectedItem.getAttribute("id"));
		var prefPrefix = "msim.devicelist." + carrier + "." + deletedId + "."
		deviceBasicAttribute.concat(deviceAttribute[carrier]).forEach(function(attribute){
			pref.deletePref(prefPrefix+attribute);
		});

		//既に使われている端末だったら設定をリセット
		if(pref.copyUnicharPref("msim.current.id") == deletedId && pref.copyUnicharPref("msim.current.carrier") == carrier){
			dump("[msim]Debug : This device is used. Reset your settings.\n");
			pref.deletePref("msim.current.carrier");
			pref.deletePref("msim.current.device");
			pref.deletePref("general.useragent.override");
			pref.deletePref("msim.current.useragent");
			pref.deletePref("msim.current.id");
		}

		//各端末のidを再計算
		var count = pref.getIntPref("msim.devicelist." + carrier + ".count");
		dump(deletedId+":"+count+"\n");
		dump((deletedId+1)+":"+count+"\n");
		for(var i=deletedId+1; i<=count; i++){
			dump("[msim]Debug : Id is not the last one.Re-arrange ids.\n");
			var sPrefPrefix = "msim.devicelist." + carrier + "." + i + ".";
			var ePrefPrefix = "msim.devicelist." + carrier + "." + (i-1) + ".";
			deviceBasicAttribute.contcat(deviceAttribute[carrier]).forEach(function(attribute){
				pref.setUnicharPref(ePrefPrefix+attribute, pref.copyUnicharPref(sPrefPrefix+attribute));
			});
		}
		pref.setIntPref("msim.devicelist." + carrier + ".count", count-1);

		deviceBox.removeChild(selectedItem);
	}
}

//Edits a device
function msim_editDevice(){
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox    = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	var retVals = {};
	if(selectedItem){
		var carrier = selectedItem.getAttribute("carrier");
		var id = selectedItem.getAttribute("id");
		if(window.openDialog("chrome://msim/content/options/dialogs/device.xul", "msim-device-dialog", "centerscreen,chrome,modal,resizable", "edit", carrier, id, retVals)){
			setDevice(carrier, id);
		}
	}else{
		dump("[msim]Error : Device is not selected.\n");
	}
}

// Initializes the options dialog box
function msim_initializeOptions(){
	var selectedPage = document.getElementById("msim-page-list").selectedItem.getAttribute("value");

	// If this is the general page
	if(selectedPage.indexOf("general") != -1){
		msim_initializeGeneral();
	}else if(selectedPage.indexOf("devices") != -1){
		msim_initializeDevices();
	}else if(selectedPage.indexOf("gps") != -1){
		msim_initializeGps();
	}else if(selectedPage.indexOf("pictogram") != -1){
		msim_initializePictogram();
	}
}

// Initializes the general page
function msim_initializeGeneral()
{
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-uid").setAttribute("value",pref.copyUnicharPref("msim.config.DC.uid"));
	pageDocument.getElementById("msim-textbox-docomo-ser").setAttribute("value",pref.copyUnicharPref("msim.config.DC.ser"));
	pageDocument.getElementById("msim-textbox-docomo-icc").setAttribute("value",pref.copyUnicharPref("msim.config.DC.icc"));
	pageDocument.getElementById("msim-textbox-docomo-guid").setAttribute("value",pref.copyUnicharPref("msim.config.DC.guid"));
	pageDocument.getElementById("msim-textbox-au-uid").setAttribute("value",pref.copyUnicharPref("msim.config.AU.uid"));
	pageDocument.getElementById("msim-textbox-softbank-uid").setAttribute("value",pref.copyUnicharPref("msim.config.SB.uid"));
	pageDocument.getElementById("msim-textbox-softbank-serial").setAttribute("value",pref.copyUnicharPref("msim.config.SB.serial"));
}

// Initializes the devices page
function msim_initializeDevices(){
	dump("msim_initializeDevices\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox    = pageDocument.getElementById("msim-listbox");
	var deviceCount  = 0;

	while(deviceBox.lastChild.tagName != "listhead"){
		dump("removeList:"+deviceBox.lastChild.tagName+"\n");
		deviceBox.removeChild(deviceBox.lastChild);
	}

	carrierArray.forEach(function(carrier){

		deviceCount = pref.getIntPref("msim.devicelist." + carrier + ".count");
		for(var i = 1; i <= deviceCount; i++){
			var device = pref.copyUnicharPref("msim.devicelist." + carrier + "." + i + ".device");
			var useragent = pref.copyUnicharPref("msim.devicelist." + carrier + "." + i + ".useragent");
			if(device){
				var listItem = deviceBox.appendItem(carrier + ":" + device, useragent);
				listItem.setAttribute("carrier", carrier);
				listItem.setAttribute("id", i);
			}
		}
	});

	msim_deviceSelected();
}

// Saves the user's options
function msim_saveOptions(){
	var option      = null;
	var optionValue = null;

	// Make sure current page is stored
	msim_storeOptions();

	// Loop through the boolean options
	for(option in msim_optionsDataBoolean){
		pref.setBoolPref(option, msim_optionsDataBoolean[option]);
	}

	// Loop through the integer options
	for(option in msim_optionsDataInteger){
		pref.setIntPref(option, msim_optionsDataInteger[option]);
	}

	// Loop through the string options
	for(option in msim_optionsDataString){
		pref.setUnicharPref(option, msim_optionsDataString[option]);
	}
}

// Stores the user's options to be saved later
function msim_storeOptions(){
	var iFrame       = document.getElementById("msim-options-iframe");
	var iFrameSrc    = iFrame.getAttribute("src");
	var pageDocument = iFrame.contentDocument;

	// If this is the general page
	if(iFrameSrc.indexOf("general") != -1){
		dump("[msim]store generals.\n");
		msim_optionsDataString["msim.config.DC.uid"]    = pageDocument.getElementById("msim-textbox-docomo-uid").value;
		msim_optionsDataString["msim.config.DC.ser"]    = pageDocument.getElementById("msim-textbox-docomo-ser").value;
		msim_optionsDataString["msim.config.DC.icc"]    = pageDocument.getElementById("msim-textbox-docomo-icc").value;
		msim_optionsDataString["msim.config.DC.guid"]   = pageDocument.getElementById("msim-textbox-docomo-guid").value;
		msim_optionsDataString["msim.config.AU.uid"]    = pageDocument.getElementById("msim-textbox-au-uid").value;
		msim_optionsDataString["msim.config.SB.uid"]    = pageDocument.getElementById("msim-textbox-softbank-uid").value;
		msim_optionsDataString["msim.config.SB.serial"] = pageDocument.getElementById("msim-textbox-softbank-serial").value;
		var carrier = pref.copyUnicharPref("msim.current.carrier");
		if(carrier == SOFTBANK){
			dump("[msim]Debug : Current Carrier is SoftBank. Replace User-Agent.\n");
			var id = pref.copyUnicharPref("msim.current.id");
			var useragent = pref.copyUnicharPref("msim.devicelist."+carrier+"."+id+".useragent");
			var newUserAgent = getSoftBankUserAgent(useragent, msim_optionsDataString["msim.config.SB.serial"]);
			msim_optionsDataString["general.useragent.override"] = newUserAgent;
			msim_optionsDataString["msim.current.useragent"] = newUserAgent;
		}
	}else if(iFrameSrc.indexOf("devices") != -1){
		//Nothing to do
	}else if(iFrameSrc.indexOf("gps") != -1){
		dump("[msim]store gps.\n");
		msim_optionsDataString["msim.config.DC.gps.areacode"]    = pageDocument.getElementById("msim-textbox-docomo-gps-areacode").value;
		msim_optionsDataString["msim.config.DC.gps.areaname"]    = pageDocument.getElementById("msim-textbox-docomo-gps-areaname").value;
		msim_optionsDataString["msim.config.DC.gps.lat"]    = pageDocument.getElementById("msim-textbox-docomo-gps-lat").value;
		msim_optionsDataString["msim.config.DC.gps.lon"]    = pageDocument.getElementById("msim-textbox-docomo-gps-lon").value;
		msim_optionsDataString["msim.config.DC.gps.alt"]    = pageDocument.getElementById("msim-textbox-docomo-gps-alt").value;
		msim_optionsDataString["msim.config.AU.gps.lat"]    = pageDocument.getElementById("msim-textbox-au-gps-lat").value;
		msim_optionsDataString["msim.config.AU.gps.lon"]    = pageDocument.getElementById("msim-textbox-au-gps-lon").value;
	}else if(iFrameSrc.indexOf("pictogram") != -1){
		dump("[msim]store pictogram.\n");
		msim_optionsDataBoolean["msim.config.DC.pictogram.enabled"]    = pageDocument.getElementById("msim-textbox-docomo-pictogram-enabled").checked;
		msim_optionsDataBoolean["msim.config.AU.pictogram.enabled"]    = pageDocument.getElementById("msim-textbox-au-pictogram-enabled").checked;
		msim_optionsDataBoolean["msim.config.SB.pictogram.enabled"]    = pageDocument.getElementById("msim-textbox-softbank-pictogram-enabled").checked;
	}
}

// Called whenever the device box is selected
function msim_deviceSelected(){
	dump("something selected\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox    = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	var editButton   = pageDocument.getElementById("msim-edit");
	if(selectedItem){
		editButton.disabled = false;
	}else{
		editButton.disabled = true;
	}
}

function clearAllDeviceSettings(){
	if(confirm(document.getElementById("msim-string-bundle").getString("msim_clearAllConfirmation"))){
		carrierArray.forEach(function(carrier){
			dump("target carrier is "+carrier+"\n");
			pref.deletePref("msim.devicelist." + carrier + ".count");
			var count = pref.getIntPref("msim.devicelist." + carrier + ".count");
			for(var i=1; i<=count; i++){
				var prefPrefix = "msim.devicelist." + carrier + "." + i + ".";

				dump("target prefix is "+prefPrefix+"\n");
				deviceBasicAttribute.concat(deviceAttribute[carrier]).forEach(function(attribute){
					pref.deletePref(prefPrefix+attribute);
				});
			}
		});

		pref.deletePref("msim.current.carrier");
		pref.deletePref("msim.current.device");
		pref.deletePref("general.useragent.override");
		pref.deletePref("msim.current.useragent");
		pref.deletePref("msim.current.id");

		//TODO:ツールバー上のiconをupdate
		//parent.msim.resetDevice();
	}

	msim_initializeDevices();
}

// Initializes the general page
function msim_initializeGps(){
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-gps-areacode").setAttribute("value",pref.copyUnicharPref("msim.config.DC.gps.areacode"));
	pageDocument.getElementById("msim-textbox-docomo-gps-areaname").setAttribute("value",pref.copyUnicharPref("msim.config.DC.gps.areaname"));
	pageDocument.getElementById("msim-textbox-docomo-gps-lat").setAttribute("value",pref.copyUnicharPref("msim.config.DC.gps.lat"));
	pageDocument.getElementById("msim-textbox-docomo-gps-lon").setAttribute("value",pref.copyUnicharPref("msim.config.DC.gps.lon"));
	pageDocument.getElementById("msim-textbox-docomo-gps-alt").setAttribute("value",pref.copyUnicharPref("msim.config.DC.gps.alt"));
	pageDocument.getElementById("msim-textbox-au-gps-lat").setAttribute("value",pref.copyUnicharPref("msim.config.AU.gps.lat"));
	pageDocument.getElementById("msim-textbox-au-gps-lon").setAttribute("value",pref.copyUnicharPref("msim.config.AU.gps.lon"));
}

function msim_initializePictogram(){
	dump("[msim]initializePictogram.\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-pictogram-enabled").checked = pref.getBoolPref("msim.config.DC.pictogram.enabled");
	pageDocument.getElementById("msim-textbox-au-pictogram-enabled").checked = pref.getBoolPref("msim.config.AU.pictogram.enabled");
	pageDocument.getElementById("msim-textbox-softbank-pictogram-enabled").checked = pref.getBoolPref("msim.config.SB.pictogram.enabled");
}
