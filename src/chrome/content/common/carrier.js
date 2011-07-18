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
  "cache",
  "docomo-uid",
  "docomo-icc",
  "docomo-ser",
  "docomo-guid",
  "au-uid",
  "softbank-uid",
  "softbank-serial",
  "use-cookie"
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
  "cache"            : "Cache",
  "use-cookie"       : "Cookie"
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

firemobilesimulator.common.carrier.idType = {
  DOCOMO_UID : "DOCOMO_UID",
  DOCOMO_SER : "DOCOMO_SER",
  DOCOMO_ICC : "DOCOMO_ICC",
  DOCOMO_GUID : "DOCOMO_GUID",
  AU_UID : "AU_UID",
  SB_UID : "SB_UID",
  SB_SERIAL : "SB_SERIAL"
};

firemobilesimulator.common.carrier.idPath = {
  DOCOMO_UID :  { "general" : "DC.uid",    "individual" : "docomo-uid"},
  DOCOMO_SER :  { "general" : "DC.ser",    "individual" : "docomo-ser"},
  DOCOMO_ICC :  { "general" : "DC.icc",    "individual" : "docomo-icc"},
  DOCOMO_GUID : { "general" : "DC.guid",   "individual" : "docomo-guid"},
  AU_UID :      { "general" : "AU.uid",    "individual" : "au-uid"},
  SB_UID :      { "general" : "SB.uid",    "individual" : "softbank-uid"},
  SB_SERIAL :   { "general" : "SB.serial", "individual" : "softbank-serial"}
};


firemobilesimulator.common.carrier.getSoftBankUserAgent = function (useragent, id) {
  var serial = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.SB_SERIAL,id);
  var notifySerial = firemobilesimulator.common.pref.getBoolPref("msim.config.SB.notifyserial");
  var replacement  = "";
  if (true == notifySerial) {
    replacement = "/" + serial;
  }
  useragent = useragent.replace("[/Serial]", replacement);
  dump("[msim]SB UA:" + useragent + "\n");
  return useragent;
};

//firemobilesimulator.common.carrier.getDocomoUserAgent = function (useragent, id) {
firemobilesimulator.common.carrier.getDoCoMoUserAgent = function(useragent, id) {
  var type1 = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist."+id+".type1");
  var cache = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist."+id+".cache") || 100;
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

/**
 * IDの情報を返す
 * 個々の端末に設定されているIDを参照して、設定されていなければ、全体で設定されているIDを返す
 */
firemobilesimulator.common.carrier.getId = function (type, deviceId) {
  var info = firemobilesimulator.common.carrier.idPath[type];
  if (!info) {
    throw "unknown idType:"+type;
  }
  var id = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist."+deviceId+"."+info.individual);
  if (!id) {
    id = firemobilesimulator.common.pref.copyUnicharPref("msim.config."+info.general);
  }
  return id;
}