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

var MPC_SB = function(){};
MPC_SB.prototype =
{
	/**
	 * SoftBank絵文字画像格納パス
	 *
	 * @var string
	 */
	s_img_path : "img/s/",

	/**
	 * 文字列からSoftBank絵文字を検出し、指定されたフォーマットに変換
	 *
	 * @return string
	 */
	convert : function(str)
	{
		var re1 = /\x1B\x24(\x47[\x21-\x7A]+|\x45[\x21-\x7A]+|\x46[\x21-\x7A]+|\x4F[\x21-\x6D]+|\x50[\x21-\x6C]+|\x51[\x21-\x5E]+)\x0F?/g;

		//Webコード: エスケープシーケンス開始(\x1B\x24) + コード + エスケープ終わり(\x0F)をimgタグ形式に変換
		var _this = this;
		var f = function(whole, s1){
			var hexstrings = unpack(s1);
			var emoji = "";
			for (var i=1; i<hexstrings.length; i++) {
				var dec = parseInt(""+hexstrings[0]+hexstrings[i], 16);
				emoji += _this.s_options_encode(dec);
			}
			return emoji;
		};
		str = str.replace(re1, f);

		//Firefoxから数値参照が直接渡ってこないので、とりあえずコメントアウト
		var re2 = /&#x([a-f0-9]{4});/ig;
		var re3 = /&#([0-9]{5});/g;
		var _this = this;
		//Unicodeの16進数値文字参照をimgタグ形式に変換
		dump("SoftBank Unicode 16\n");
		str = str.replace(re2, function(whole, s1){
			var sdec = _this.u2web(parseInt(s1,16));
			if (sdec) {
				dump("is SoftBank Pictogram:"+s1+"\n");
				return _this.s_options_encode(sdec);
			} else {
				return whole;
			}
		});
		//Unicodeの10進数値文字参照をimgタグ形式に変換
		dump("SoftBank Unicode 10\n");
		str = str.replace(re3, function(whole, s1){
			var sdec = _this.u2web(s1);
			if (sdec) {
				dump("is SoftBank Pictogram:"+s1+"\n");
				return _this.s_options_encode(sdec);
			}
		});

		// バイナリをimgタグ形式に変換
		dump("[mpc]SoftBank binary match start\n");
		var hexstrings = new HexStrings(unpack(str), this.charset);
		var r = "";
		while (hexstrings.hasNextCharacter()) {
			var decs = hexstrings.getNextCharacterDecs();
			if (this.charset == MPC_SJIS) {
				// SJISバイナリの絵文字を変換 [unofficial]
				var web = 0;
				if (decs.length==2) {
					web = this.s2web(bits2dec(decs));
				}
				if (web) {
					r += this.s_options_encode(web);
				} else {
					for (var i = 0; i < decs.length; i++) {
						r += String.fromCharCode(decs[i]);
					}
				}
			} else if (this.charset == MPC_UTF8) {
				// UTF-8バイナリの絵文字を変換 [unofficial]
				var web = 0;
				if (decs.length==3) {
					web = this.u2web(bits2dec(utf82unicode(decs)));
				}
				if (web) {
					r += this.s_options_encode(web);
				} else {
					for (var i = 0; i < decs.length; i++) {
						r += String.fromCharCode(decs[i]);
					}
				}
			} else {
				dump("[mpc]SoftBank Unknown charset [" + this.charset + "].\n");
				return str;
			}
		}
		return r;
	},

	/**
	 * Unicode値(10進)を指示子の最後の文字+SJISコードの10進数値に変換する
	 */
	u2web : function(u)
	{
		var s = 0;
		if (u<=0xE000) {
			return s;
		}
		if (u >= 0xE001 && u <= 0xE05A) {
			s = u-0x98E0;
		} else if (u >= 0xE101 && u <= 0xE15A || u >= 0xE201 && u <= 0xE25A) {
			s = u-0x9BE0;
		} else if (u >= 0xE301 && u <= 0xE35A || u >= 0xE401 && u <= 0xE45A || u >= 0xE501 && u <= 0xE55A) {
			s = u-0x93E0;
		} else {
			dump("[mpc]Warning:Unknown SoftBank Pictogram. Unicode:"+u+"\n");
			//s = u;
			s = 0;
		}
		return s;
	},

	/**
	 * Unicode値(10進)を指示子の最後の文字+SJISコードの10進数値に変換する
	 */
	s2web : function(s)
	{
		var web = 0;
		if (s<=0xF000) {
			return web;
		}
		if (s >= 0xF941 && s <= 0xF97E || s >= 0xF741 && s <= 0xF77E) {
			web = s-0xB220;
		} else if (s >= 0xF980 && s <= 0xF99B || s >= 0xF780 && s <= 0xF79B) {
			web = s-0xB221;
		} else if (s >= 0xF7A1 && s <= 0xF7FA) { // Encode::Mobile::JPのucmではs<=0xF7F3までしか定義なし
			web = s-0xB180;
		} else if (s >= 0xF9A1 && s <= 0xF9FA || s >= 0xFBA1 && s <= 0xFBEA) {
			web = s-0xAA80;
		} else if (s >= 0xFB41 && s <= 0xFB7E) {
			web = s-0xAB20;
		} else if (s >= 0xFB80 && s <= 0xFB8D) {
			web = s-0xAB21;
		} else {
			dump("[mpc]Warning:Unknown SoftBank Pictogram. SJIS code:"+s.toString(16)+"\n");
			web = 0;
		}
		return web;
	},

	/**
	 * 絵文字画像格納ディレクトリの一括設定
	 *
	 * @param string path
	 */
	setImagePath : function(path)
	{
		path.replace(/\/+$/, '');
		this.s_img_path = path+'/s/';
	},

	/**
	 * SoftBank絵文字（10進数）をimgタグ形式へ変換
	 *
	 * @param  integer dec
	 * @return string
	 */
	s_options_encode : function(dec)
	{
		var width = (dec >= 20828 && dec <= 20830) ? 18 : 15;
		var buf = '<img src="'+this.s_img_path.replace(/\/+$/, "")+'/'+dec+'.gif" alt="" border="0" width="'+width+'" height="15" />';
		return buf;
	}
};

function unpack(str){
	var last = str.length;
	var ret = Array(last);
	for (var i = 0; i < last; i++) {
		ret[i] = str.charCodeAt(i).toString(16);
	}
	return ret;
}
