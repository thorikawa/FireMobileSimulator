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
if (!fms.core) fms.core = {};

fms.core.resetDevice = function (e) {
  var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
  if (tabselect_enabled) {
    var browser = gBrowser || parent.gBrowser;
    var tab = browser.selectedTab;
    var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
    ss.setTabValue(tab, "firemobilesimulator-device-id", null);
    firemobilesimulator.overlay.rewrite();
  } else {
    fms.common.pref.deletePref("msim.current.carrier");
    fms.common.pref.deletePref("msim.current.id");
    fms.core.updateIcon();
  }
};

fms.core.setDevice = function (id) {

  //dump("[msim]setDevice:" + carrier + ",id:" + id + "\n");

  if (!id) {
    dump("[msim]Error : the attribute which you have selected is insufficient.\n");
    return;
  }
  
  var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
  if (tabselect_enabled) {
    var tab = gBrowser.selectedTab;
    var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
    ss.setTabValue(tab, "firemobilesimulator-device-id", id);
    
    firemobilesimulator.overlay.rewrite();
  } else {
    var pref_prefix = "msim.devicelist." + id;
    var carrier = fms.common.pref.copyUnicharPref(pref_prefix + ".carrier");

    fms.common.pref.setUnicharPref("msim.current.carrier", carrier);
    fms.common.pref.setUnicharPref("msim.current.id", id);
    fms.core.updateIcon();
  }
};

/**
 * 指定されたIDの端末を削除する
 */
fms.core.deleteDevice = function (deletedId) {
  var prefPrefix = "msim.devicelist." + deletedId + ".";
  var deletedDeviceId = fms.common.pref.copyUnicharPref(prefPrefix+"device-id");
  firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
    fms.common.pref.deletePref(prefPrefix+attribute);
  });

  //ホストの端末指定も削除する
  firemobilesimulator.core.deleteLimitHostDeviceByDeviceId(deletedDeviceId);

  //各端末のidを再計算
  var count = fms.common.pref.getIntPref("msim.devicelist.count");
  for (let i=deletedId+1; i<=count; i++) {
    let sPrefPrefix = "msim.devicelist." + i + ".";
    let ePrefPrefix = "msim.devicelist." + (i-1) + ".";
    firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
      if (attribute == "extra-header") {
        let extraHeaders = fms.common.pref.getListPref(sPrefPrefix + "extra-header", ["name", "value"]);
        extraHeaders.forEach(function (extraHeader) {
          if (extraHeader.value) {
            fms.common.pref.setUnicharPref(ePrefPrefix + "extra-header." + extraHeader.id + ".name", extraHeader.name);
            fms.common.pref.setUnicharPref(ePrefPrefix + "extra-header." + extraHeader.id + ".value", extraHeader.value);
            fms.common.pref.deletePref(sPrefPrefix + "extra-header." + extraHeader.id + ".name");
            fms.common.pref.deletePref(sPrefPrefix + "extra-header." + extraHeader.id + ".value");
          }
        });
        fms.common.pref.setIntPref(ePrefPrefix + "extra-header.count", extraHeaders.length);
        fms.common.pref.setIntPref(sPrefPrefix + "extra-header.count", 0);
      } else if (attribute == "use-cookie") {
        fms.common.pref.setBoolPref(ePrefPrefix+attribute, fms.common.pref.getBoolPref(sPrefPrefix+attribute));
        fms.common.pref.deletePref(sPrefPrefix+attribute);
      } else {
        fms.common.pref.setUnicharPref(ePrefPrefix+attribute, fms.common.pref.copyUnicharPref(sPrefPrefix+attribute));
        fms.common.pref.deletePref(sPrefPrefix+attribute);
      }
    });
  }
  fms.common.pref.setIntPref("msim.devicelist.count", count-1);

  // 現在選択されている端末IDの付け替え、または既に使われている端末だったら設定をリセット  
  var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
  if (tabselect_enabled) {
    var windowEnumeration = Components.classes["@mozilla.org/appshell/window-mediator;1"]
      .getService(Components.interfaces.nsIWindowMediator)
      .getEnumerator("navigator:browser");
    while (windowEnumeration.hasMoreElements()) {
      var win = windowEnumeration.getNext();
      var tabCount = win.getBrowser().browsers.length;
      dump("[msim]tabCount:"+tabCount+"\n");
      for (var i=0; i<tabCount; i++) {
        //var tab = win.getBrowser().getBrowserAtIndex(i);
        var tab = win.getBrowser().tabContainer.childNodes[i];
        var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
        var id = ss.getTabValue(tab, "firemobilesimulator-device-id");
        dump("[msim]getId:"+id+"\n");
        if (id > deletedId) {
          ss.setTabValue(tab, "firemobilesimulator-device-id", id-1);
        } else if (id == deletedId) {
          ss.setTabValue(tab, "firemobilesimulator-device-id", null);
        }
      }
    }
    parent.firemobilesimulator.overlay.rewrite();
  } else {
    var id = fms.common.pref.copyUnicharPref("msim.current.id");
    if (id > deletedId) {
      fms.common.pref.setIntPref("msim.current.id", id-1);
    } else if (id == deletedId) {
      fms.core.resetDevice();
    }
  }
};

fms.core.deleteLimitHost = function (deletedId) {

  var prefKey = "msim.limitHost." + deletedId + ".value";
  fms.common.pref.deletePref(prefKey);

  //ホスト制限に指定している端末IDも削除する
  var prefKey = "msim.limitHost." + deletedId + ".device-id";
  fms.common.pref.deletePref(prefKey);

  //idを再計算
  var count = fms.common.pref.getIntPref("msim.limitHost.count");
  for (let i=deletedId+1; i<=count; i++) {
    let sPrefKey = "msim.limitHost." + i + ".value";
    let ePrefKey = "msim.limitHost." + (i-1) + ".value";

    fms.common.pref.setUnicharPref(ePrefKey, fms.common.pref.copyUnicharPref(sPrefKey));
    fms.common.pref.deletePref(sPrefKey);

    //ホスト制限に指定している端末IDも移動させる
    sPrefKey = "msim.limitHost." + i + ".device-id";
    ePrefKey = "msim.limitHost." + (i-1) + ".device-id";

    fms.common.pref.setUnicharPref(ePrefKey, fms.common.pref.copyUnicharPref(sPrefKey));
    fms.common.pref.deletePref(sPrefKey);
  }
  fms.common.pref.setIntPref("msim.limitHost.count", count-1);
};

fms.core.updateIcon = function () {
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
        let id = fms.common.pref.copyUnicharPref("msim.current.id");
        if (!id) {
          item.removeAttribute("device");
        } else {
          item.setAttribute("device", "on");
        }
      }
    });
  }
};

fms.core.parseDeviceListXML = function (filePath, postData) {
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

  //XMLから端末情報を順次解析
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

        //ExtraHeaderエレメントの取得
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
          value = fms.core.isValidCarrier(value) ? value : fms.core.getCarrierCode(value);
        }
        devices[i][key] = value;
      }
    });
    i++;
  }
  return devices;
};

fms.core.LoadDevices = function (devices, overwrite) {
  var currentId = 0;
  if (!overwrite) {
    currentId = fms.common.pref.getIntPref("msim.devicelist.count");
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
          fms.common.pref.setUnicharPref(
              "msim.devicelist." + id
                  + ".extra-header." + i + ".name",
              header.name);
          fms.common.pref.setUnicharPref(
              "msim.devicelist." + id
                  + ".extra-header." + i + ".value",
              header.value);
          i++;
        });
        fms.common.pref.setIntPref("msim.devicelist."
                + id + ".extra-header.count",
            value.length);
      } else if (key == "id") {
      } else if (key == "use-cookie") {
        fms.common.pref.setBoolPref("msim.devicelist." + id + "." + key, value);
      } else {
        fms.common.pref.setUnicharPref("msim.devicelist." + id + "." + key, value);
      }
    }
  });

  //set device count
  fms.common.pref.setIntPref("msim.devicelist.count", currentId);
  return true;
};

fms.core.getCarrierCode = function (carrierName) {
  var carrierCode = firemobilesimulator.common.carrier[carrierName.toUpperCase()];
  return carrierCode || firemobilesimulator.common.carrier.OTHER;
};

fms.core.isValidCarrier = function(carrierCode) {
  return firemobilesimulator.common.carrier.carrierArray.some(function(c) { return carrierCode == c; });
};

fms.core.refreshRegisteredDevices = function () {
  var deviceCount = fms.common.pref.getIntPref("msim.devicelist.count");
  fms.core.deviceIdArray = new Array();
  for (let i = 1; i <= deviceCount; i++) {
    let deviceId = fms.common.pref.copyUnicharPref("msim.devicelist." + i + ".device-id");
    if(deviceId) {
      fms.core.deviceIdArray.push(deviceId);
    }
  }
};

fms.core.getRegisteredDevices = function () {
  if(!fms.core.deviceIdArray) {
    fms.core.refreshRegisteredDevices();
  }
  return fms.core.deviceIdArray;
};

fms.core.isRegistered = function(deviceId, refreshFlag) {
  return fms.core.getRegisteredDevices().some(function(_deviceId) {
    return _deviceId == deviceId;
  });
};

fms.core.clearAllDevice = function () {
  var count = fms.common.pref.getIntPref("msim.devicelist.count");
  for (let i = 1; i <= count; i++) {
    let prefPrefix = "msim.devicelist." + i + ".";

    firemobilesimulator.common.carrier.deviceBasicAttribute.forEach(function(attribute) {
      if (attribute == "extra-header") {
        fms.common.pref.deleteListPref("msim.devicelist." + i + ".extra-header", ["name", "value"]);
      } else {
        fms.common.pref.deletePref(prefPrefix + attribute);
      }
    });
  }
  fms.common.pref.deletePref("msim.devicelist.count");
  fms.common.pref.deletePref("msim.current.carrier");
  fms.common.pref.deletePref("msim.current.id");
  fms.core.resetDevice();
};

fms.core.isSimulate = function (hostName) {
  var isSimulate = true;
  var limithost_enabled = fms.common.pref.getBoolPref("msim.limitHost.enabled");
  if (limithost_enabled) {
    var id = fms.common.pref.copyUnicharPref("msim.current.id");
    var limitHosts = fms.common.pref.getListPref("msim.limitHost",new Array("value"));
    isSimulate = limitHosts.some(function (limitHost, index, array) {
      // dump("[msim]compare:"+limitHost.value+":"+hostName+"\n");
      return (limitHost.value && hostName.match(limitHost.value));
    });
  }
  return isSimulate;
}

//msim.devicelist.X.device-idが一致するデバイスを返す
fms.core.getDeviceByDeviceId = function(deviceId){
  var deviceCount = fms.common.pref.getIntPref("msim.devicelist.count");
  var deviceIndex = -1;

  for(var i = 1; i <= deviceCount; i++){
    var _deviceId = fms.common.pref.copyUnicharPref("msim.devicelist." + i + ".device-id");
    if(_deviceId == deviceId){
      deviceIndex = i;
      break;
    }
  }

  if(deviceIndex == -1){
    return null;
  }

  var ret = {};
  ret.id = deviceId;
  ret.index = deviceIndex;
  ret.label = fms.common.pref.copyUnicharPref("msim.devicelist." + deviceIndex + ".label");
  ret.carrier = fms.common.pref.copyUnicharPref("msim.devicelist." + deviceIndex + ".carrier");
  return ret;
}

//msim.limithost.X.valueがhostNameに一致するものをを探して、
//そのホスト制限に指定されている端末情報を返す
fms.core.getDeviceByLimitHost = function(hostName){
  var limithost_enabled = fms.common.pref.getBoolPref("msim.limitHost.enabled");
  if(! limithost_enabled){
    return null;
  }

  var count = fms.common.pref.getIntPref("msim.limitHost.count");
  for(var i = 1; i <= count; i++){
   var host = fms.common.pref.copyUnicharPref("msim.limitHost." + i + ".value");
   if(hostName.match(host)){
     var deviceId = fms.common.pref.copyUnicharPref("msim.limitHost." + i + ".device-id");
     return fms.core.getDeviceByDeviceId(deviceId);
   }
  }

  return null;
}

//ホスト制限に指定されている端末でdeviceIdと一致する物を削除する
fms.core.deleteLimitHostDeviceByDeviceId = function(deviceId){
  var count = fms.common.pref.getIntPref("msim.limitHost.count");
  for(var i = 1; i <= count; i++){
    var _deviceId = fms.common.pref.copyUnicharPref("msim.limitHost." + i + ".device-id");
    if(_deviceId == deviceId){
      fms.common.pref.setUnicharPref("msim.limitHost." + i + ".device-id", "-1");
    }
  }
}
