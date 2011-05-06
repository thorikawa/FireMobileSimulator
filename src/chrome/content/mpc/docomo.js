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
   * @var string
   */
  i_img_path : "img/i/",

  charset : null,

  /**
   * Unicodeのバイナリとして絵文字に合致するものを全て変換する
   */
  convertBinary : function(str) {
    // Unicodeバイナリで絵文字に亜あっちする部分をimgタグに変換する
    var a = new Array();
    var r = "";
    var n = str.length;
    for (var i=0; i<n; i++) {
      var dec = str.charCodeAt(i);
      var decs = [parseInt(dec/256), dec%256];
      if (this.isPictogramUnicodeDecs(decs)) {
        dump("[mpc]DoCoMo ispictogram:" + decs[0] + ":" + decs[1] + "\n");
        a.push({type:0, value:r});
        r = "";
        a.push({type:1, value:this.i_options_encode(dec)});
      } else {
        r += String.fromCharCode(dec);
      }
    }
    a.push({type:0, value:r});
    return a;
  },

  /**
   * 文字列からi-mode絵文字を検出し、指定されたフォーマットに変換 基本・拡張・隠し絵文字一部対応
   * DOM Tree展開後に絵文字解析可能なように前処理を行う
   * @return string
   */
  preConvert : function(str) {
    dump("[mpc]DoCoMo convert start.charset = "+this.charset+"\n");
    var _this = this;
    // SJIS文字コードの10進数値参照は、Firefox上ではUnicode文字コードで解釈されてしまうため、あらかじめUnicodeの文字コードに変換しておく
    if (this.charset == firemobilesimulator.mpc.common.MPC_SJIS) {
      dump("[mpc]DoCoMo SJIS10match start\n");
      var regNumericReferenceDec = /&#([0-9]{5});/g;
      str = str.replace(regNumericReferenceDec, function(whole, s1) {
        var sdec = parseInt(s1, 10);
        if (sdec >= 256) {
          var dec1 = parseInt(sdec / 256);
          var dec2 = sdec % 256;
          if (_this.isPictogramSJISDecs([dec1, dec2])) {
            var udec = firemobilesimulator.mpc.common.sdecs2udec([dec1,dec2]);
            return "&#" + udec + ";";
          }
        }
        return whole;
      });
    }
    return str;
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
   * @param integer
   *            dec
   * @return string
   */
  i_options_encode : function(dec) {
    var buf = this.i_img_path.replace(/\/+$/, "") + '/' + dec + '.gif';
    return buf;
  }
};
