/* ***** BEGIN LICENSE BLOCK Version: GPL 3.0 ***** 
 * FireMobileFimulator is a Firefox add-on that simulate web browsers of 
 * japanese mobile phones.
 * Copyright (C) 2008  ryster <ryster@php-develop.org>
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
if (!firemobilesimulator.mpc) firemobilesimulator.mpc = {};

firemobilesimulator.mpc.docomo = function(charset) {
	this.charset = charset || firemobilesimulator.mpc.common.MPC_SJIS;
};
firemobilesimulator.mpc.docomo.prototype = {
	/**
	 * i-mode絵文字画像格納パス
	 * 
	 * @var string
	 */
	i_img_path : "img/i/",

	charset : null,

	/**
	 * 文字列からi-mode絵文字を検出し、指定されたフォーマットに変換 基本・拡張・隠し絵文字一部対応
	 * 
	 * @return string
	 */
	convert : function(str) {
		//dump("[mpc]docomo convert start.charset = "+this.charset+"\n");

		// 10進数値文字参照をバイナリに変換(絵文字以外も対象としてよし)
		// SJISの場合、そのままSJISのバイナリになるが問題なし
		// UTF-8の場合、そのままUTF-8のバイナリになるが問題なし
		// TODO: Auからも参照されるがAuの場合、Unicodeの10進数値参照をShift_JISのページで使用することもありえる。

		// Unicodeの16進をSJIS文字コードに変換して、さらにバイナリマッチとやるのは面倒なので、
		// いきなりimgタグに変換する
		//dump("[mpc]DoCoMo Unicode16match start\n");
		//dump("[mpc]docomo Unicode16match start\n");
		var re1 = /&#x([a-f0-9]{2})([a-f0-9]{2});/ig;
		var _this = this;
		str = str.replace(re1, function(whole, s1, s2) {
					//dump("regmatch16:" + s1 + ":" + s2 + "\n");
					var dec1 = parseInt(s1, 16);
					var dec2 = parseInt(s2, 16);
					if (_this.isPictogramUnicodeDecs([dec1, dec2])) {
						//dump("[mpc]DoCoMo ispictogram:" + dec1 + ":" + dec2 + "\n");
						//dump("[mpc]docomo ispictogram:" + dec1 + ":" + dec2 + "\n");
						return _this.i_options_encode(dec1 * 256 + dec2);
					} else {
						//dump("[mpc]DoCoMo nopictogram:" + dec1 + ":" + dec2 + "\n");
						//dump("[mpc]docomo nopictogram:" + dec1 + ":" + dec2 + "\n");
						return whole;
					}
				});

		//TODO: Auから呼び出される場合は違う判定にすべきかどうか？
		//TODO: 基本絵文字のみに限定する
		if (this.charset == firemobilesimulator.mpc.common.MPC_SJIS) {
			//dump("[mpc]DoCoMo SJIS10match start\n");
			//dump("[mpc]docomo SJIS10match start\n");
			var regNumericReferenceDec = /&#([0-9]{5});/g;
			str = str.replace(regNumericReferenceDec, function(whole, s1) {
				//dump("regmatch10:" + s1 + "\n");
				var bin;
				var sdec = parseInt(s1, 10);
				if (sdec >= 256) {
					var dec1 = parseInt(sdec / 256);
					var dec2 = sdec % 256;
					//dump("[mpc]DoCoMo tobin:" + dec1 + ":" + dec2 + "\n");
					//dump("[mpc]docomo tobin:" + dec1 + ":" + dec2 + "\n");
					bin = String.fromCharCode(dec1) + String.fromCharCode(dec2);
				}
				return bin;
			});
		}

		// バイナリをimgタグ形式に変換
		//dump("[mpc]docomo binary match start\n");
		var hexstrings = new firemobilesimulator.mpc.common.HexStrings(firemobilesimulator.mpc.common.unpack(str), this.charset);
		var r = "";
		while (hexstrings.hasNextCharacter()) {
			var decs = hexstrings.getNextCharacterDecs();
			if (this.charset == firemobilesimulator.mpc.common.MPC_SJIS) {
				// SJISバイナリの絵文字を変換
				if (this.isPictogramSJISDecs(decs)) {
					r += this.i_options_encode(firemobilesimulator.mpc.common.sdecs2udec(decs));
				} else {
					for (var i = 0; i < decs.length; i++) {
						r += String.fromCharCode(decs[i]);
					}
				}
			} else if (this.charset == firemobilesimulator.mpc.common.MPC_UTF8) {
				// UTF-8バイナリの絵文字を変換
				if (this.isPictogramUTF8Decs(decs)) {
					r += this.i_options_encode(firemobilesimulator.mpc.common.u8decs2udec(decs));
				} else {
					for (var i = 0; i < decs.length; i++) {
						r += String.fromCharCode(decs[i]);
					}
				}
			} else {
				dump("[mpc]docomo Unknown charset [" + this.charset + "].\n");
				return str;
			}
		}
		return r;
	},

	/**
	 * 与えられたUnicode16進数文字列がi-mode絵文字かどうか、チェック
	 */
	isPictogram : function(ch) {
		ch = parseInt(ch, 16);
		return this.isPictogramDec(ch);
	},

	/**
	 * 与えられたSJIS10進数がi-mode絵文字かどうか、チェック
	 */
	isPictogramSJISDecs : function(chs) {
		var result;
		if (chs.length != 2) {
			return false;
		}
		//dump("isPictogram"+chs.join(":")+"");
		[char1, char2] = chs;
		if (((char1 == 0xF8) && (char2 >= 0x9F) && (char2 <= 0xFC))
				|| ((char1 == 0xF9) && ((char2 >= 0x40 && char2 <= 0x4F)
						|| (char2 >= 0x50 && char2 <= 0x7E) || (char2 >= 0x80 && char2 <= 0xFC)))) {
			result = true;
		} else {
			result = false;
		}
		//dump("=>"+result+"\n");
		return result;
	},

	/**
	 * 与えられたUnicode文字コード配列がi-mode絵文字かどうか、チェック
	 */
	isPictogramUnicodeDecs : function(chs) {
		var result;
		if (chs.length != 2) {
			return false;
		}
		//dump("isPictogram"+chs.join(":")+"");
		[char1, char2] = chs;
		if ((char1 == 0xE6) && (char2 >= 0x3E) || (char1 == 0xE7)
				&& (char2 <= 0x57)) {
			result = true;
		} else {
			result = false;
		}
		//dump("=>"+result+"\n");
		return result;
	},

	/**
	 * 与えられたUTF-8文字コード配列がi-mode絵文字かどうか、チェック
	 */
	isPictogramUTF8Decs : function(chs) {
		var result;
		if (chs.length != 3) {
			return false;
		}
		[char1, char2, char3] = chs;
		if (char1 == 0xEE
				&& ((char2 == 0x98 && (char3 >= 0xBE && char3 <= 0xBF))
						|| (char2 == 0x99 && (char3 >= 0x80 && char3 <= 0xBF))
						|| (char2 == 0x9A && (char3 >= 0x80 && char3 <= 0xBA))
						|| (char2 == 0x9B && (char3 >= 0x8E && char3 <= 0xBF))
						|| (char2 == 0x9C && (char3 >= 0x80 && char3 <= 0xBF)) || (char2 == 0x9D && (char3 >= 0x80 && char3 <= 0x97)))) {
			result = true;
		} else {
			result = false;
		}
		return result;
	},

	/**
	 * 絵文字画像格納ディレクトリの一括設定
	 * 
	 * @param string
	 *            path
	 */
	setImagePath : function(path) {
		path.replace(/\/+$/, '');
		this.i_img_path = path + '/i/';
	},

	/**
	 * i-mode絵文字（10進数）をimgタグ形式へ変換
	 * 
	 * @param integer
	 *            dec
	 * @return string
	 */
	i_options_encode : function(dec) {
		var buf = '<img src="' + this.i_img_path.replace(/\/+$/, "") + '/'
				+ dec + '.gif" alt="" border="0" width="12" height="12" />';
		return buf;
	}
};
