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
if (!firemobilesimulator.options.dialogs.limitHost)
	firemobilesimulator.options.dialogs.limitHost = {};

firemobilesimulator.options.dialogs.limitHost.id = null;

// Initializes the user agent dialog box
firemobilesimulator.options.dialogs.limitHost.initializeLimitHost = function() {
	dump("[msim]initializeLimitHost()\n");
	firemobilesimulator.options.dialogs.limitHost.stringBundle = document
			.getElementById("msim-string-bundle");
	firemobilesimulator.options.dialogs.limitHost.windowType = window.arguments[0];
	firemobilesimulator.options.dialogs.limitHost.retVals = window.arguments[2];
	
	// If the window type is add
	if (firemobilesimulator.options.dialogs.limitHost.windowType == "add") {
		document.title = firemobilesimulator.options.dialogs.limitHost.stringBundle
				.getString("msim_addLimitHostTitle");
		document.getElementById("msim.options.limitHost.label").disabled = false;

	} else if (firemobilesimulator.options.dialogs.limitHost.windowType == "edit") {
		dump("[msim]edit limitHost.\n");
		document.title = firemobilesimulator.options.dialogs.limitHost.stringBundle
				.getString("msim_editLimitHostTitle");
		firemobilesimulator.options.dialogs.limitHost.id = window.arguments[1];

		document.getElementById("msim.options.limitHost.label").value = firemobilesimulator.common.pref
				.copyUnicharPref("msim.limitHost."
						+ firemobilesimulator.options.dialogs.limitHost.id
						+ ".value");
	}

  //ホスト制限の入力ダイアログに表示する端末リストを初期化する
  function initDeviceMenuList(){
    var selectedDeviceId = -1; 
	  if (firemobilesimulator.options.dialogs.limitHost.windowType == "edit") {
      selectedDeviceId = firemobilesimulator.common.pref.copyUnicharPref("msim.limitHost."+ firemobilesimulator.options.dialogs.limitHost.id + ".device-id");
      if(! selectedDeviceId){
        selectedDeviceId = -1;
      }
    }

    var deviceMenuList = document.getElementById("msim.options.limitHost.deviceMenuList");
    var deviceCount = firemobilesimulator.common.pref.getIntPref("msim.devicelist.count");
    //deviceMenuListにはデフォルトで"なし"という項目が入っているため、iは1からでOK
    for (var i = 1; i <= deviceCount; i++) {
      var device = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + i + ".label");
      if (!device) continue;
      var carrier = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + i + ".carrier")
      var deviceId = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist." + i + ".device-id")
      deviceMenuList.appendItem(carrier + " " + device, deviceId, "");

      if(deviceId == selectedDeviceId){
        deviceMenuList.selectedIndex = i;
      }
    }
  }
  initDeviceMenuList();
};


// Saves a limitHost
firemobilesimulator.options.dialogs.limitHost.saveLimitHost = function() {
	// If the window type is add or edit
	if (firemobilesimulator.options.dialogs.limitHost.windowType == "add"
			|| firemobilesimulator.options.dialogs.limitHost.windowType == "edit") {
		var saveId;
		var hostName = document.getElementById("msim.options.limitHost.label").value;

		// 入力チェック
		if (!hostName) {
			dump("[msim]Warning : Required field is null.\n");
			alert(firemobilesimulator.options.dialogs.limitHost.stringBundle
					.getString("msim_editLimitHostRequirementValidation"));
			return false;
		}

		if (firemobilesimulator.options.dialogs.limitHost.windowType == "add") {
			saveId = firemobilesimulator.common.pref.getIntPref("msim.limitHost.count") + 1;
			firemobilesimulator.common.pref.setIntPref("msim.limitHost.count", saveId);
			firemobilesimulator.common.pref.setUnicharPref("msim.limitHost." + saveId + ".value", hostName);
		} else {
			saveId = firemobilesimulator.options.dialogs.limitHost.id;
			firemobilesimulator.common.pref.setUnicharPref("msim.limitHost." + saveId + ".value", hostName);
		}

		firemobilesimulator.options.dialogs.limitHost.retVals.host = hostName;
		firemobilesimulator.options.dialogs.limitHost.retVals.id = saveId;

    //ホスト制限に指定された端末を保存する
    function saveDeviceId(){
      var deviceMenuList = document.getElementById("msim.options.limitHost.deviceMenuList");
      var deviceId = -1;
      if(deviceMenuList.selectedItem && deviceMenuList.value != -1){
        deviceId = deviceMenuList.value;
      }
      firemobilesimulator.common.pref.setUnicharPref("msim.limitHost." + saveId + ".device-id", deviceId);
		  firemobilesimulator.options.dialogs.limitHost.retVals.deviceId = deviceId;
    }
    saveDeviceId();
	}
	return true;
};
