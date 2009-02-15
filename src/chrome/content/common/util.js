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
if (!firemobilesimulator) firemobilesimulator = {};
if (!firemobilesimulator.common) firemobilesimulator.common = {};
if (!firemobilesimulator.common.util) firemobilesimulator.common.util = {};

// Opens the URL in a new tab
firemobilesimulator.common.util.openURL = function(url) {
	var parentWindow = null;

	// If there is a parent window
	if (window.opener) {
		// If there is a grand parent window
		parentWindow = window.opener.opener
				? window.opener.opener
				: window.opener;
	}

	// If a parent window was found
	if (parentWindow) {
		parentWindow.getBrowser().selectedTab = parentWindow.getBrowser()
				.addTab(url);
		window.close();
	}
};

/**
 * 
 * @param {} path パス
 * @param {} func パラメータの値をデコードする関数(デフォルトではdecodeURIが使用される)
 * @return {}
 */
firemobilesimulator.common.util.getParamsFromPath = function(path, func) {
	var params = {};
	var qindex = path.indexOf("?");
	if (qindex >= 0) {
		params = firemobilesimulator.common.util.getParamsFromQuery(path.substring(qindex+1), func);
	}
	return params;
};

/**
 * 
 * @param {} q　クエリー
 * @param {} func パラメータの値をデコードする関数(デフォルトではdecodeURIが使用される)
 * @return {}
 */
firemobilesimulator.common.util.getParamsFromQuery = function(q, func) {
	if (!func || !func instanceof Function) func = decodeURI;
	//dump("##getParamsFromQuery start\n");
	var params = {};
	var values = q.split("&");
	values.forEach(function(v, i) {
		//dump("###"+i+"\n");
		var eindex = v.indexOf("=");
		if (eindex == -1) {
			return;
		}
		//dump("decode:"+v.substring(eindex+1)+"\n");
		var value;
		try {
			value = func(v.substring(eindex+1));
		} catch (exception) {
			dump("[msim]Warning:decodeURI:"+v.substring(eindex+1)+"\n");
			value = v.substring(eindex+1);
		}
		params["" + v.substring(0,eindex)] = "" + value;
	});
	return params;
};

/**
 * 位置情報オブジェクト
 * @param {} lat
 * @param {} lon
 */
firemobilesimulator.common.util.Point = function(lat, lon) {
	this.lat=lat;
	this.lon=lon;
};

firemobilesimulator.common.util.Point.prototype = {
	lat : null,
	lon : null,
	datum : "0",
	unit : "0",
	DATUM_WGS : "0",
	DATUM_TOKYO : "1",
	UNIT_DMS : "0",
	UNIT_DEGREE : "1",
	toDms : function() {
		if (this.unit == this.UNIT_DEGREE) {
			this.lat = firemobilesimulator.common.util.degree2dms(this.lat);
			this.lon = firemobilesimulator.common.util.degree2dms(this.lon);
			this.unit = this.UNIT_DMS;
		}
	},
	toDegree : function() {
		if (this.unit == this.UNIT_DMS) {
			this.lat = firemobilesimulator.common.util.dms2degree(this.lat);
			this.lon = firemobilesimulator.common.util.dms2degree(this.lon);
			this.unit = this.UNIT_DEGREE;
		}
	},
	toWgs : function() {
		dump("Point.toWgs() Error:Not implemented.Do nothing.\n");
	},
	//wgs84測地系で与えられたdegreeを、tokyo測地系に変換する
	toTokyo : function() {
		if (this.datum == this.DATUM_WGS) {
			this.toDegree();
			//cf.http://homepage3.nifty.com/Nowral/02_DATUM/02_DATUM.html#HowTo
			this.lat = this.lat + 0.00010696*this.lat - 0.000017467*this.lon - 0.0046020;
			this.lon = this.lon + 0.000046047*this.lat + 0.000083049*this.lon - 0.010041;
			this.datum = this.DATUM_TOKYO;
		}
	}
};

/**
 * dms(度分秒)をdegree(度)に変換する
 * @param {} dms
 * @return {}
 */
firemobilesimulator.common.util.dms2degree = function(dms) {
	var m = /([-+]?)(\d+)\.(\d+)\.(\d+\.\d+)/.exec(dms);
	//var m = /^([-+]?)(\d+)\.(\d+)\.(\d+\.\d+)$/.exec(dms);
	if (!m) {
		return null;
	}
	var dir  = m[1] == "-" ? -1 : 1;
	var dms1 = parseInt(m[2], 10);
	var dms2 = parseInt(m[3], 10);
	var dms3 = parseFloat(m[4], 10);
	return dir * (dms1 + dms2/60 + dms3/3600);
};

/**
 * degree(度)をdms(時分秒)に変換する
 * @param {} degree
 * @return {}
 */
firemobilesimulator.common.util.degree2dms = function(degree) {
	var n = 1000;
	var u = Math.floor(degree*3600*n + 0.5);
	var s = parseInt(u/n) % 60;
	var m = parseInt(u/60/n) % 60;
	var d = parseInt(u/3600/n);
	var u = u % n;
	return d+"."+m.toString().padding("0",2)+"."+s.toString().padding("0",2)+"."+u;
};

/**
 * 指定された文字列で指定された長さになるまで埋めます
 * @param {} str 対象となる文字列
 * @param {} pad 埋める文字列
 * @param {} len 埋める長さ
 */
String.prototype.padding = function(pad, len) {
	var newString = this.valueOf();
	while (newString.length<len) {
		newString = pad+newString;
	}
	return new String(newString);
};

firemobilesimulator.common.util.getYYYYMMDDHHmm = function() {
	var now = new Date();
	var y = (now.getFullYear()).toString();
	var m = (now.getMonth()+1).toString().padding("0",2);
	var d = now.getDate().toString().padding("0",2);
	var h = now.getHours().toString().padding("0",2);
	var min = now.getMinutes().toString().padding("0",2);
	return y+m+d+h+min;
};

firemobilesimulator.common.util.getHiddenTag = function(params) {
	var r = "";
	for (var i in params) {
		if (i.toUpperCase() == "UID" && params[i].toUpperCase() == "NULLGWDOCOMO") {
			params[i] = firemobilesimulator.common.pref.copyUnicharPref("msim.config.DC.uid");
		}
		r += '<input type="hidden" name="'+i+'" value="'+params[i]+'" />\n';
	}
	return r;
};

firemobilesimulator.common.util.getTabFromHttpChannel = function (httpChannel) {
	var tab = null;
	var callbacks = httpChannel.notificationCallbacks;
	if (callbacks) {
		if (callbacks instanceof Components.interfaces.nsIXMLHttpRequest) {
			//dump("&&&&&[msim]is XMLHttpRequest.\n");
			//var ch = callbacks.channel;
			//dump("uri:"+ch.URI.asciiSpec+"\n");
			return null;
		}

		/*
		if (!(callbacks instanceof Components.interfaces.nsIDocShell)) {
			dump("#####[msim]isn't docShell.\n");
			dump(callbacks+"\n");
			dump("uri:"+httpChannel.URI.asciiSpec+"\n");
			return null;
		}else {
			dump("$$$$$[msim]is docShell.\n");
			dump(callbacks+"\n");
			dump("uri:"+httpChannel.URI.asciiSpec+"\n");
		}
		*/

		var interfaceRequestor = callbacks.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
		var docShell = null;
		try {
			docShell = interfaceRequestor.getInterface(Components.interfaces.nsIDocShell);
			var targetDoc = interfaceRequestor
					.getInterface(Components.interfaces.nsIDOMWindow).document;
			//dump("docShell:"+docShell+"\n");
			//dump("docShell's URI:"+docShell.currentURI.asciiSpec+"\n")
		} catch (e) {
			//fav.iconとか<link rel=prefetch>のリクエストの場合、getInterfaceできない模様
			//dump("if:"+interfaceRequestor+"\n");
			dump("[msim][Error]"+e+"\n");
			dump("[msim]targetURI:"+httpChannel.URI.asciiSpec+"\n");
			return null;
		}
		var webNav = httpChannel.notificationCallbacks
				.getInterface(Components.interfaces.nsIWebNavigation);
		var mainWindow = webNav.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
				.rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIDOMWindow);

		var gBrowser = mainWindow.getBrowser();
		var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(targetDoc);
		if (targetBrowserIndex != -1) {
			//dump("get tab info.index:"+targetBrowserIndex+"\n");
			tab = gBrowser.tabContainer.childNodes[targetBrowserIndex];
		}
	}
	return tab;
};
