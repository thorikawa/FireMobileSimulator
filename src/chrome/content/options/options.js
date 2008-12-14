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
if (!firemobilesimulator)
	firemobilesimulator = {};
if (!firemobilesimulator.options)
	firemobilesimulator.options = {};

firemobilesimulator.options.optionsDataBoolean = new Array();
firemobilesimulator.options.optionsDataInteger = new Array();
firemobilesimulator.options.optionsDataString = new Array();

// Adds a device
firemobilesimulator.options.addDevice = function() {
	var retVals = {};
	if (window.openDialog("chrome://msim/content/options/dialogs/device.xul",
	                      "msim-device-dialog", "centerscreen,chrome,modal,resizable", "add",
	                      null, retVals)) {
		if (retVals.id) {
			var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
			var deviceBox = pageDocument.getElementById("msim-listbox");
			var listItem = deviceBox.appendItem(retVals.carrier + " "
			                                    + retVals.deviceName, retVals.userAgent);
			listItem.setAttribute("id", retVals.id);
			deviceBox.ensureElementIsVisible(listItem);
			deviceBox.selectItem(listItem);
		}
	} else {
		dump("canceld?\n");
	}
};

// Handles changing the options page
firemobilesimulator.options.changePage = function(pageList) {
	firemobilesimulator.options.storeOptions();
	document.getElementById("msim-options-iframe")
	        .setAttribute("src", pageList.selectedItem.getAttribute("value"));
};

// Deletes a device
firemobilesimulator.options.deleteDevice = function() {
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	if (selectedItem
			&& confirm(document.getElementById("msim-string-bundle")
			                   .getString("msim_deleteConfirmation"))) {
		var deletedId = parseInt(selectedItem.getAttribute("id"));
		firemobilesimulator.core.deleteDevice(deletedId);
		deviceBox.removeChild(selectedItem);
	}
};

// Edits a device
firemobilesimulator.options.editDevice = function() {
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	var retVals = {};
	if (selectedItem) {
		var id = selectedItem.getAttribute("id");
		if (window.openDialog(
				"chrome://msim/content/options/dialogs/device.xul",
				"msim-device-dialog", "centerscreen,chrome,modal,resizable",
				"edit", id, retVals)) {
			if (retVals.id) {
				if (firemobilesimulator.common.pref.copyUnicharPref("msim.current.id") == retVals.id) {
					firemobilesimulator.core.setDevice(retVals.id);
				}
			}
		}
	} else {
		dump("[msim]Error : Device is not selected.\n");
	}
};

// Initializes the options dialog box
firemobilesimulator.options.initializeOptions = function() {
	var selectedPage = document.getElementById("msim-page-list").selectedItem
			.getAttribute("value");

	// If this is the general page
	if (selectedPage.indexOf("general") != -1) {
		firemobilesimulator.options.initializeGeneral();
	} else if (selectedPage.indexOf("idno") != -1) {
		firemobilesimulator.options.initializeIdno();
	} else if (selectedPage.indexOf("devices") != -1) {
		firemobilesimulator.options.initializeDevices();
	} else if (selectedPage.indexOf("gps") != -1) {
		firemobilesimulator.options.initializeGps();
	} else if (selectedPage.indexOf("pictogram") != -1) {
		firemobilesimulator.options.initializePictogram();
	}
};

// Initializes the general page
firemobilesimulator.options.initializeGeneral = function() {
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-checkbox-general-force-screen-width").checked = firemobilesimulator.common.pref
			.getBoolPref("msim.config.general.force-screen-width");
	pageDocument.getElementById("msim-checkbox-general-reset-device-onquit").checked = firemobilesimulator.common.pref
			.getBoolPref("msim.config.general.reset-device-onquit");
};

// Initializes the general page
firemobilesimulator.options.initializeIdno = function() {
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-uid").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.DC.uid"));
	pageDocument.getElementById("msim-textbox-docomo-ser").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.DC.ser"));
	pageDocument.getElementById("msim-textbox-docomo-icc").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.DC.icc"));
	pageDocument.getElementById("msim-textbox-docomo-guid").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.DC.guid"));
	pageDocument.getElementById("msim-textbox-au-uid").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.AU.uid"));
	pageDocument.getElementById("msim-textbox-softbank-uid").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.SB.uid"));
	pageDocument.getElementById("msim-textbox-softbank-serial").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.SB.serial"));
};

// Initializes the devices page
firemobilesimulator.options.initializeDevices = function() {
	dump("firemobilesimulator.options.initializeDevices\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox = pageDocument.getElementById("msim-listbox");

	while (deviceBox.lastChild.tagName != "listhead") {
		dump("removeList:" + deviceBox.lastChild.tagName + "\n");
		deviceBox.removeChild(deviceBox.lastChild);
	}

	var deviceCount = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
	for (var i = 1; i <= deviceCount; i++) {
		var carrier = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i + ".carrier");
		var device = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i + ".label");
		var useragent = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i + ".useragent");
		if (device) {
			var listItem = deviceBox.appendItem(carrier + " " + device, useragent);
			listItem.setAttribute("id", i);
		}
	}

	firemobilesimulator.options.deviceSelected();
};

// Saves the user's options
firemobilesimulator.options.saveOptions = function() {
	var option = null;
	var optionValue = null;

	// Make sure current page is stored
	firemobilesimulator.options.storeOptions();

	// Loop through the boolean options
	for (option in firemobilesimulator.options.optionsDataBoolean) {
		firemobilesimulator.common.pref.setBoolPref(option,
				firemobilesimulator.options.optionsDataBoolean[option]);
	}

	// Loop through the integer options
	for (option in firemobilesimulator.options.optionsDataInteger) {
		firemobilesimulator.common.pref.setIntPref(option,
				firemobilesimulator.options.optionsDataInteger[option]);
	}

	// Loop through the string options
	for (option in firemobilesimulator.options.optionsDataString) {
		firemobilesimulator.common.pref.setUnicharPref(option,
				firemobilesimulator.options.optionsDataString[option]);
	}
};

// Stores the user's options to be saved later
firemobilesimulator.options.storeOptions = function() {
	var iFrame = document.getElementById("msim-options-iframe");
	var iFrameSrc = iFrame.getAttribute("src");
	var pageDocument = iFrame.contentDocument;

	// If this is the general page
	if (iFrameSrc.indexOf("general") != -1) {
		dump("[msim]store general.\n");
		firemobilesimulator.options.optionsDataBoolean["msim.config.general.force-screen-width"] = pageDocument
				.getElementById("msim-checkbox-general-force-screen-width").checked;
		firemobilesimulator.options.optionsDataBoolean["msim.config.general.reset-device-onquit"] = pageDocument
				.getElementById("msim-checkbox-general-reset-device-onquit").checked;
		// Nothing to do
	} else if (iFrameSrc.indexOf("idno") != -1) {
		dump("[msim]store idno.\n");
		firemobilesimulator.options.optionsDataString["msim.config.DC.uid"] = pageDocument
				.getElementById("msim-textbox-docomo-uid").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.ser"] = pageDocument
				.getElementById("msim-textbox-docomo-ser").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.icc"] = pageDocument
				.getElementById("msim-textbox-docomo-icc").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.guid"] = pageDocument
				.getElementById("msim-textbox-docomo-guid").value;
		firemobilesimulator.options.optionsDataString["msim.config.AU.uid"] = pageDocument
				.getElementById("msim-textbox-au-uid").value;
		firemobilesimulator.options.optionsDataString["msim.config.SB.uid"] = pageDocument
				.getElementById("msim-textbox-softbank-uid").value;
		firemobilesimulator.options.optionsDataString["msim.config.SB.serial"] = pageDocument
				.getElementById("msim-textbox-softbank-serial").value;
		var carrier = firemobilesimulator.common.pref
				.copyUnicharPref("msim.current.carrier");
		if (carrier == firemobilesimulator.common.carrier.SOFTBANK) {
			dump("[msim]Debug : Current Carrier is SoftBank. Replace User-Agent.\n");
			var id = firemobilesimulator.common.pref
					.copyUnicharPref("msim.current.id");
			var useragent = firemobilesimulator.common.pref
					.copyUnicharPref("msim.devicelist." + id + ".useragent");
			var newUserAgent = firemobilesimulator.common.carrier
					.getSoftBankUserAgent(
							useragent,
							firemobilesimulator.options.optionsDataString["msim.config.SB.serial"]);
			firemobilesimulator.options.optionsDataString["general.useragent.override"] = newUserAgent;
			firemobilesimulator.options.optionsDataString["msim.current.useragent"] = newUserAgent;
		}
	} else if (iFrameSrc.indexOf("devices") != -1) {
		// Nothing to do
	} else if (iFrameSrc.indexOf("gps") != -1) {
		dump("[msim]store gps.\n");
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.areacode"] = pageDocument
				.getElementById("msim-textbox-docomo-gps-areacode").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.areaname"] = pageDocument
				.getElementById("msim-textbox-docomo-gps-areaname").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.lat"] = pageDocument
				.getElementById("msim-textbox-docomo-gps-lat").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.lon"] = pageDocument
				.getElementById("msim-textbox-docomo-gps-lon").value;
		firemobilesimulator.options.optionsDataString["msim.config.DC.gps.alt"] = pageDocument
				.getElementById("msim-textbox-docomo-gps-alt").value;
		firemobilesimulator.options.optionsDataString["msim.config.AU.gps.lat"] = pageDocument
				.getElementById("msim-textbox-au-gps-lat").value;
		firemobilesimulator.options.optionsDataString["msim.config.AU.gps.lon"] = pageDocument
				.getElementById("msim-textbox-au-gps-lon").value;
	} else if (iFrameSrc.indexOf("pictogram") != -1) {
		dump("[msim]store pictogram.\n");
		firemobilesimulator.options.optionsDataBoolean["msim.config.DC.pictogram.enabled"] = pageDocument
				.getElementById("msim-textbox-docomo-pictogram-enabled").checked;
		firemobilesimulator.options.optionsDataBoolean["msim.config.AU.pictogram.enabled"] = pageDocument
				.getElementById("msim-textbox-au-pictogram-enabled").checked;
		firemobilesimulator.options.optionsDataBoolean["msim.config.SB.pictogram.enabled"] = pageDocument
				.getElementById("msim-textbox-softbank-pictogram-enabled").checked;
	}
};

// Called whenever the device box is selected
firemobilesimulator.options.deviceSelected = function() {
	dump("something selected\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	var deviceBox = pageDocument.getElementById("msim-listbox");
	var selectedItem = deviceBox.selectedItem;
	var editButton = pageDocument.getElementById("msim-edit");
	if (selectedItem) {
		editButton.disabled = false;
	} else {
		editButton.disabled = true;
	}
};

firemobilesimulator.options.clearAllDeviceSettings = function() {
	if (confirm(document.getElementById("msim-string-bundle").getString("msim_clearAllConfirmation"))) {
		firemobilesimulator.core.clearAllDevice();
	}

	firemobilesimulator.options.initializeDevices();
};

// Initializes the general page
firemobilesimulator.options.initializeGps = function() {
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-gps-areacode")
			.setAttribute(
					"value",
					firemobilesimulator.common.pref
							.copyUnicharPref("msim.config.DC.gps.areacode"));
	pageDocument.getElementById("msim-textbox-docomo-gps-areaname")
			.setAttribute(
					"value",
					firemobilesimulator.common.pref
							.copyUnicharPref("msim.config.DC.gps.areaname"));
	pageDocument.getElementById("msim-textbox-docomo-gps-lat").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.DC.gps.lat"));
	pageDocument.getElementById("msim-textbox-docomo-gps-lon").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.DC.gps.lon"));
	pageDocument.getElementById("msim-textbox-docomo-gps-alt").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.DC.gps.alt"));
	pageDocument.getElementById("msim-textbox-au-gps-lat").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.AU.gps.lat"));
	pageDocument.getElementById("msim-textbox-au-gps-lon").setAttribute(
			"value",
			firemobilesimulator.common.pref
					.copyUnicharPref("msim.config.AU.gps.lon"));
};

firemobilesimulator.options.initializePictogram = function() {
	dump("[msim]initializePictogram.\n");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
	pageDocument.getElementById("msim-textbox-docomo-pictogram-enabled").checked = firemobilesimulator.common.pref
			.getBoolPref("msim.config.DC.pictogram.enabled");
	pageDocument.getElementById("msim-textbox-au-pictogram-enabled").checked = firemobilesimulator.common.pref
			.getBoolPref("msim.config.AU.pictogram.enabled");
	pageDocument.getElementById("msim-textbox-softbank-pictogram-enabled").checked = firemobilesimulator.common.pref
			.getBoolPref("msim.config.SB.pictogram.enabled");
};

// XMLでのエクスポート
firemobilesimulator.options.exportDevices = function() {
	var filePicker = Components.classes["@mozilla.org/filepicker;1"]
			.createInstance(Components.interfaces.nsIFilePicker);
	var result = null;

	filePicker.defaultExtension = "xml";
	filePicker.defaultString = "firemobilesimulator.xml";

	filePicker.appendFilter("XML Files", "*.xml");
	filePicker.init(window, "Export Devices", filePicker.modeSave);

	result = filePicker.show();

	if (result == filePicker.returnOK || result == filePicker.returnReplace) {
		var file = filePicker.file;
		var listItem = null;
		var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
				.createInstance(Components.interfaces.nsIFileOutputStream);
		var xmlDocument = document.implementation.createDocument("", "", null);
		var rootElement = xmlDocument.createElement("FireMobileSimulator");
		var xmlSerializer = new XMLSerializer();

		if (!file.exists()) {
			file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 00644);
		}

		var eDeviceList = xmlDocument.createElement("DeviceList");

		var deviceCount = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
		for (var i = 1; i <= deviceCount; i++) {

			var eDevice = xmlDocument.createElement("Device");
			rootElement.appendChild(eDevice);

			firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(key){
				if(key == "extra-header"){
					var extraHeaders = firemobilesimulator.common.pref.getListPref("msim.devicelist." + i
									+ ".extra-header", ["name", "value"]);
					var eExtraHeaders = xmlDocument.createElement("ExtraHeaders");
					extraHeaders.forEach(function(extraHeader) {
						var eExtraHeader = xmlDocument.createElement("Header");
						var eHeaderName = xmlDocument.createElement("Name");
						var eHeaderValue = xmlDocument.createElement("Value");
						eHeaderName.appendChild(xmlDocument
								.createTextNode(extraHeader.name));
						eHeaderValue.appendChild(xmlDocument
								.createTextNode(extraHeader.value));
						eExtraHeader.appendChild(eHeaderName);
						eExtraHeader.appendChild(eHeaderValue);
						eExtraHeaders.appendChild(eExtraHeader);
					});
					eDevice.appendChild(eExtraHeaders);
				}else{
					var tagName = firemobilesimulator.common.carrier.xmlTagName[key];
					dump("key:"+key+"\n");
					dump("tagName:"+tagName+"\n");
					if(tagName){
						dump("createelement.\n");
						var value = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + i + "." + key);
						dump("msim.devicelist." + i + "." + key+"\n");
						var ele = xmlDocument.createElement(tagName);
						ele.appendChild(xmlDocument.createTextNode(value));
						eDevice.appendChild(ele);
					}else{
						dump("[msim]Error:No TagName.\n");
					}
				}
			});
			eDeviceList.appendChild(eDevice);
		}

		rootElement.appendChild(eDeviceList);
		xmlDocument.appendChild(rootElement);

		outputStream.init(file, 0x04 | 0x08 | 0x20, 00644, null);
		// 日本語を含むUTF-8対応
		var xmlContent = unescape(encodeURIComponent(XML(xmlSerializer
				.serializeToString(xmlDocument)).toXMLString()));
		outputStream.write(xmlContent, xmlContent.length);
		outputStream.close();
	}
	confirm(stringBundle.getFormattedString("msim_exportCompleted"));
	return;
};

firemobilesimulator.options.importDevices = function() {
	var filePicker = Components.classes["@mozilla.org/filepicker;1"]
			.createInstance(Components.interfaces.nsIFilePicker);
	var stringBundle = document.getElementById("msim-string-bundle");
	var pageDocument = document.getElementById("msim-options-iframe").contentDocument;

	filePicker.appendFilter("XML Files", "*.xml");
	filePicker.init(window, "Import Devices", filePicker.modeOpen);

	// If the user selected an XML file
	if (filePicker.show() != filePicker.returnOK) {
		dump("not ok\n");
		return;
	}

	var file = filePicker.file;
	var filePath = file.path;

	// If the file exists, is a file and is readable
	if (!file.exists() || !file.isFile() || !file.isReadable()) {
		alert(stringBundle.getFormattedString("msim_importFileFailed",
				[filePath]));
		return;
	}
	var devices = firemobilesimulator.core.parseDeviceListXML("file://"+filePath, null);

	var overwrite = pageDocument.getElementById("msim.import.overwrite").checked;
	firemobilesimulator.core.LoadDevices(devices, overwrite);

	confirm(stringBundle.getFormattedString("msim_importFileCompleted"));
	return;
};
