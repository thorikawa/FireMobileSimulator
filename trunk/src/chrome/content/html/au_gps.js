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

firemobilesimulator.auLocationInit = function(params) {
	var href = location.href;
	var lat = encodeURIComponent(firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.lat"));
	var lon = encodeURIComponent(firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.lon"));

	if(href.indexOf("device:location") == 0){
		dump("location menu\n");
		var okUrl = unescape(params["url"]) + "?datum=tokyo&unit=dms&lat="+lat+"&lon="+lon;
		var ngUrl = "javascript:history.back();";
	}else if(href.indexOf("device:gpsone") == 0){
		dump("gpsone menu\n");
		var datum = params["datum"]; // 測地系
		var unit  = params["unit"]; // 緯度経度表記方法
		var alt   = firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.alt") || 50; //海抜高度
		var time  = firemobilesimulator.common.util.getYYYYMMDDHHmm();
		var smaj  = firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.smaj") || 100; //長軸成分誤差
		var smin  = firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.smin") || 100; //短軸成分誤差
		var vert  = firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.vert") || 100; //高度誤差
		var majaa = firemobilesimulator.common.pref.copyUnicharPref("msim.config.AU.gps.majaa") || 60; //長軸短軸傾き値
		var fm = 1; //測位結果の精度

		var point = new firemobilesimulator.common.util.Point(lat, lon);
		if(datum == 1){
			// 東京測地系
			point.toTokyo();
		}else if(datum == 0){
			// wgs測地系
			point.toWgs();
		}
		if(unit == 0){
			// dms
			point.toDms();
		}else if(unit == 1){
			// degree
			point.toDegree();
		}

		var okUrl = unescape(params["url"]) + "?ver=1&datum="+point.datum+"&unit="+point.unit+"&lat="+point.lat+"&lon="+point.lon+"&alt="+alt+"&time="+time+"&smaj="+smaj+"&smin="+smin+"&vert="+vert+"&majaa="+majaa+"&fm="+fm;
		var ngUrl = "javascript:history.back();";
	}
	var okButton = document.getElementById("okbutton");
	var ngButton = document.getElementById("ngbutton");
	okButton.onclick = function(){location.href=okUrl};
	ngButton.onclick = function(){location.href=ngUrl};
};
