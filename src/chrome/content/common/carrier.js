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
firemobilesimulator.common.carrier.OTHER = "OT";

/**
 * 各キャリアを示す定数配列
 */
firemobilesimulator.common.carrier.carrierArray = [firemobilesimulator.common.carrier.DOCOMO, firemobilesimulator.common.carrier.AU, firemobilesimulator.common.carrier.SOFTBANK, firemobilesimulator.common.carrier.OTHER];

/**
 * 各キャリアの正式名称を示すマップ
 */
firemobilesimulator.common.carrier.carrierName = {
	DC : "DoCoMo", // "docomo" や "NTT docomo" 等にすべき？
	AU : "au",
	SB : "SoftBank",
	OT : "Others"
};

/**
 * キャリア共通の属性
 */
firemobilesimulator.common.carrier.deviceBasicAttribute = [
	"label",
	"useragent",
	"carrier",
	"type1",
	"type2",
	"screen-height",
	"screen-width",
	"extra-header",
	"device-id",
	"cache"
];

firemobilesimulator.common.carrier.xmlTagName = {
	"label"            : "DeviceName",
	"useragent"        : "UserAgent",
	"carrier"          : "Carrier",
	"type1"            : "Type1",
	"type2"            : "Type2",
	"screen-height"    : "ScreenHeight",
	"screen-width"     : "ScreenWidth",
	"extra-header"     : "ExtraHeader",
	"device-id"        : "Id",
	"cache"            : "Cache"
};

firemobilesimulator.common.carrier.Type = {};

firemobilesimulator.common.carrier.Type[firemobilesimulator.common.carrier.DOCOMO] = {
	DOCOMO_FOMA     : "FOMA",
	DOCOMO_MOVA     : "mova"
};

firemobilesimulator.common.carrier.Type[firemobilesimulator.common.carrier.AU] = {
	AU_WAP1         : "WAP1.0",
	AU_WAP2         : "WAP2.0"
};

firemobilesimulator.common.carrier.Type[firemobilesimulator.common.carrier.SOFTBANK] = {
	SOFTBANK_C2     : "C2",
	SOFTBANK_C3     : "C3",
	SOFTBANK_C4     : "C4",
	SOFTBANK_P4_1   : "P4_1",
	SOFTBANK_P4_2   : "P4_2",
	SOFTBANK_P5     : "P5",
	SOFTBANK_P6     : "P6",
	SOFTBANK_P7     : "P7",
	SOFTBANK_W      : "W",
	SOFTBANK_3GC    : "3GC",
	SOFTBANK_IPHONE : "iPhone"
};

firemobilesimulator.common.carrier.getSoftBankUserAgent = function(useragent) {
	var serial = parent.firemobilesimulator.common.pref.copyUnicharPref("msim.config.SB.serial");
	var notifySerial = parent.firemobilesimulator.common.pref.getBoolPref("msim.config.SB.notifyserial");
	var replacement  = "";
	if (true == notifySerial) {
		replacement = "/" + serial;
	}
	useragent = useragent.replace("[/Serial]", replacement);
	dump("[msim]SB UA:" + useragent + "\n");
	return useragent;
};

//firemobilesimulator.common.carrier.getDocomoUserAgent = function(useragent, id) {
firemobilesimulator.common.carrier.getDoCoMoUserAgent = function(useragent, id) {
	var type1 = parent.firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist."+id+".type1");
	var cache = parent.firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist."+id+".cache");
	if (firemobilesimulator.common.carrier.Type[firemobilesimulator.common.carrier.DOCOMO].DOCOMO_FOMA == type1) {
		//TODO ;TB;WxxHxxの部分も動的に組み立てられるようにする
		useragent = useragent + "(c" + cache + ";TB;W24H12)";
	}else if (firemobilesimulator.common.carrier.Type[firemobilesimulator.common.carrier.DOCOMO].DOCOMO_MOVA == type1) {
		//TODO /TB/WxxHxxの部分も動的に組み立てられるようにする
		useragent = useragent + "/c" + cache + "/TB/W24H12";
	}
	dump("[msim]DC UA:" + useragent + "\n");
	return useragent;
};

dump("carrier.js is loaded.\n");
