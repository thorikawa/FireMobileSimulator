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

window.addEventListener("load", function(e){
	firemobilesimulator.LoadDeviceList();
	var b = document.getElementById("button_add_device");
	b.addEventListener("click", function(e){
		var rs = document.getElementsByName("r");
		var postData = "level=5&id=";
		var idArray = new Array();
		for(var i=0; i<rs.length; i++){
			var ip = rs[i];
			var id = ip.value;
			if(ip.checked){
				idArray.push(id);
			}
		}
		postData += idArray.join("_");
		var deviceDB = firemobilesimulator.common.pref.copyUnicharPref("msim.config.devicedb.url");
		var devices = firemobilesimulator.core.parseDeviceListXML(deviceDB, postData);
		var result = firemobilesimulator.core.LoadDevices(devices, false);
		if(result){
			confirm("選択した端末がFireMobileSimulatorに追加されました");
		}
	}, false);
}, false);

firemobilesimulator.LoadDeviceList = function() {

	var deviceDB = firemobilesimulator.common.pref.copyUnicharPref("msim.config.devicedb.url");
	var filePath = deviceDB + "?level=0";
	var devices = firemobilesimulator.core.parseDeviceListXML(filePath, null);
	if(!devices){
		alert("端末リストを取得できませんでした。");
		return;
	}
	//DOM更新
	var t = document.getElementById("table_device");
	devices.forEach(function(device) {
		var row = document.createElement("tr");
		["label", "carrier", "type", "release-date"].forEach(function(key){
			var cell = document.createElement("td");
			cell.innerHTML = device[key] || "&nbsp;";
			row.appendChild(cell);
		});
		var cell = document.createElement("td");
		var check = document.createElement("input");
		check.setAttribute("type", "checkbox");
		check.setAttribute("name", "r");
		check.setAttribute("id", "checkbox"+device["device-center-id"]);
		check.setAttribute("value", device["device-center-id"]);
		var te = document.createTextNode("追加");
		cell.appendChild(check);
		cell.appendChild(te);
		row.appendChild(cell);
		t.appendChild(row);
	});
};
