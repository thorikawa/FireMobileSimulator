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
	dump("[msim]resetDevice.\n");
	firemobilesimulator.common.pref.deletePref("msim.current.carrier");
	firemobilesimulator.common.pref.deletePref("general.useragent.override");
	firemobilesimulator.common.pref.deletePref("msim.current.useragent");
	firemobilesimulator.common.pref.deletePref("msim.current.id");
	firemobilesimulator.overlay && firemobilesimulator.overlay.updateIcon(window);
	parent.firemobilesimulator.overlay && parent.firemobilesimulator.overlay.updateIcon(parent);
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

	firemobilesimulator.common.pref.setUnicharPref("general.useragent.override",
			useragent);
	firemobilesimulator.common.pref
			.setUnicharPref("msim.current.useragent", useragent);
	firemobilesimulator.common.pref.setUnicharPref("msim.current.id", id);
	firemobilesimulator.overlay && firemobilesimulator.overlay.updateIcon(window);
	parent.firemobilesimulator.overlay && parent.firemobilesimulator.overlay.updateIcon(parent);
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
