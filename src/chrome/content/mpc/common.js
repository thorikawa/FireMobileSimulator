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
if(!firemobilesimulator.mpc) firemobilesimulator.mpc = {};
if(!firemobilesimulator.mpc.common) firemobilesimulator.mpc.common = {};

firemobilesimulator.mpc.common.MPC_SJIS = "SJIS";
firemobilesimulator.mpc.common.MPC_UTF8 = "UTF-8";
firemobilesimulator.mpc.common.MPC_EUCJP = "EUC_JP";

firemobilesimulator.mpc.common.HexStrings = function(hexstrings, charset) {
	this.hexstrings = hexstrings || "";
	this.charset = charset || firemobilesimulator.mpc.common.MPC_SJIS;
	this.i = 0;
};

firemobilesimulator.mpc.common.HexStrings.prototype = {
	hexstring : "",
	charset : "",
	i : 0,
	hasNextCharacter : function() {
		return this.i < (this.hexstrings.length - 1);
	},

	getNextCharacterDecs : function() {
		var ds = parseInt(this.hexstrings[this.i], 16);
		if (ds >= 0x00 && ds <= 0x7F || this.charset == firemobilesimulator.mpc.common.MPC_SJIS && ds >= 0xA0
				&& ds <= 0xDF) {
			// 1バイト文字
			this.i += 1;
			return [ds];
		} else if (this.charset == firemobilesimulator.mpc.common.MPC_SJIS) {
			// 2バイト文字
			var ds2 = parseInt(this.hexstrings[this.i + 1], 16);
			this.i += 2;
			return [ds, ds2];
		} else if (this.charset == firemobilesimulator.mpc.common.MPC_UTF8) {
			// 3バイト(UTF-8)
			if (ds >= 0xE0 && ds <= 0xEF) {
				var ds2 = parseInt(this.hexstrings[this.i + 1], 16);
				var ds3 = parseInt(this.hexstrings[this.i + 2], 16);
				this.i += 3;
				return [ds, ds2, ds3];
			} else {
				this.i += 1;
				return [ds];
			}
		}else{
			this.i += 1;
			return [ds];
		}
	}
};

firemobilesimulator.mpc.common.unpack = function(str) {
	// dump("unpack start:"+str+"\n");
	var last = str.length;
	var ret = Array(last);
	for (var i = 0; i < last; i++) {
		ret[i] = str.charCodeAt(i).toString(16);
		// dump("[unpack]"+str.charCodeAt(i)+":"+ret[i]+"\n");
	}
	return ret;
};

firemobilesimulator.mpc.common.sdecs2udec = function(chs) {
	var hex = "";
	for (var i = 0; i < chs.length; i++) {
		var temp = "0" + chs[i].toString(16);
		hex += "%" + temp.slice(-2);
	}
	var unicode = firemobilesimulator.common.ecl.EscapeUnicode(firemobilesimulator.common.ecl.UnescapeSJIS(hex));
	if (/^%(?:u[0-9A-F]{4}|[0-9A-F]{2})$/.test(unicode)) {
		//dump("return" + parseInt(unicode.substring(2, 6), 16) + "\n");
		return parseInt(unicode.substring(2, 6), 16);
	} else {
		return undefined;
	}
};

firemobilesimulator.mpc.common.u8decs2udec = function(chs) {
	var hex = "";
	for (var i = 0; i < chs.length; i++) {
		var temp = "0" + chs[i].toString(16);
		hex += "%" + temp.slice(-2);
	}
	var unicode = firemobilesimulator.common.ecl.EscapeUnicode(firemobilesimulator.common.ecl.UnescapeUTF8(hex));
	if (/^%(?:u[0-9A-F]{4}|[0-9A-F]{2})$/.test(unicode)) {
		//dump("return" + parseInt(unicode.substring(2, 6), 16) + "\n");
		return parseInt(unicode.substring(2, 6), 16);
	} else {
		return undefined;
	}
};

firemobilesimulator.mpc.common.utf82unicode = function(bits) {
	var rbits = new Array(2);
	if (bits.length == 3) {
		var x = bits[0] & 0x0F;
		var y = bits[1] & 0x3F;
		var z = bits[2] & 0x3F;
		rbits[0] = (x << 4) + (y >> 2);
		rbits[1] = ((y & 0x3) << 6) + z;
	} else {
		dump("NOT IMPLEMENTED!\n");
	}
	return rbits;
};

firemobilesimulator.mpc.common.unicode2utf8 = function(bits) {
	var rbits = new Array(3);
	if (bits.length == 2) {
		rbits[0] = 0xE0 + (bits[0] >> 4);
		rbits[1] = 0x80 + ((bits[0] & 0x0F) << 2) + (bits[1] >> 6);
		rbits[2] = 0x80 + (0x3F & bits[1]);
	} else {
		dump("NOT IMPLEMENTED!\n");
	}
	return rbits;
};

firemobilesimulator.mpc.common.bits2dec = function(bits) {
	var r = 0;
	for (var i=0; i<bits.length; i++) {
		r += bits[i] << (8*(bits.length-i-1));
	}
	//dump(bits[0].toString(16)+",return to:"+r+"\n");
	//if (bits.length>1) {
		//dump(bits[1].toString(16)+",return to:"+r+"\n");
	//}
	return r;
};

dump("common.js is loaded.\n");
