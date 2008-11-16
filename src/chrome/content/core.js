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
	firemobilesimulator.common.pref.deletePref("msim.current.carrier");
	firemobilesimulator.common.pref.deletePref("general.useragent.override");
	firemobilesimulator.common.pref.deletePref("msim.current.useragent");
	firemobilesimulator.common.pref.deletePref("msim.current.id");
	firemobilesimulator.core.updateIcon();
};

firemobilesimulator.core.setDevice = function(id) {

	//dump("[msim]setDevice:" + carrier + ",id:" + id + "\n");

	if (!id) {
		dump("[msim]Error : the attribute which you have selected is insufficient.\n");
		return;
	}

	var pref_prefix = "msim.devicelist." + id;
	var carrier = firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".carrier");
	
	firemobilesimulator.common.pref.setUnicharPref("msim.current.carrier", carrier);
	var useragent = firemobilesimulator.common.pref.copyUnicharPref(pref_prefix
			+ ".useragent");
	if (firemobilesimulator.common.carrier.SOFTBANK == carrier) {
		useragent = firemobilesimulator.common.carrier.getSoftBankUserAgent(useragent,
				firemobilesimulator.common.pref
						.copyUnicharPref("msim.config.SB.serial"));
	}

	firemobilesimulator.common.pref.setUnicharPref("general.useragent.override", useragent);
	firemobilesimulator.common.pref.setUnicharPref("msim.current.useragent", useragent);
	firemobilesimulator.common.pref.setUnicharPref("msim.current.id", id);
	firemobilesimulator.core.updateIcon();
};

firemobilesimulator.core.deleteDevice = function(deletedId) {
	var prefPrefix = "msim.devicelist." + deletedId + ".";
	firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
		firemobilesimulator.common.pref.deletePref(prefPrefix+attribute);
	});

	//既に使われている端末だったら設定をリセット
	if (firemobilesimulator.common.pref.copyUnicharPref("msim.current.id") == deletedId) {
		firemobilesimulator.core.resetDevice();
	}

	//各端末のidを再計算
	var count = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
	//dump(deletedId+":"+count+"\n");
	//dump((deletedId+1)+":"+count+"\n");
	for (var i=deletedId+1; i<=count; i++) {
		//dump("[msim]Debug : Id is not the last one. Re-arrange ids.\n");
		var sPrefPrefix = "msim.devicelist." + i + ".";
		var ePrefPrefix = "msim.devicelist." + (i-1) + ".";
		firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
			firemobilesimulator.common.pref.setUnicharPref(ePrefPrefix+attribute, firemobilesimulator.common.pref.copyUnicharPref(sPrefPrefix+attribute));
		});
	}
	firemobilesimulator.common.pref.setIntPref("msim.devicelist.count", count-1);
};

firemobilesimulator.core.updateIcon = function() {
	var windowEnumeration = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getEnumerator("navigator:browser");

	while (windowEnumeration.hasMoreElements()) {
		var windowObj = windowEnumeration.getNext();
		var msimButton = windowObj.document.getElementById("msim-button");
		var menu = windowObj.document.getElementById("msim-menu");
		var target = [msimButton, menu];
		target.forEach(function(item) {
			if (item) {
				var id = firemobilesimulator.common.pref.copyUnicharPref("msim.current.id");
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

	if(postData){
		dump("try post:"+postData+"\n");
		request.open("post", filePath, false);
		request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		request.send(postData);
	}else{
		dump("try get:"+filePath+"\n");
		request.open("get", filePath, false);
		request.send(null);
	}

	var xmlDocumentNode = request.responseXML;
	if(!xmlDocumentNode) return;
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

	//XMLから端末情報を順次解析
	var devices = new Array();
	var i = 0;
	while ((deviceElement = deviceResults.iterateNext()) != null) {
		devices[i] = {};
		firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(key){
			if(key == "extra-header"){
				var headerResults = xPathEvaluator.evaluate("ExtraHeaders/Header",
						deviceElement, resolver,
						XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
				var headerElement = null;

				//ExtraHeaderエレメントの取得
				var headers = new Array();
				var j = 0;
				while ((headerElement = headerResults.iterateNext()) != null) {
					var name = xPathEvaluator.evaluate("Name", headerElement, resolver,
							XPathResult.STRING_TYPE, null).stringValue;
					var value = xPathEvaluator.evaluate("Value", headerElement,
							resolver, XPathResult.STRING_TYPE, null).stringValue;
					headers[j] = {
						name : name,
						value : value
					};
					j++;
				}
				devices[i]["headers"] = headers;
			}else{
				var tagName = firemobilesimulator.common.carrier.xmlTagName[key];
				var value = xPathEvaluator.evaluate(tagName, deviceElement,
						resolver, XPathResult.STRING_TYPE, null).stringValue;
				devices[i][key] = value;
			}
		});
		i++;
	}
	return devices;
};

firemobilesimulator.core.LoadDevices = function(devices, overwrite) {
	var currentId = 0;
	if (overwrite) {
		currentId = 0;
	} else {
		var deviceCount = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
		currentId = deviceCount;
		dump("setCurrentId:"+currentId+"\n");
	}
	// update preference
	overwrite && firemobilesimulator.options.clearAllDeviceSettings();
	devices.forEach(function(device) {
		currentId++;
		var id = currentId;
		var carrier = device.carrier;
		for (var key in device) {
			var value = device[key];
			if (key == "headers") {
				var i = 1;
				dump("length:" + value.length + "\n");
				dump("value:" + value + "\n");
				value.forEach(function(header) {
					firemobilesimulator.common.pref.setUnicharPref(
							"msim.devicelist." + id
									+ ".extra-header." + i + ".name",
							header.name);
					firemobilesimulator.common.pref.setUnicharPref(
							"msim.devicelist." + id
									+ ".extra-header." + i + ".value",
							header.value);
					dump("set:msim.devicelist." + id
							+ ".extra-header." + i + ".name:" + header.name
							+ "\n");
					dump("set:msim.devicelist." + id
							+ ".extra-header." + i + ".value:" + header.value
							+ "\n");
					i++;
				});
				dump("set:" + "msim.devicelist." + id
						+ ".extra-header.count:" + value.length + "\n");
				firemobilesimulator.common.pref.setIntPref("msim.devicelist."
								+ id + ".extra-header.count",
						value.length);
			} else if (key == "id") {
			} else {
				firemobilesimulator.common.pref.setUnicharPref(
						"msim.devicelist." + id + "." + key,
						value);
				dump("set:msim.devicelist." + id + "." + key
						+ ":" + value + "\n");
			}
		}
	});

	//set device count
	firemobilesimulator.common.pref.setIntPref("msim.devicelist.count", currentId);
	return true;
};
