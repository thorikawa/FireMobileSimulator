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
	firemobilesimulator.options.dialogs.device.retVals = window.arguments[3];

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
					menuItem.setAttribute(
									"label",
									firemobilesimulator.common.carrier.carrierName[carrierTemp]
											|| firemobilesimulator.options.dialogs.device.stringBundle
													.getString("msim_selectCarrier"));
					menuItem.setAttribute("id", carrierTemp);
					menuItem.setAttribute("oncommand",
									'firemobilesimulator.options.dialogs.device.carrierSelected(this)');
					carrierListPopup.appendChild(menuItem);
				});
		carrierList.appendChild(carrierListPopup);
		var r = document.getElementById("msim.options.device.carrier.row");
		r.appendChild(carrierList);
		//r.replaceChild(carrierList, r.lastChild);
		//r.replaceChild(carrierList, r);

		document.getElementById("msim.options.device.device").disabled = false;

	} else if (firemobilesimulator.options.dialogs.device.windowType == "edit") {
		dump("[msim]edit device.\n");
		document.title = firemobilesimulator.options.dialogs.device.stringBundle
				.getString("msim_editDeviceTitle");
		firemobilesimulator.options.dialogs.device.carrier = window.arguments[1];
		firemobilesimulator.options.dialogs.device.id = window.arguments[2];
		dump(firemobilesimulator.options.dialogs.device.carrier + "\n");
		dump(firemobilesimulator.options.dialogs.device.id + "\n");
		document.getElementById("msim.options.device.device").value = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.carrier
						+ "." + firemobilesimulator.options.dialogs.device.id
						+ ".device");
		//<textbox id="msim.options.device.carrier" size="50" disabled="true"/>
		var carrierTextBox = document.createElement("textbox");
		var r = document.getElementById("msim.options.device.carrier.row");
		r.appendChild(carrierTextBox);
		carrierTextBox.setAttribute("id","msim.options.device.carrier");
		carrierTextBox.size = 50;
		dump("###"+firemobilesimulator.common.carrier.carrierName[firemobilesimulator.options.dialogs.device.carrier]+"\n");
		carrierTextBox.value = firemobilesimulator.common.carrier.carrierName[firemobilesimulator.options.dialogs.device.carrier];
		carrierTextBox.disabled = true;

		document.getElementById("msim.options.device.useragent").value = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.carrier
						+ "." + firemobilesimulator.options.dialogs.device.id
						+ ".useragent");

		firemobilesimulator.options.dialogs.device.appendDeviceAttributeRows(
				document.getElementById("msim.options.device.rows"),
				firemobilesimulator.options.dialogs.device.carrier,
				firemobilesimulator.options.dialogs.device.id);

	}

}

firemobilesimulator.options.dialogs.device.carrierSelected = function(obj) {
	if (firemobilesimulator.options.dialogs.device.carrier) {
		firemobilesimulator.options.dialogs.device
				.removeDeviceAttributeRows(document
						.getElementById("msim.options.device.rows"));
	}
	firemobilesimulator.options.dialogs.device.carrier = obj.id;
	if (firemobilesimulator.options.dialogs.device.carrier) {
		// carrier =
		// document.getElementById("msim.options.device.carrierlist").selectedItem.getAttribute("id");
		firemobilesimulator.options.dialogs.device.appendDeviceAttributeRows(
				document.getElementById("msim.options.device.rows"),
				firemobilesimulator.options.dialogs.device.carrier, null);
	}
	window.sizeToContent();
}

firemobilesimulator.options.dialogs.device.appendDeviceAttributeRows = function(
		parentNode, carrier, id) {
	dump("[msim]append:" + parentNode + ":" + carrier + ":" + id + "\n");
	firemobilesimulator.common.carrier.deviceAttribute[carrier]
			.forEach(function(a) {
				var elementId = "msim.options.device." + a;
				var r = document.createElement("row");
				var l = document.createElement("label");
				var t = document.createElement("textbox");
				r.setAttribute("align", "center");
				l.setAttribute("control", elementId);
				l.setAttribute("value",
						firemobilesimulator.options.dialogs.device.stringBundle
								.getString(elementId));
				t.setAttribute("id", elementId);
				t.setAttribute("size", 50);
				if (id
						&& firemobilesimulator.common.pref
								.copyUnicharPref("msim.devicelist." + carrier
										+ "." + id + "." + a)) {
					t.setAttribute("value", firemobilesimulator.common.pref
									.copyUnicharPref("msim.devicelist."
											+ carrier + "." + id + "." + a));
				}
				r.appendChild(l);
				r.appendChild(t);
				parentNode.appendChild(r);
			});
}

firemobilesimulator.options.dialogs.device.removeDeviceAttributeRows = function(
		parentNode) {
	dump("remove:" + parentNode + "\n");
	while (parentNode.lastChild.getAttribute("id") != "msim.options.device.useragent.row") {
		dump("remove:" + parentNode.lastChild.getAttribute("id") + "\n");
		parentNode.removeChild(parentNode.lastChild);
	}
}

// Saves a device
firemobilesimulator.options.dialogs.device.saveDevice = function() {
	// If the window type is add or edit
	if (firemobilesimulator.options.dialogs.device.windowType == "add" || firemobilesimulator.options.dialogs.device.windowType == "edit") {
		var saveId;

		if (firemobilesimulator.options.dialogs.device.windowType == "add") {
			// carrier =
			// document.getElementById("msim.options.device.carrierlist").selectedItem.getAttribute("id");
			saveId = firemobilesimulator.common.pref
					.getIntPref("msim.devicelist."
							+ firemobilesimulator.options.dialogs.device.carrier
							+ ".count")
					+ 1;
			firemobilesimulator.common.pref
					.setIntPref(
							"msim.devicelist."
									+ firemobilesimulator.options.dialogs.device.carrier
									+ ".count", saveId);
			firemobilesimulator.common.pref
					.setUnicharPref(
							"msim.devicelist."
									+ firemobilesimulator.options.dialogs.device.carrier
									+ "." + saveId + ".carrier",
							firemobilesimulator.options.dialogs.device.carrier);
		} else {
			saveId = firemobilesimulator.options.dialogs.device.id;
		}

		dump("save-carrier:"
				+ firemobilesimulator.options.dialogs.device.carrier + "\n");
		dump("save-id:" + saveId + "\n");

		var deviceName = document.getElementById("msim.options.device.device").value;
		var userAgent = document
				.getElementById("msim.options.device.useragent").value;

		// 入力チェック
		if (!deviceName || !firemobilesimulator.options.dialogs.device.carrier
				|| !userAgent) {
			dump("[msim]Warning : Required field is null.\n");
			alert(firemobilesimulator.options.dialogs.device.stringBundle
					.getString("msim_editDeviceRequirementValidation"));
			return false;
		}
		firemobilesimulator.common.pref.setUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.carrier
						+ "." + saveId + ".device", deviceName);
		firemobilesimulator.common.pref.setUnicharPref("msim.devicelist."
						+ firemobilesimulator.options.dialogs.device.carrier
						+ "." + saveId + ".useragent", userAgent);

		firemobilesimulator.options.dialogs.device.retVals.deviceName = deviceName;
		firemobilesimulator.options.dialogs.device.retVals.id = saveId;
		firemobilesimulator.options.dialogs.device.retVals.carrier = firemobilesimulator.options.dialogs.device.carrier;
		firemobilesimulator.options.dialogs.device.retVals.userAgent = userAgent;

		firemobilesimulator.common.carrier.deviceAttribute[firemobilesimulator.options.dialogs.device.carrier]
				.forEach(function(a) {
					var elementId = "msim.options.device." + a;
					dump("getvalue:" + elementId + ":"
							+ document.getElementById(elementId).value + "\n");
					firemobilesimulator.common.pref
							.setUnicharPref(
									"msim.devicelist."
											+ firemobilesimulator.options.dialogs.device.carrier
											+ "." + saveId + "." + a, document
											.getElementById(elementId).value);
				});
	}
	return true;
}
