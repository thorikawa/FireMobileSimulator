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
if (!firemobilesimulator) firemobilesimulator = {};
var fms;
if (!fms) fms = firemobilesimulator;
if (!fms.options) fms.options = {};

fms.options.optionsDataBoolean = new Array();
fms.options.optionsDataInteger = new Array();
fms.options.optionsDataString = new Array();

// Adds a device
fms.options.addDevice = function() {
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

// Adds a limitHost
fms.options.addLimitHost = function() {
  var retVals = {};
  if (window.openDialog("chrome://msim/content/options/dialogs/limitHost.xul",
                        "msim-limitHost-dialog", "centerscreen,chrome,modal,resizable", "add",
                        null, retVals)) {
    if (retVals.id) {
      var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
      var listBox = pageDocument.getElementById("msim-listbox");
      var listItem = listBox.appendItem(retVals.host,retVals.host);
      listItem.setAttribute("id", retVals.id);
      listBox.ensureElementIsVisible(listItem);
      listBox.selectItem(listItem);
    }
  } else {
    dump("canceld?\n");
  }
};

// Handles changing the options page
fms.options.changePage = function(pageList) {
  fms.options.storeOptions();
  document.getElementById("msim-options-iframe")
          .setAttribute("src", pageList.selectedItem.getAttribute("value"));
};

// Deletes a device
fms.options.deleteDevice = function() {
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

// Deletes a limitHost
fms.options.deleteLimitHost = function() {
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
  var listBox = pageDocument.getElementById("msim-listbox");
  var selectedItem = listBox.selectedItem;
  if (selectedItem
      && confirm(document.getElementById("msim-string-bundle")
                         .getString("msim_deleteLimitHostConfirmation"))) {
    var deletedId = parseInt(selectedItem.getAttribute("id"));
    firemobilesimulator.core.deleteLimitHost(deletedId);
    fms.options.initializeLimitHost();
  }
};

// Edits a device
fms.options.editDevice = function() {
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
        if (fms.common.pref.copyUnicharPref("msim.current.id") == retVals.id) {
          firemobilesimulator.core.setDevice(retVals.id);
        }
      }
    }
  } else {
    dump("[msim]Error : Device is not selected.\n");
  }
};

// Edits a limitHost
fms.options.editLimitHost = function() {
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
  var listBox = pageDocument.getElementById("msim-listbox");
  var selectedItem = listBox.selectedItem;
  var retVals = {};
  if (selectedItem) {
    var id = selectedItem.getAttribute("id");
    if (window.openDialog("chrome://msim/content/options/dialogs/limitHost.xul",
                        "msim-limitHost-dialog", "centerscreen,chrome,modal,resizable", "edit",
                        id, retVals)) {
      
      if (retVals.id) {
        selectedItem.setAttribute("label",retVals.host);
      }
      }
  } else {
    dump("[msim]Error : Device is not selected.\n");
  }
};

// Initializes the options dialog box
fms.options.initializeOptions = function() {
  var selectedPage = document.getElementById("msim-page-list").selectedItem
      .getAttribute("value");

  // If this is the general page
  if (selectedPage.indexOf("general") != -1) {
    fms.options.initializeGeneral();
  } else if (selectedPage.indexOf("idno") != -1) {
    fms.options.initializeIdno();
  } else if (selectedPage.indexOf("devices") != -1) {
    fms.options.initializeDevices();
  } else if (selectedPage.indexOf("gps") != -1) {
    fms.options.initializeGps();
  } else if (selectedPage.indexOf("pictogram") != -1) {
    fms.options.initializePictogram();
  } else if (selectedPage.indexOf("limitHost") != -1) {
    fms.options.initializeLimitHost();
  }
};

// Initializes the general page
fms.options.initializeGeneral = function() {
  var doc = document.getElementById("msim-options-iframe").contentDocument;
  doc.getElementById("msim-checkbox-general-force-screen-width").checked = 
  	fms.common.pref.getBoolPref("msim.config.general.force-screen-width");
  doc.getElementById("msim-checkbox-general-reset-device-onquit").checked = 
  	fms.common.pref.getBoolPref("msim.config.general.reset-device-onquit");
  doc.getElementById("msim-checkbox-general-tabselect").checked = 
  	fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
};

// Initializes the general page
fms.options.initializeIdno = function() {
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
  pageDocument.getElementById("msim-textbox-docomo-uid").setAttribute(
      "value",
      fms.common.pref.copyUnicharPref("msim.config.DC.uid"));
  pageDocument.getElementById("msim-textbox-docomo-ser").setAttribute(
      "value",
      fms.common.pref.copyUnicharPref("msim.config.DC.ser"));
  pageDocument.getElementById("msim-textbox-docomo-icc").setAttribute(
      "value",
      fms.common.pref.copyUnicharPref("msim.config.DC.icc"));
  pageDocument.getElementById("msim-textbox-docomo-guid").setAttribute(
      "value",
      fms.common.pref.copyUnicharPref("msim.config.DC.guid"));
  pageDocument.getElementById("msim-textbox-au-uid").setAttribute(
      "value",
      fms.common.pref.copyUnicharPref("msim.config.AU.uid"));
  pageDocument.getElementById("msim-textbox-softbank-uid").setAttribute(
      "value",
      fms.common.pref.copyUnicharPref("msim.config.SB.uid"));
  pageDocument.getElementById("msim-textbox-softbank-serial").setAttribute(
      "value",
      fms.common.pref.copyUnicharPref("msim.config.SB.serial"));
};

// Initializes the devices page
fms.options.initializeDevices = function() {
  dump("fms.options.initializeDevices\n");
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
  var deviceBox = pageDocument.getElementById("msim-listbox");

  while (deviceBox.lastChild.tagName != "listhead") {
    dump("removeList:" + deviceBox.lastChild.tagName + "\n");
    deviceBox.removeChild(deviceBox.lastChild);
  }

  var deviceCount = fms.common.pref.getIntPref("msim.devicelist.count");
  for (var i = 1; i <= deviceCount; i++) {
    var carrier = fms.common.pref
        .copyUnicharPref("msim.devicelist." + i + ".carrier");
    var device = fms.common.pref
        .copyUnicharPref("msim.devicelist." + i + ".label");
    var useragent = fms.common.pref
        .copyUnicharPref("msim.devicelist." + i + ".useragent");
    if (device) {
      var listItem = deviceBox.appendItem(carrier + " " + device, useragent);
      listItem.setAttribute("id", i);
    }
  }

  fms.options.deviceSelected();
};

// Initializes the limitHost page
fms.options.initializeLimitHost = function() {
  dump("fms.options.initializeLimitHost\n");
  
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;

  pageDocument.getElementById("msim-checkbox-limitHost-valid").checked = fms.common.pref
      .getBoolPref("msim.limitHost.enabled");
      
  var listBox = pageDocument.getElementById("msim-listbox");

  while (listBox.lastChild.tagName != "listhead") {
    dump("removeList:" + listBox.lastChild.tagName + "\n");
    listBox.removeChild(listBox.lastChild);
  }

  var cnt = fms.common.pref.getIntPref("msim.limitHost.count");
  for (var i = 1; i <= cnt; i++) {
    var host = fms.common.pref
        .copyUnicharPref("msim.limitHost." + i + ".value");
    if (host) {
      var listItem = listBox.appendItem(host, host);
      listItem.setAttribute("id", i);
    }
  }
  
  fms.options.limitHostSelected();
};

// Saves the user's options
fms.options.saveOptions = function() {
  var option = null;
  var optionValue = null;

  // Make sure current page is stored
  fms.options.storeOptions();

  // Loop through the boolean options
  for (option in fms.options.optionsDataBoolean) {
    fms.common.pref.setBoolPref(option,
        fms.options.optionsDataBoolean[option]);
  }

  // Loop through the integer options
  for (option in fms.options.optionsDataInteger) {
    fms.common.pref.setIntPref(option,
        fms.options.optionsDataInteger[option]);
  }

  // Loop through the string options
  for (option in fms.options.optionsDataString) {
    fms.common.pref.setUnicharPref(option,
        fms.options.optionsDataString[option]);
  }
};

// Stores the user's options to be saved later
fms.options.storeOptions = function() {
  var iFrame = document.getElementById("msim-options-iframe");
  var iFrameSrc = iFrame.getAttribute("src");
  var pageDocument = iFrame.contentDocument;

  // If this is the general page
  if (iFrameSrc.indexOf("general") != -1) {
    dump("[msim]store general.\n");
    fms.options.optionsDataBoolean["msim.config.general.force-screen-width"] = pageDocument
      .getElementById("msim-checkbox-general-force-screen-width").checked;
    fms.options.optionsDataBoolean["msim.config.general.reset-device-onquit"] = pageDocument
      .getElementById("msim-checkbox-general-reset-device-onquit").checked;
    fms.options.optionsDataBoolean["msim.config.tabselect.enabled"] = pageDocument
      .getElementById("msim-checkbox-general-tabselect").checked;
  } else if (iFrameSrc.indexOf("idno") != -1) {
    dump("[msim]store idno.\n");
    fms.options.optionsDataString["msim.config.DC.uid"] = pageDocument
        .getElementById("msim-textbox-docomo-uid").value;
    fms.options.optionsDataString["msim.config.DC.ser"] = pageDocument
        .getElementById("msim-textbox-docomo-ser").value;
    fms.options.optionsDataString["msim.config.DC.icc"] = pageDocument
        .getElementById("msim-textbox-docomo-icc").value;
    fms.options.optionsDataString["msim.config.DC.guid"] = pageDocument
        .getElementById("msim-textbox-docomo-guid").value;
    fms.options.optionsDataString["msim.config.AU.uid"] = pageDocument
        .getElementById("msim-textbox-au-uid").value;
    fms.options.optionsDataString["msim.config.SB.uid"] = pageDocument
        .getElementById("msim-textbox-softbank-uid").value;
    fms.options.optionsDataString["msim.config.SB.serial"] = pageDocument
        .getElementById("msim-textbox-softbank-serial").value;
  } else if (iFrameSrc.indexOf("devices") != -1) {
    // Nothing to do
  } else if (iFrameSrc.indexOf("gps") != -1) {
    dump("[msim]store gps.\n");
    fms.options.optionsDataString["msim.config.DC.gps.areacode"] = pageDocument
        .getElementById("msim-textbox-docomo-gps-areacode").value;
    fms.options.optionsDataString["msim.config.DC.gps.areaname"] = pageDocument
        .getElementById("msim-textbox-docomo-gps-areaname").value;
    fms.options.optionsDataString["msim.config.DC.gps.lat"] = pageDocument
        .getElementById("msim-textbox-docomo-gps-lat").value;
    fms.options.optionsDataString["msim.config.DC.gps.lon"] = pageDocument
        .getElementById("msim-textbox-docomo-gps-lon").value;
    fms.options.optionsDataString["msim.config.DC.gps.alt"] = pageDocument
        .getElementById("msim-textbox-docomo-gps-alt").value;
    fms.options.optionsDataString["msim.config.AU.gps.lat"] = pageDocument
        .getElementById("msim-textbox-au-gps-lat").value;
    fms.options.optionsDataString["msim.config.AU.gps.lon"] = pageDocument
        .getElementById("msim-textbox-au-gps-lon").value;
  } else if (iFrameSrc.indexOf("pictogram") != -1) {
    dump("[msim]store pictogram.\n");
    fms.options.optionsDataBoolean["msim.config.DC.pictogram.enabled"] = pageDocument
        .getElementById("msim-textbox-docomo-pictogram-enabled").checked;
    fms.options.optionsDataBoolean["msim.config.AU.pictogram.enabled"] = pageDocument
        .getElementById("msim-textbox-au-pictogram-enabled").checked;
    fms.options.optionsDataBoolean["msim.config.SB.pictogram.enabled"] = pageDocument
        .getElementById("msim-textbox-softbank-pictogram-enabled").checked;
  } else if (iFrameSrc.indexOf("limitHost") != -1) {
    dump("[msim]store limitHost.\n");
    fms.options.optionsDataBoolean["msim.limitHost.enabled"] = pageDocument
        .getElementById("msim-checkbox-limitHost-valid").checked;
  }
};

// Called whenever the device box is selected
fms.options.deviceSelected = function() {
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

// Called whenever the limitHost box is selected
fms.options.limitHostSelected = function() {
  dump("something limitHost selected\n");
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
  var listBox = pageDocument.getElementById("msim-listbox");
  var selectedItem = listBox.selectedItem;
  var editButton = pageDocument.getElementById("msim-edit");
  if (selectedItem) {
    editButton.disabled = false;
  } else {
    editButton.disabled = true;
  }
};

fms.options.clearAllDeviceSettings = function() {
  if (confirm(document.getElementById("msim-string-bundle").getString("msim_clearAllConfirmation"))) {
    firemobilesimulator.core.clearAllDevice();
  }

  fms.options.initializeDevices();
};

// Initializes the general page
fms.options.initializeGps = function() {
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
  pageDocument.getElementById("msim-textbox-docomo-gps-areacode")
      .setAttribute(
          "value",
          fms.common.pref
              .copyUnicharPref("msim.config.DC.gps.areacode"));
  pageDocument.getElementById("msim-textbox-docomo-gps-areaname")
      .setAttribute(
          "value",
          fms.common.pref
              .copyUnicharPref("msim.config.DC.gps.areaname"));
  pageDocument.getElementById("msim-textbox-docomo-gps-lat").setAttribute(
      "value",
      fms.common.pref
          .copyUnicharPref("msim.config.DC.gps.lat"));
  pageDocument.getElementById("msim-textbox-docomo-gps-lon").setAttribute(
      "value",
      fms.common.pref
          .copyUnicharPref("msim.config.DC.gps.lon"));
  pageDocument.getElementById("msim-textbox-docomo-gps-alt").setAttribute(
      "value",
      fms.common.pref
          .copyUnicharPref("msim.config.DC.gps.alt"));
  pageDocument.getElementById("msim-textbox-au-gps-lat").setAttribute(
      "value",
      fms.common.pref
          .copyUnicharPref("msim.config.AU.gps.lat"));
  pageDocument.getElementById("msim-textbox-au-gps-lon").setAttribute(
      "value",
      fms.common.pref
          .copyUnicharPref("msim.config.AU.gps.lon"));
};

fms.options.initializePictogram = function() {
  dump("[msim]initializePictogram.\n");
  var pageDocument = document.getElementById("msim-options-iframe").contentDocument;
  pageDocument.getElementById("msim-textbox-docomo-pictogram-enabled").checked = fms.common.pref
      .getBoolPref("msim.config.DC.pictogram.enabled");
  pageDocument.getElementById("msim-textbox-au-pictogram-enabled").checked = fms.common.pref
      .getBoolPref("msim.config.AU.pictogram.enabled");
  pageDocument.getElementById("msim-textbox-softbank-pictogram-enabled").checked = fms.common.pref
      .getBoolPref("msim.config.SB.pictogram.enabled");
};

// XMLでのエクスポート
fms.options.exportDevices = function() {
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
    var rootElement = xmlDocument.appendChild(xmlDocument.createElement("FireMobileSimulator"));
    var xmlSerializer = new XMLSerializer();

    if (!file.exists()) {
      file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 00644);
    }

    var eDeviceList = rootElement.appendChild(xmlDocument.createElement("DeviceList"));
    rootElement.appendChild(eDeviceList);
    var deviceCount = fms.common.pref.getIntPref("msim.devicelist.count");
    for (var i = 1; i <= deviceCount; i++) {

      var eDevice = eDeviceList.appendChild(xmlDocument.createElement("Device"));

      firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(key) {
        if(key == "extra-header") {
          var extraHeaders = fms.common.pref.getListPref("msim.devicelist." + i
                  + ".extra-header", ["name", "value"]);
          var eExtraHeaders = xmlDocument.createElement("ExtraHeaders");
          extraHeaders.forEach(function(extraHeader) {
            var eExtraHeader = eExtraHeaders.appendChild(xmlDocument.createElement("Header"));
            var eHeaderName = eExtraHeader.appendChild(xmlDocument.createElement("Name"));
            var eHeaderValue = eExtraHeader.appendChild(xmlDocument.createElement("Value"));
            eHeaderName.appendChild(xmlDocument
                .createTextNode(extraHeader.name));
            eHeaderValue.appendChild(xmlDocument
                .createTextNode(extraHeader.value));
          });
          eDevice.appendChild(eExtraHeaders);
        }else{
          var tagName = firemobilesimulator.common.carrier.xmlTagName[key];
          dump("key:"+key+"\n");
          dump("tagName:"+tagName+"\n");
          if(tagName) {
            dump("createelement.\n");
            var value = fms.common.pref.copyUnicharPref("msim.devicelist." + i + "." + key);
            dump("msim.devicelist." + i + "." + key+"\n");
            var ele = eDevice.appendChild(xmlDocument.createElement(tagName));
            ele.appendChild(xmlDocument.createTextNode(value));
          }else{
            dump("[msim]Error:No TagName.\n");
          }
        }
      });
    }

    outputStream.init(file, 0x04 | 0x08 | 0x20, 00644, null);
    // 日本語を含むUTF-8対応
    var xmlContent = unescape(encodeURIComponent(XML(xmlSerializer
        .serializeToString(xmlDocument)).toXMLString()));
    outputStream.write(xmlContent, xmlContent.length);
    outputStream.close();
  }
  confirm(document.getElementById("msim-string-bundle").getFormattedString("msim_exportCompleted"));
  return;
};

fms.options.importDevices = function() {
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
