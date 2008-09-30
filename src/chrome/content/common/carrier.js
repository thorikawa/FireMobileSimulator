/*******************************************************************************
 * ***** BEGIN LICENSE BLOCK Version: GPL 3.0 FireMobileFimulator is a Firefox
 * add-on that simulate web browsers of japanese mobile phones. Copyright (C)
 * 2008 Takahiro Horikawa <horikawa.takahiro@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>. ***** END LICENSE
 * BLOCK *****
 */

// キャリア別の端末の設定
var firemobilesimulator;
if (!firemobilesimulator)
	firemobilesimulator = {};
if (!firemobilesimulator.common)
	firemobilesimulator.common = {};
if (!firemobilesimulator.common.carrier)
	firemobilesimulator.common.carrier = {};

/**
 * 各キャリアを示す定数
 * @type String
 */
firemobilesimulator.common.carrier.DOCOMO = "DC";
firemobilesimulator.common.carrier.AU = "AU";
firemobilesimulator.common.carrier.SOFTBANK = "SB";

/**
 * 各キャリアを示す定数配列 
 */
firemobilesimulator.common.carrier.carrierArray = [firemobilesimulator.common.carrier.DOCOMO, firemobilesimulator.common.carrier.AU, firemobilesimulator.common.carrier.SOFTBANK];

/**
 * 各キャリアの正式名称を示すマップ 
 */
firemobilesimulator.common.carrier.carrierName = {
	DC : "DoCoMo",
	AU : "au",
	SB : "SoftBank"
};

/**
 * キャリア共通の属性 
 */
firemobilesimulator.common.carrier.deviceBasicAttribute = ["device", "useragent", "carrier"];

/**
 * キャリア固有の属性
 */
firemobilesimulator.common.carrier.deviceAttribute = {
	DC : [],
	AU : ["x-up-devcap-multimedia", "x-up-devcap-cc", "x-up-devcap-iscolor",
			"x-up-devcap-max-pdu", "x-up-devcap-numsoftkeys",
			"x-up-devcap-qvga", "x-up-devcap-screenchars",
			"x-up-devcap-screendepth", "x-up-devcap-screenpixels",
			"x-up-devcap-softkeysize", "x-up-devcap-titlebar"],
	SB : ["x-jphone-msname", "x-jphone-display", "x-jphone-color"]
};

firemobilesimulator.common.carrier.getSoftBankUserAgent = function(useragent, serial) {
	var notifySerial = parent.firemobilesimulator.common.pref.getBoolPref("msim.config.SB.notifyserial");
	if (true == notifySerial) {
		useragent = useragent.replace("[/Serial]", "/" + serial);
	} else {
		useragent = useragent.replace("[/Serial]", "");
	}
	dump("SB UA:" + useragent + "\n");
	return useragent;
}

dump("carrier.js is loaded.\n");
