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

// キャリア別の端末の設定

const DOCOMO = "DC";
const AU = "AU";
const SOFTBANK = "SB";

var carrierArray = [DOCOMO, AU, SOFTBANK];

var carrierName = {
	DC : "DoCoMo",
	AU : "Au",
	SB : "SoftBank"
};

var deviceBasicAttribute = ["device", "useragent", "carrier"];

var deviceAttribute = {
	DC : [],
	AU : ["x-up-devcap-multimedia", "x-up-devcap-cc", "x-up-devcap-iscolor",
			"x-up-devcap-max-pdu", "x-up-devcap-numsoftkeys",
			"x-up-devcap-qvga", "x-up-devcap-screenchars",
			"x-up-devcap-screendepth", "x-up-devcap-screenpixels",
			"x-up-devcap-softkeysize", "x-up-devcap-titlebar"],
	SB : ["x-jphone-msname", "x-jphone-display", "x-jphone-color"]
};

function setDevice(carrier, id) {

	dump("setDevice:"+carrier+",id:"+id+"\n");
	var msimButton = document.getElementById("msim-button");

	if (!carrier || !id) {
		dump("[msim]Error : the attribute which you have selected is insufficient.\n");
		return;
	}

	var pref_prefix = "msim.devicelist." + carrier + "." + id;
	pref.setUnicharPref("msim.current.carrier", pref
					.copyUnicharPref(pref_prefix + ".carrier"));
	pref.setUnicharPref("msim.current.device", pref.copyUnicharPref(pref_prefix
					+ ".device"));

	var useragent = pref.copyUnicharPref(pref_prefix + ".useragent");
	if (SOFTBANK == carrier) {
		useragent = getSoftBankUserAgent(useragent, pref
						.copyUnicharPref("msim.config.SB.serial"));
	}

	pref.setUnicharPref("general.useragent.override", useragent);
	pref.setUnicharPref("msim.current.useragent", useragent);
	pref.setUnicharPref("msim.current.id", id);

	msim.updateIcon();
};

function getSoftBankUserAgent(useragent, serial) {
	var notifySerial = pref.getBoolPref("msim.config.SB.notifyserial");
	if (true == notifySerial) {
		useragent = useragent.replace("[/Serial]", "/" + serial);
	} else {
		useragent = useragent.replace("[/Serial]", "");
	}
	dump("SB UA:" + useragent + "\n");
	return useragent;
}

dump("carrier.js is loaded.\n");
