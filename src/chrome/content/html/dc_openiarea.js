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

function openiareaInit(params){
	var nl = unescape(params["nl"]);
	var posinfo = params["posinfo"];
	var arg1 = params["arg1"];
	var arg2 = params["arg2"];
	dump("##"+arg1+":"+arg2+"\n");
	var arg1params = arg1 ? getParamsFromQuery(unescape(arg1)) : null;
	var arg2params = arg2 ? getParamsFromQuery(unescape(arg2)) : null;

	var openiareaBody = document.getElementById("openiarea_body");
	var areaname = pref.copyUnicharPref("msim.config.DC.gps.areaname");
	var areacode = pref.copyUnicharPref("msim.config.DC.gps.areacode");
	var lat = pref.copyUnicharPref("msim.config.DC.gps.lat");
	var lon = pref.copyUnicharPref("msim.config.DC.gps.lon");

	if(!posinfo){
		//エリアコードのみ
		var body = '\
<div>あなたの現在のエリアは'+areaname+'です。</div>\
<div>この情報を情報提供者に送信します。</div>\
<div>よろしいですか？</div>\
<form method="POST" action='+nl+'>\
<input type="hidden" name="AREACODE" value="'+areacode+'">';
body += getHiddenTag(arg1params);
body += getHiddenTag(arg2params);
body += '\
<div align="center"><input type="submit" name="ACTN" value="OK"></div>\
</form>\
';
		openiareaBody.innerHTML = body;
	}else{
		//経度緯度
		var body = '\
<div>端末で測定した下記の位置情報を情報提供者に送信します。よろしいですか？</div>\
<div></div>\
';
if(posinfo == 1){body += '<div>'+areaname+'ｴﾘｱ</div>';}
body += '<div>経度:'+lat+'</div>\
<div>緯度:'+lon+'</div>\
<div>XX付近</div>\
<form method="POST" action="'+nl+'">';
if(posinfo == 1){body += '<div align="center"><input type="hidden" name="AREACODE" value="'+areacode+'"></div>';}
body += '\
<input type="hidden" name="LAT" value="'+lat+'">\
<input type="hidden" name="LON" value="'+lon+'">\
<input type="hidden" name="GEO" value="wgs84">\
<input type="hidden" name="XACC" value="1">';
body += getHiddenTag(arg1params);
body += getHiddenTag(arg2params);
body += '\
<input type="hidden" name="POSINFO" value="'+posinfo+'">\
<div align="center"><input type="submit" name="ACTN" value="OK"></div>\
</form>\
';
		openiareaBody.innerHTML = body;
	}
}
