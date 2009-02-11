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
if (!firemobilesimulator.core)
	firemobilesimulator.core = {};

firemobilesimulator.core.resetDevice = function(e) {
    var tab = gBrowser.selectedTab; 
    tab.setAttribute("firemobilesimulator-device-id", null); 
    firemobilesimulator.overlay.rewrite();
};

firemobilesimulator.core.setDevice = function(id) {
	dump("[msim]setDevice:" + id + "\n");

	if (!id) {
		dump("[msim]Error : the attribute which you have selected is insufficient.\n");
		return;
	}

	var tab = gBrowser.selectedTab; 
	//tab.setAttribute("firemobilesimulator-device-id", id);
	var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
	ss.setTabValue(tab, "firemobilesimulator-device-id", id);

    firemobilesimulator.overlay.rewrite();
};

firemobilesimulator.core.deleteDevice = function(deletedId) {
	var prefPrefix = "msim.devicelist." + deletedId + ".";
	var deletedDeviceId = firemobilesimulator.common.pref.copyUnicharPref(prefPrefix+"device-id");
	firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
		firemobilesimulator.common.pref.deletePref(prefPrefix+attribute);
	});

	// 既に使われている端末だったら設定をリセット
	if (firemobilesimulator.common.pref.copyUnicharPref("msim.current.id") == deletedId) {
		firemobilesimulator.core.resetDevice();
	}

	// 各端末のidを再計算
	var count = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
	for (let i=deletedId+1; i<=count; i++) {
		let sPrefPrefix = "msim.devicelist." + i + ".";
		let ePrefPrefix = "msim.devicelist." + (i-1) + ".";
		firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
			if (attribute == "extra-header") {
				let extraHeaders = firemobilesimulator.common.pref.getListPref(sPrefPrefix + "extra-header", ["name", "value"]);
				extraHeaders.forEach(function(extraHeader) {
					if (extraHeader.value) {
						firemobilesimulator.common.pref.setUnicharPref(ePrefPrefix + "extra-header." + extraHeader.id + ".name", extraHeader.name);
						firemobilesimulator.common.pref.setUnicharPref(ePrefPrefix + "extra-header." + extraHeader.id + ".value", extraHeader.value);
						firemobilesimulator.common.pref.deletePref(sPrefPrefix + "extra-header." + extraHeader.id + ".name");
						firemobilesimulator.common.pref.deletePref(sPrefPrefix + "extra-header." + extraHeader.id + ".value");
					}
				});
				firemobilesimulator.common.pref.setIntPref(ePrefPrefix + "extra-header.count", extraHeaders.length);
				firemobilesimulator.common.pref.setIntPref(sPrefPrefix + "extra-header.count", 0);
			} else {
				firemobilesimulator.common.pref.setUnicharPref(ePrefPrefix+attribute, firemobilesimulator.common.pref.copyUnicharPref(sPrefPrefix+attribute));
				firemobilesimulator.common.pref.deletePref(sPrefPrefix+attribute+attribute);
			}
		});
	}
	firemobilesimulator.common.pref.setIntPref("msim.devicelist.count", count-1);
};

firemobilesimulator.core.updateIcon = function() {
	var windowEnumeration = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getEnumerator("navigator:browser");

	while (windowEnumeration.hasMoreElements()) {
		let windowObj = windowEnumeration.getNext();
		let msimButton = windowObj.document.getElementById("msim-button");
		let menu = windowObj.document.getElementById("msim-menu");
		let target = [msimButton, menu];
		target.forEach(function(item) {
			if (item) {
				let id = firemobilesimulator.common.pref.copyUnicharPref("msim.current.id");
				if (!id) {
					item.removeAttribute("device");
				} else {
					item.setAttribute("device", "on");
				}
			}
		});
	}
};

firemobilesimulator.core.parseDeviceListXML = function(filePath, postData) {
	var request = new XMLHttpRequest();
	var xmlDocument = null;

	if (postData) {
		dump("try post:"+postData+"\n");
		request.open("post", filePath, false);
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.send(postData);
	} else {
		dump("try get:"+filePath+"\n");
		request.open("get", filePath, false);
		request.send(null);
	}

	var xmlDocumentNode = request.responseXML;
	if (!xmlDocumentNode) return;
	var xmlDocumentElement = xmlDocumentNode.documentElement;
	if (xmlDocumentNode.nodeName == "parsererror") return;

	var deviceResults = null;
	var deviceElement = null;
	var xPathEvaluator = new XPathEvaluator();
	var resolver = xPathEvaluator.createNSResolver(xmlDocumentElement);
	deviceResults = xPathEvaluator.evaluate("//DeviceList/Device",
			xmlDocumentNode, resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE,
			null);
	if (deviceResults.length == 0) return;

	// XMLから端末情報を順次解析
	var devices = new Array();
	var i = 0;
	while ((deviceElement = deviceResults.iterateNext()) != null) {
		devices[i] = {};
		firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(key) {
			if (key == "extra-header") {
				let headerResults = xPathEvaluator.evaluate("ExtraHeaders/Header",
						deviceElement, resolver,
						XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
				let headerElement = null;

				// ExtraHeaderエレメントの取得
				let headers = new Array();
				let j = 0;
				while ((headerElement = headerResults.iterateNext()) != null) {
					let name = xPathEvaluator.evaluate("Name", headerElement, resolver,
							XPathResult.STRING_TYPE, null).stringValue;
					let value = xPathEvaluator.evaluate("Value", headerElement,
							resolver, XPathResult.STRING_TYPE, null).stringValue;
					headers[j] = {
						name : name,
						value : value
					};
					j++;
				}
				devices[i]["headers"] = headers;
			} else {
				let tagName = firemobilesimulator.common.carrier.xmlTagName[key];
				let value = xPathEvaluator.evaluate(tagName, deviceElement,
						resolver, XPathResult.STRING_TYPE, null).stringValue;
				if (tagName == "Carrier") {
					value = firemobilesimulator.core.isValidCarrier(value) ? value : firemobilesimulator.core.getCarrierCode(value);
				}
				devices[i][key] = value;
			}
		});
		i++;
	}
	return devices;
};

firemobilesimulator.core.LoadDevices = function(devices, overwrite) {
	var currentId = 0;
	if (!overwrite) {
		currentId = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
	}
	// update preference
	overwrite && firemobilesimulator.options.clearAllDeviceSettings();
	devices.forEach(function(device) {
		var id = ++currentId;
		var carrier = device.carrier;
		for (let key in device) {
			let value = device[key];
			if (key == "headers") {
				let i = 1;
				value.forEach(function(header) {
					firemobilesimulator.common.pref.setUnicharPref(
							"msim.devicelist." + id
									+ ".extra-header." + i + ".name",
							header.name);
					firemobilesimulator.common.pref.setUnicharPref(
							"msim.devicelist." + id
									+ ".extra-header." + i + ".value",
							header.value);
					i++;
				});
				firemobilesimulator.common.pref.setIntPref("msim.devicelist."
								+ id + ".extra-header.count",
						value.length);
			} else if (key == "id") {
			} else {
				firemobilesimulator.common.pref.setUnicharPref(
						"msim.devicelist." + id + "." + key,
						value);
			}
		}
	});

	// set device count
	firemobilesimulator.common.pref.setIntPref("msim.devicelist.count", currentId);
	return true;
};

firemobilesimulator.core.getCarrierCode = function(carrierName) {
	var carrierCode = firemobilesimulator.common.carrier[carrierName.toUpperCase()];
	return carrierCode || firemobilesimulator.common.carrier.OTHER;
};

firemobilesimulator.core.isValidCarrier = function(carrierCode) {
	return firemobilesimulator.common.carrier.carrierArray.some(function(c) { return carrierCode == c; });
};

firemobilesimulator.core.refreshRegisteredDevices = function() {
	var deviceCount = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
	firemobilesimulator.core.deviceIdArray = new Array();
	for (let i = 1; i <= deviceCount; i++) {
		let deviceId = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + i + ".device-id");
		if(deviceId) {
			firemobilesimulator.core.deviceIdArray.push(deviceId);
		}
	}
};

firemobilesimulator.core.getRegisteredDevices = function() {
	if(!firemobilesimulator.core.deviceIdArray) {
		firemobilesimulator.core.refreshRegisteredDevices();
	}
	return firemobilesimulator.core.deviceIdArray;
};

firemobilesimulator.core.isRegistered = function(deviceId, refreshFlag) {
	return firemobilesimulator.core.getRegisteredDevices().some(function(_deviceId) {
		return _deviceId == deviceId;
	});
};

firemobilesimulator.core.clearAllDevice = function() {
	var count = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
	for (let i = 1; i <= count; i++) {
		let prefPrefix = "msim.devicelist." + i + ".";

		firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
			if (attribute == "extra-header") {
				firemobilesimulator.common.pref.deleteListPref("msim.devicelist." + i + ".extra-header", ["name", "value"]);
			} else {
				firemobilesimulator.common.pref.deletePref(prefPrefix + attribute);
			}
		});
	}
	firemobilesimulator.common.pref.deletePref("msim.devicelist.count");
	firemobilesimulator.common.pref.deletePref("general.useragent.override");
	firemobilesimulator.core.resetDevice();
};
