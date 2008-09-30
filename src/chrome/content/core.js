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
	firemobilesimulator.common.pref.deletePref("msim.current.device");
	firemobilesimulator.common.pref.deletePref("general.useragent.override");
	firemobilesimulator.common.pref.deletePref("msim.current.useragent");
	firemobilesimulator.common.pref.deletePref("msim.current.id");
	firemobilesimulator.overlay.updateIcon();
};

firemobilesimulator.core.setDevice = function(carrier, id) {

	dump("[msim]setDevice:" + carrier + ",id:" + id + "\n");

	if (!carrier || !id) {
		dump("[msim]Error : the attribute which you have selected is insufficient.\n");
		return;
	}

	var pref_prefix = "msim.devicelist." + carrier + "." + id;
	firemobilesimulator.common.pref.setUnicharPref("msim.current.carrier",
			firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".carrier"));
	firemobilesimulator.common.pref.setUnicharPref("msim.current.device",
			firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".device"));

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
	firemobilesimulator.overlay.updateIcon();
};
