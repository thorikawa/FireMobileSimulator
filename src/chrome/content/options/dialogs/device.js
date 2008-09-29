var msim_windowType = null;
var carrier = null;
var id = null;
var retVals;
var stringBundle;
// Clears the user agent

function msim_clearDevice() {
}

// Initializes the user agent dialog box
function msim_initializeDevice() {
	dump("[msim]initializeDevice()\n");
	stringBundle = document.getElementById("msim-string-bundle");

	msim_windowType = window.arguments[0];

	// If the window type is add
	if (msim_windowType == "add") {
		document.title = stringBundle.getString("msim_addDeviceTitle");
		var carrierList = document.createElement("menulist");
		var carrierListPopup = document.createElement("menupopup")
		carrierList.setAttribute("id", "msim.options.device.carrierlist");

		[""].concat(carrierArray).forEach(function (carrierTemp) {
			var menuItem = document.createElement("menuitem");
			menuItem.setAttribute("label", carrierName[carrierTemp]
							|| stringBundle.getString("msim_selectCarrier"));
			menuItem.setAttribute("id", carrierTemp);
			menuItem.setAttribute("oncommand", 'carrierSelected(this)');
			carrierListPopup.appendChild(menuItem);
		});
		carrierList.appendChild(carrierListPopup);
		var r = document.getElementById("msim.options.device.carrier.row");
		r.replaceChild(carrierList, r.lastChild);

		document.getElementById("msim.options.device.device").disabled = false;

	} else if (msim_windowType == "edit") {
		dump("edit\n");
		document.title = stringBundle.getString("msim_editDeviceTitle");
		carrier = window.arguments[1];
		id = window.arguments[2];
		dump(carrier + "\n");
		dump(id + "\n");
		document.getElementById("msim.options.device.device").value = pref
				.copyUnicharPref("msim.devicelist." + carrier + "." + id
						+ ".device");
		document.getElementById("msim.options.device.carrier").value = carrierName[carrier];
		document.getElementById("msim.options.device.useragent").value = pref
				.copyUnicharPref("msim.devicelist." + carrier + "." + id
						+ ".useragent");

		appendDeviceAttributeRows(document
						.getElementById("msim.options.device.rows"), carrier,
				id);

	}

	retVals = window.arguments[3];
}

function carrierSelected(obj) {
	if (carrier) {
		removeDeviceAttributeRows(document
				.getElementById("msim.options.device.rows"));
	}
	carrier = obj.id;
	if (carrier) {
		// carrier =
		// document.getElementById("msim.options.device.carrierlist").selectedItem.getAttribute("id");
		appendDeviceAttributeRows(document
						.getElementById("msim.options.device.rows"), carrier,
				null);
	}
	window.sizeToContent();
}

function appendDeviceAttributeRows(parentNode, carrier, id) {
	dump("append:" + parentNode + ":" + carrier + ":" + id + "\n");
	deviceAttribute[carrier].forEach(function (a) {
		var elementId = "msim.options.device." + a;
		var r = document.createElement("row");
		var l = document.createElement("label");
		var t = document.createElement("textbox");
		r.setAttribute("align", "center");
		l.setAttribute("control", elementId);
		l.setAttribute("value", stringBundle.getString(elementId));
		t.setAttribute("id", elementId);
		t.setAttribute("size", 50);
		if (id
				&& pref.copyUnicharPref("msim.devicelist." + carrier + "." + id
						+ "." + a)) {
			t.setAttribute("value", pref.copyUnicharPref("msim.devicelist."
							+ carrier + "." + id + "." + a));
		}
		r.appendChild(l);
		r.appendChild(t);
		parentNode.appendChild(r);
	});
}

function removeDeviceAttributeRows(parentNode) {
	dump("remove:" + parentNode + "\n");
	while (parentNode.lastChild.getAttribute("id") != "msim.options.device.useragent.row") {
		dump("remove:" + parentNode.lastChild.getAttribute("id") + "\n");
		parentNode.removeChild(parentNode.lastChild);
	}
}
// Retrieves the default user agent
function msim_retrieveDefault() {
}

// Saves a device
function msim_saveDevice() {
	// If the window type is add or edit
	if (msim_windowType == "add" || msim_windowType == "edit") {
		var saveId;

		if (msim_windowType == "add") {
			// carrier =
			// document.getElementById("msim.options.device.carrierlist").selectedItem.getAttribute("id");
			saveId = pref.getIntPref("msim.devicelist." + carrier + ".count")
					+ 1;
			pref.setIntPref("msim.devicelist." + carrier + ".count", saveId);
			pref.setUnicharPref("msim.devicelist." + carrier + "." + saveId
							+ ".carrier", carrier);
		} else {
			saveId = id;
		}

		dump("save-carrier:" + carrier + "\n");
		dump("save-id:" + saveId + "\n");

		var deviceName = document.getElementById("msim.options.device.device").value;
		var userAgent = document
				.getElementById("msim.options.device.useragent").value;

		// 入力チェック
		if (!deviceName || !carrier || !userAgent) {
			dump("[msim]Warning : Required field is null.\n");
			alert(stringBundle
					.getString("msim_editDeviceRequirementValidation"));
			return false;
		}
		pref.setUnicharPref("msim.devicelist." + carrier + "." + saveId
						+ ".device", deviceName);
		pref.setUnicharPref("msim.devicelist." + carrier + "." + saveId
						+ ".useragent", userAgent);

		retVals.deviceName = deviceName;
		retVals.id = saveId;
		retVals.carrier = carrier;
		retVals.userAgent = userAgent;

		deviceAttribute[carrier].forEach(function (a) {
			var elementId = "msim.options.device." + a;
			dump("getvalue:" + elementId + ":"
					+ document.getElementById(elementId).value + "\n");
			pref
					.setUnicharPref("msim.devicelist." + carrier + "." + saveId
									+ "." + a, document
									.getElementById(elementId).value);
		});
	}
	return true;
}
