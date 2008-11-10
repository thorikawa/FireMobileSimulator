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
if (!firemobilesimulator.options.dialogs)
	firemobilesimulator.options.dialogs = {};
if (!firemobilesimulator.options.dialogs.device)
	firemobilesimulator.options.dialogs.device = {};

firemobilesimulator.options.dialogs.device.carrier = null;
firemobilesimulator.options.dialogs.device.id = null;

// Initializes the user agent dialog box
firemobilesimulator.options.dialogs.device.initializeDevice = function() {
	dump("[msim]initializeDevice()\n");
	firemobilesimulator.options.dialogs.device.stringBundle = document
			.getElementById("msim-string-bundle");
	firemobilesimulator.options.dialogs.device.windowType = window.arguments[0];
	firemobilesimulator.options.dialogs.device.retVals = window.arguments[2];

	// If the window type is add
	if (firemobilesimulator.options.dialogs.device.windowType == "add") {
		document.title = firemobilesimulator.options.dialogs.device.stringBundle
				.getString("msim_addDeviceTitle");
		var carrierList = document.createElement("menulist");
		var carrierListPopup = document.createElement("menupopup")
		carrierList.setAttribute("id", "msim.options.device.carrierlist");

		[""].concat(firemobilesimulator.common.carrier.carrierArray)
				.forEach(function(carrierTemp) {
					var menuItem = document.createElement("menuitem");
					menuItem
							.setAttribute(
									"label",
									firemobilesimulator.common.carrier.carrierName[carrierTemp]
											|| firemobilesimulator.options.dialogs.device.stringBundle
													.getString("msim_selectCarrier"));
					menuItem.setAttribute("id", carrierTemp);
					menuItem
							.setAttribute("oncommand",
									'firemobilesimulator.options.dialogs.device.carrierSelected(this)');
					carrierListPopup.appendChild(menuItem);
				});
		carrierList.appendChild(carrierListPopup);
		var r = document.getElementById("msim.options.device.carrier.row");
		r.appendChild(carrierList);
		// r.replaceChild(carrierList, r.lastChild);
		// r.replaceChild(carrierList, r);

		document.getElementById("msim.options.device.label").disabled = false;

	} else if (firemobilesimulator.options.dialogs.device.windowType == "edit") {
		dump("[msim]edit device.\n");
		document.title = firemobilesimulator.options.dialogs.device.stringBundle
				.getString("msim_editDeviceTitle");
		firemobilesimulator.options.dialogs.device.id = window.arguments[1];
		firemobilesimulator.options.dialogs.device.carrier = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + firemobilesimulator.options.dialogs.device.id + ".carrier");
		dump(firemobilesimulator.options.dialogs.device.carrier + "\n");
		dump(firemobilesimulator.options.dialogs.device.id + "\n");
		document.getElementById("msim.options.device.label").value = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.id
						+ ".label");
		// <textbox id="msim.options.device.carrier" size="50" disabled="true"/>
		var carrierTextBox = document.createElement("textbox");
		var r = document.getElementById("msim.options.device.carrier.row");
		r.appendChild(carrierTextBox);
		carrierTextBox.setAttribute("id", "msim.options.device.carrier");
		carrierTextBox.size = 50;
		carrierTextBox.value = firemobilesimulator.common.carrier.carrierName[firemobilesimulator.options.dialogs.device.carrier];
		carrierTextBox.disabled = true;

		document.getElementById("msim.options.device.useragent").value = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.id
						+ ".useragent");
		document.getElementById("msim.options.device.screen-width").value = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.id
						+ ".screen-width");
		document.getElementById("msim.options.device.screen-height").value = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.id
						+ ".screen-height");

		firemobilesimulator.options.dialogs.device
				.appendExtraHeaderRows(
						document.getElementById("msim.options.device.extra-headers.rows"),
						firemobilesimulator.options.dialogs.device.id);

	}

};

firemobilesimulator.options.dialogs.device.carrierSelected = function(obj) {
	
	//firemobilesimulator.options.dialogs.device.carrier = obj.id;
	//window.sizeToContent();
	
};

// Saves a device
firemobilesimulator.options.dialogs.device.saveDevice = function() {
	// If the window type is add or edit
	if (firemobilesimulator.options.dialogs.device.windowType == "add"
			|| firemobilesimulator.options.dialogs.device.windowType == "edit") {
		var saveId;
		var carrier = firemobilesimulator.options.dialogs.device.carrier;

		if (firemobilesimulator.options.dialogs.device.windowType == "add") {
			// carrier =
			// document.getElementById("msim.options.device.carrierlist").selectedItem.getAttribute("id");
			saveId = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count") + 1;
			firemobilesimulator.common.pref.setIntPref("msim.devicelist.count", saveId);
			firemobilesimulator.common.pref.setUnicharPref("msim.devicelist." + saveId + ".carrier", carrier);
		} else {
			saveId = firemobilesimulator.options.dialogs.device.id;
		}

		dump("save-carrier:" + carrier + "\n");
		dump("save-id:" + saveId + "\n");

		var deviceName = document.getElementById("msim.options.device.label").value;
		var userAgent = document
				.getElementById("msim.options.device.useragent").value;
		var screenWidth = document
				.getElementById("msim.options.device.screen-width").value;
		var screenHeight = document
				.getElementById("msim.options.device.screen-height").value;

		// 入力チェック
		if (!deviceName || !carrier || !userAgent) {
			dump("[msim]Warning : Required field is null.\n");
			alert(firemobilesimulator.options.dialogs.device.stringBundle
					.getString("msim_editDeviceRequirementValidation"));
			return false;
		}
		firemobilesimulator.common.pref.setUnicharPref("msim.devicelist." + saveId + ".label", deviceName);
		firemobilesimulator.common.pref.setUnicharPref("msim.devicelist." + saveId + ".useragent", userAgent);
		firemobilesimulator.common.pref.setUnicharPref("msim.devicelist." + saveId + ".screen-width", screenWidth);
		firemobilesimulator.common.pref.setUnicharPref("msim.devicelist." + saveId + ".screen-height", screenHeight);

		firemobilesimulator.options.dialogs.device.retVals.deviceName = deviceName;
		firemobilesimulator.options.dialogs.device.retVals.id = saveId;
		firemobilesimulator.options.dialogs.device.retVals.carrier = carrier;
		firemobilesimulator.options.dialogs.device.retVals.userAgent = userAgent;

		// save extra headers
		var extraHeaders = document
				.getElementById("msim.options.device.extra-headers.rows").childNodes;
		var headerId = 0;
		for (var i = 0; i < extraHeaders.length; i++) {
			var extraHeader = extraHeaders[i];
			var extraHeaderAttributes = extraHeader.childNodes;
			var name = extraHeaderAttributes[0].value;
			var value = extraHeaderAttributes[1].value;
			dump("save:" + name + ":" + value + "\n");

			if (name && value) {
				headerId++;
				firemobilesimulator.common.pref.setUnicharPref("msim.devicelist." + saveId + ".extra-header." + headerId + ".name", name);
				firemobilesimulator.common.pref.setUnicharPref("msim.devicelist." + saveId + ".extra-header." + headerId + ".value", value);
				dump("set:msim.devicelist." + saveId + ".extra-header." + headerId + ".name:" + name + "\n");
				dump("set:msim.devicelist." + saveId + ".extra-header." + headerId + ".value:" + value + "\n");
			}
		}
		dump("set:" + "msim.devicelist." + saveId
				+ ".extra-header.count:" + headerId + "\n");
		firemobilesimulator.common.pref.setIntPref("msim.devicelist." + saveId + ".extra-header.count", headerId);

	}
	return true;
};

firemobilesimulator.options.dialogs.device.appendExtraHeaderRows = function(targetNode, id) {
	var extraHeaders = firemobilesimulator.common.pref.getListPref(
			"msim.devicelist." + id + ".extra-header", ["name",
					"value"]);
	extraHeaders.forEach(function(extraHeader) {
		if (id && extraHeader.value) {
			firemobilesimulator.options.dialogs.device.addExtraHeaderRow(targetNode, extraHeader);
		}
	});
};

firemobilesimulator.options.dialogs.device.addExtraHeaderRow = function(targetNode, headerObj) {
	var r = document.createElement("row");
	var l = document.createElement("textbox");
	var t = document.createElement("textbox");
	var b = document.createElement("button");
	var h = document.createElement("hbox");
	r.setAttribute("align", "center");
	l.setAttribute("size", 50);
	if(headerObj && headerObj.name) l.setAttribute("value", headerObj.name);
	t.setAttribute("size", 50);
	if(headerObj && headerObj.value) t.setAttribute("value", headerObj.value);
	// TODO propertieファイルから取得するように修正
	b.setAttribute("label", "削除");
	b.setAttribute("oncommand",	"this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);");
	h.appendChild(t);
	h.appendChild(b);
	r.appendChild(l);
	r.appendChild(h);
	targetNode.appendChild(r);
};
