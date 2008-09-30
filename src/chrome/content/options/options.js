/* ***** BEGIN LICENSE BLOCK Version: GPL 3.0 ***** 
 * FireMobileFimulator is a Firefox add-on that simulate web browsers of 
 * japanese mobile phones.
 * Copyright (C) 2008  Takahiro Horikawa <horikawa.takahiro@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * ***** END LICENSE BLOCK ***** */

var firemobilesimulator;
if(!firemobilesimulator) firemobilesimulator = {};
if(!firemobilesimulator.options) firemobilesimulator.options = {};

firemobilesimulator.options.optionsDataBoolean = new Array();
firemobilesimulator.options.optionsDataInteger = new Array();
firemobilesimulator.options.optionsDataString  = new Array();

//Adds a device
firemobilesimulator.options.addDevice = function(){
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
firemobilesimulator.options.changePage = function(pageList){
	firemobilesimulator.options.storeOptions();
	document.getElementById("msim-options-iframe").setAttribute("src", pageList.selectedItem.getAttribute("value"));
}

//Deletes a device
firemobilesimulator.options.deleteDevice = function(){
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox    = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	if(selectedItem && confirm(document.getElementById("msim-string-bundle").getString("firemobilesimulator.options.deleteConfirmation"))){
		var carrier = selectedItem.getAttribute("carrier");
		var deletedId = parseInt(selectedItem.getAttribute("id"));
		var prefPrefix = "msim.devicelist." + carrier + "." + deletedId + "."
		deviceBasicAttribute.concat(deviceAttribute[carrier]).forEach(function(attribute){
			firemobilesimulator.common.pref.deletePref(prefPrefix+attribute);
		});

		//既に使われている端末だったら設定をリセット
		if(firemobilesimulator.common.pref.copyUnicharPref("msim.current.id") == deletedId && firemobilesimulator.common.pref.copyUnicharPref("msim.current.carrier") == carrier){
			firemobilesimulator.options.core.resetDevice();
		}

		//各端末のidを再計算
		var count = firemobilesimulator.common.pref.getIntPref("msim.devicelist." + carrier + ".count");
		dump(deletedId+":"+count+"\n");
		dump((deletedId+1)+":"+count+"\n");
		for(var i=deletedId+1; i<=count; i++){
			dump("[msim]Debug : Id is not the last one.Re-arrange ids.\n");
			var sPrefPrefix = "msim.devicelist." + carrier + "." + i + ".";
			var ePrefPrefix = "msim.devicelist." + carrier + "." + (i-1) + ".";
			deviceBasicAttribute.contcat(deviceAttribute[carrier]).forEach(function(attribute){
				firemobilesimulator.common.pref.setUnicharPref(ePrefPrefix+attribute, firemobilesimulator.common.pref.copyUnicharPref(sPrefPrefix+attribute));
			});
		}
		firemobilesimulator.common.pref.setIntPref("msim.devicelist." + carrier + ".count", count-1);

		deviceBox.removeChild(selectedItem);
	}
}

//Edits a device
firemobilesimulator.options.editDevice = function(){
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox    = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	var retVals = {};
	if(selectedItem){
		var carrier = selectedItem.getAttribute("carrier");
		var id = selectedItem.getAttribute("id");
		if(window.openDialog("chrome://msim/content/options/dialogs/device.xul", "msim-device-dialog", "centerscreen,chrome,modal,resizable", "edit", carrier, id, retVals)){
			//setDevice(carrier, id);
			if(retVals.id && retVals.carrier){
				if(firemobilesimulator.common.pref.copyUnicharPref("msim.current.id") == retVals.id && firemobilesimulator.common.pref.copyUnicharPref("msim.current.carrier") == retVals.carrier){
					firemobilesimulator.core.setDevice(retVals.carrier, retVals.id);
				}
			}
		}
	}else{
		dump("[msim]Error : Device is not selected.\n");
	}
}

// Initializes the options dialog box
firemobilesimulator.options.initializeOptions = function(){
	var selectedPage = document.getElementById("msim-page-list").selectedItem.getAttribute("value");

	// If this is the general page
	if(selectedPage.indexOf("general") != -1){
		firemobilesimulator.options.initializeGeneral();
	}else if(selectedPage.indexOf("idno") != -1){
		firemobilesimulator.options.initializeIdno();
	}else if(selectedPage.indexOf("devices") != -1){
		firemobilesimulator.options.initializeDevices();
	}else if(selectedPage.indexOf("gps") != -1){
		firemobilesimulator.options.initializeGps();
	}else if(selectedPage.indexOf("pictogram") != -1){
		firemobilesimulator.options.initializePictogram();
	}
}

// Initializes the general page
firemobilesimulator.options.initializeGeneral = function()
{
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-checkbox-general-force-screen-width").checked = firemobilesimulator.common.pref.getBoolPref("msim.config.general.force-screen-width");
	pageDocument.getElementById("msim-checkbox-general-reset-device-onquit").checked = firemobilesimulator.common.pref.getBoolPref("msim.config.general.reset-device-onquit");
}

// Initializes the general page
firemobilesimulator.options.initializeIdno = function()
{
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-uid").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.uid"));
	pageDocument.getElementById("msim-textbox-docomo-ser").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.ser"));
	pageDocument.getElementById("msim-textbox-docomo-icc").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.icc"));
	pageDocument.getElementById("msim-textbox-docomo-guid").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.guid"));
	pageDocument.getElementById("msim-textbox-au-uid").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.uid"));
	pageDocument.getElementById("msim-textbox-softbank-uid").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.SB.uid"));
	pageDocument.getElementById("msim-textbox-softbank-serial").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.SB.serial"));
}

// Initializes the devices page
firemobilesimulator.options.initializeDevices = function(){
	dump("firemobilesimulator.options.initializeDevices\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox    = pageDocument.getElementById("msim-listbox");
	var deviceCount  = 0;

	while(deviceBox.lastChild.tagName != "listhead"){
		dump("removeList:"+deviceBox.lastChild.tagName+"\n");
		deviceBox.removeChild(deviceBox.lastChild);
	}

	firemobilesimulator.common.carrier.carrierArray.forEach(function(carrier){

		deviceCount = firemobilesimulator.common.pref.getIntPref("msim.devicelist." + carrier + ".count");
		for(var i = 1; i <= deviceCount; i++){
			var device = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + carrier + "." + i + ".device");
			var useragent = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + carrier + "." + i + ".useragent");
			if(device){
				var listItem = deviceBox.appendItem(carrier + ":" + device, useragent);
				listItem.setAttribute("carrier", carrier);
				listItem.setAttribute("id", i);
			}
		}
	});

	firemobilesimulator.options.deviceSelected();
}

// Saves the user's options
firemobilesimulator.options.saveOptions = function(){
	var option      = null;
	var optionValue = null;

	// Make sure current page is stored
	firemobilesimulator.options.storeOptions();

	// Loop through the boolean options
	for(option in firemobilesimulator.options.optionsDataBoolean){
		firemobilesimulator.common.pref.setBoolPref(option, firemobilesimulator.options.optionsDataBoolean[option]);
	}

	// Loop through the integer options
	for(option in firemobilesimulator.options.optionsDataInteger){
		firemobilesimulator.common.pref.setIntPref(option, firemobilesimulator.options.optionsDataInteger[option]);
	}

	// Loop through the string options
	for(option in firemobilesimulator.options.optionsDataString){
		firemobilesimulator.common.pref.setUnicharPref(option, firemobilesimulator.options.optionsDataString[option]);
	}
}

// Stores the user's options to be saved later
firemobilesimulator.options.storeOptions = function(){
	var iFrame       = document.getElementById("msim-options-iframe");
	var iFrameSrc    = iFrame.getAttribute("src");
	var pageDocument = iFrame.contentDocument;

	// If this is the general page
	if(iFrameSrc.indexOf("general") != -1){
		dump("[msim]store general.\n");
		firemobilesimulator.options.optionsDataBoolean["msim.config.general.force-screen-width"]    = pageDocument.getElementById("msim-checkbox-general-force-screen-width").checked;
		firemobilesimulator.options.optionsDataBoolean["msim.config.general.reset-device-onquit"]    = pageDocument.getElementById("msim-checkbox-general-reset-device-onquit").checked;
		//Nothing to do
	}else if(iFrameSrc.indexOf("idno") != -1){
		dump("[msim]store idno.\n");
		firemobilesimulator.options.optionsDataString["msim.config.DC.uid"]    = pageDocument.getElementById("msim-textbox-docomo-uid").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.ser"]    = pageDocument.getElementById("msim-textbox-docomo-ser").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.icc"]    = pageDocument.getElementById("msim-textbox-docomo-icc").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.guid"]   = pageDocument.getElementById("msim-textbox-docomo-guid").value;
		firemobilesimulator.options.optionsDataString["msim.config.AU.uid"]    = pageDocument.getElementById("msim-textbox-au-uid").value;
		firemobilesimulator.options.optionsDataString["msim.config.SB.uid"]    = pageDocument.getElementById("msim-textbox-softbank-uid").value;
		firemobilesimulator.options.optionsDataString["msim.config.SB.serial"] = pageDocument.getElementById("msim-textbox-softbank-serial").value;
		var carrier = firemobilesimulator.common.pref.copyUnicharPref("msim.current.carrier");
		if(carrier == firemobilesimulator.common.carrier.SOFTBANK){
			dump("[msim]Debug : Current Carrier is SoftBank. Replace User-Agent.\n");
			var id = firemobilesimulator.common.pref.copyUnicharPref("msim.current.id");
			var useragent = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist."+carrier+"."+id+".useragent");
			var newUserAgent = firemobilesimulator.common.carrier.getSoftBankUserAgent(useragent, firemobilesimulator.options.optionsDataString["msim.config.SB.serial"]);
			firemobilesimulator.options.optionsDataString["general.useragent.override"] = newUserAgent;
			firemobilesimulator.options.optionsDataString["msim.current.useragent"] = newUserAgent;
		}
	}else if(iFrameSrc.indexOf("devices") != -1){
		//Nothing to do
	}else if(iFrameSrc.indexOf("gps") != -1){
		dump("[msim]store gps.\n");
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.areacode"]    = pageDocument.getElementById("msim-textbox-docomo-gps-areacode").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.areaname"]    = pageDocument.getElementById("msim-textbox-docomo-gps-areaname").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.lat"]    = pageDocument.getElementById("msim-textbox-docomo-gps-lat").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.lon"]    = pageDocument.getElementById("msim-textbox-docomo-gps-lon").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.alt"]    = pageDocument.getElementById("msim-textbox-docomo-gps-alt").value;
		firemobilesimulator.options.optionsDataString["msim.config.AU.gps.lat"]    = pageDocument.getElementById("msim-textbox-au-gps-lat").value;
		firemobilesimulator.options.optionsDataString["msim.config.AU.gps.lon"]    = pageDocument.getElementById("msim-textbox-au-gps-lon").value;
	}else if(iFrameSrc.indexOf("pictogram") != -1){
		dump("[msim]store pictogram.\n");
		firemobilesimulator.options.optionsDataBoolean["msim.config.DC.pictogram.enabled"]    = pageDocument.getElementById("msim-textbox-docomo-pictogram-enabled").checked;
		firemobilesimulator.options.optionsDataBoolean["msim.config.AU.pictogram.enabled"]    = pageDocument.getElementById("msim-textbox-au-pictogram-enabled").checked;
		firemobilesimulator.options.optionsDataBoolean["msim.config.SB.pictogram.enabled"]    = pageDocument.getElementById("msim-textbox-softbank-pictogram-enabled").checked;
	}
}

// Called whenever the device box is selected
firemobilesimulator.options.deviceSelected = function(){
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

firemobilesimulator.options.clearAllDeviceSettings = function(){
	if(confirm(document.getElementById("msim-string-bundle").getString("msim_clearAllConfirmation"))){
		firemobilesimulator.common.carrier.carrierArray.forEach(function(carrier){
			dump("target carrier is "+carrier+"\n");
			firemobilesimulator.common.pref.deletePref("msim.devicelist." + carrier + ".count");
			var count = firemobilesimulator.common.pref.getIntPref("msim.devicelist." + carrier + ".count");
			for(var i=1; i<=count; i++){
				var prefPrefix = "msim.devicelist." + carrier + "." + i + ".";

				dump("target firemobilesimulator.common.pref.x is "+prefPrefix+"\n");
				deviceBasicAttribute.concat(deviceAttribute[carrier]).forEach(function(attribute){
					firemobilesimulator.common.pref.deletePref(prefPrefix+attribute);
				});
			}
		});

		firemobilesimulator.common.pref.deletePref("msim.current.carrier");
		firemobilesimulator.common.pref.deletePref("msim.current.device");
		firemobilesimulator.common.pref.deletePref("general.useragent.override");
		firemobilesimulator.common.pref.deletePref("msim.current.useragent");
		firemobilesimulator.common.pref.deletePref("msim.current.id");

		//TODO:ツールバー上のiconをupdate
		//parent.msim.resetDevice();
	}

	firemobilesimulator.options.initializeDevices();
}

// Initializes the general page
firemobilesimulator.options.initializeGps = function(){
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-gps-areacode").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.gps.areacode"));
	pageDocument.getElementById("msim-textbox-docomo-gps-areaname").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.gps.areaname"));
	pageDocument.getElementById("msim-textbox-docomo-gps-lat").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.gps.lat"));
	pageDocument.getElementById("msim-textbox-docomo-gps-lon").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.gps.lon"));
	pageDocument.getElementById("msim-textbox-docomo-gps-alt").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.gps.alt"));
	pageDocument.getElementById("msim-textbox-au-gps-lat").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.lat"));
	pageDocument.getElementById("msim-textbox-au-gps-lon").setAttribute("value",firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.lon"));
}

firemobilesimulator.options.initializePictogram = function(){
	dump("[msim]initializePictogram.\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-pictogram-enabled").checked = firemobilesimulator.common.pref.getBoolPref("msim.config.DC.pictogram.enabled");
	pageDocument.getElementById("msim-textbox-au-pictogram-enabled").checked = firemobilesimulator.common.pref.getBoolPref("msim.config.AU.pictogram.enabled");
	pageDocument.getElementById("msim-textbox-softbank-pictogram-enabled").checked = firemobilesimulator.common.pref.getBoolPref("msim.config.SB.pictogram.enabled");
}
