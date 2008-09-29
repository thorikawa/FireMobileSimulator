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

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const kMSIM_NAME = "Mobile Simulator HTTP Listener";
const kMSIM_CONTRACTID = "@msim/myHTTPListener;1";
const kMSIM_CID = Components.ID("{2e9983d0-2c88-11dd-bd0b-0800200c9a66}");

// Load our component JS file.
var jsLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Ci.mozIJSSubScriptLoader);
jsLoader.loadSubScript("chrome://msim/content/common/preferences.js");
jsLoader.loadSubScript("chrome://msim/content/common/carrier.js");
jsLoader.loadSubScript("chrome://msim/content/common/util.js");

function myHTTPListener() {
};

myHTTPListener.prototype = {

	observe : function(subject, topic, data) {
		var carrier = pref.copyUnicharPref("msim.current.carrier");
		if (carrier) {

			var registFlag = pref.getBoolPref("msim.config.regist.enabled");

			if (topic == "http-on-modify-request") {
				var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
				var device = pref.copyUnicharPref("msim.current.device");
				var id = pref.copyUnicharPref("msim.current.id");

				httpChannel.setRequestHeader("x-msim-use", "on", false);

				var uri = httpChannel.URI

				if (carrier == "DC") {
					var rewriteFlag = false;
					var as = uri.asciiSpec;
					var qs = "";

					var uid = pref.copyUnicharPref("msim.config.DC.uid");
					var ser = pref.copyUnicharPref("msim.config.DC.ser");
					var icc = pref.copyUnicharPref("msim.config.DC.icc");
					var guid = pref.copyUnicharPref("msim.config.DC.guid");

					// UTN
					var utnFlag = pref.getBoolPref("msim.temp.utnflag");
					if (true == utnFlag) {
						var userAgent = pref
								.copyUnicharPref("msim.current.useragent");

						// DoCoMo2.0
						var userAgentTmp = userAgent
								.match(/DoCoMo\/2\.0[^(]+\((?:[^;]*;)*[^)]*(?=\))/);
						if (userAgentTmp) {
							dump("##add utn match1 for DoCoMo2.0##\n");
							userAgent = userAgentTmp[0] + ";ser" + ser + ";icc"
									+ icc + ")";
						}

						// DoCoMo1.0
						userAgentTmp = userAgent.match(/DoCoMo\/1\.0\/.+/);
						if (userAgentTmp) {
							dump("##add utn match for DoCoMo1.0##\n");
							userAgent = userAgentTmp[0] + "/ser" + ser;
						}
						httpChannel.setRequestHeader("User-Agent", userAgent,
								false);
					}

					// パラメータ解析&UID&GUID送信
					var parts = as.split("?");
					var params = {};
					if (parts.length == 2) {
						var values = parts[1].split("&");
						params = getParamsFromQuery(parts[1]);

						if (uri.scheme != "https") {
							// httpsではUID送信とiモードID送信は行わない
							values.map(function (value) {
								if (value.toUpperCase() == "UID=NULLGWDOCOMO") {
									value = value.substr(0, 3) + "="
											+ uid;
									rewriteFlag = true;
								} else if (value.toUpperCase() == "GUID=ON") {
									dump("[msim]set guid.\n");
									httpChannel.setRequestHeader("X-DCMGUID",
											guid, false);
								}
								return value;
							});
						}
						qs = values.join("&");
						as = parts[0] + "?" + qs;
					}

					var lcsFlag = pref.getBoolPref("msim.temp.lcsflag");
					if (true == lcsFlag) {
						dump("[msim]add GPS info for DoCoMo\n");
						var lat = pref
								.copyUnicharPref("msim.config.DC.gps.lat");
						var lon = pref
								.copyUnicharPref("msim.config.DC.gps.lon");
						var alt = pref
								.copyUnicharPref("msim.config.DC.gps.alt");
						if (parts.length >= 2) {
							if (parts[1]) {
								as += "&lat="+lat+"&lon="+lon+"&geo=wgs84&xacc=3&alt="+alt;
							} else {
								as += "lat="+lat+"&lon="+lon+"&geo=wgs84&xacc=3&alt="+alt;
							}
						} else {
							as += "?lat="+lat+"&lon="+lon+"&geo=wgs84&xacc=3&alt="+alt;
						}
						rewriteFlag = true;
						pref.setBoolPref("msim.temp.lcsflag", false);
					}

					// DoCoMo端末はCookie送信を行わない
					httpChannel.setRequestHeader("Cookie", null, false);

					if (uri.host == "w1m.docomo.ne.jp") {
						var param = qs ? "?" + qs : "";
						var path = uri.path.split("?", 2)[0];
						if (path == "/cp/iarea") {
							// オープンiエリア対応
							rewriteURI(subject,
									"chrome://msim/content/html/dc_openiarea.html"
											+ param);
						}

					} else if (rewriteFlag) {
						dump("[msim]rewrite for DoCoMo\n");
						rewriteURI(subject, as);
					}
				} else if (carrier == "SB") {
					httpChannel.setRequestHeader("x-jphone-uid", pref
									.copyUnicharPref("msim.config.SB.uid"),
							false);
				} else if (carrier == "AU") {
					httpChannel.setRequestHeader("x-up-subno", pref
									.copyUnicharPref("msim.config.AU.uid"),
							false);

					// accept-charsetヘッダを設定しないと、Googleなどは自動的にUTF-8文字列を送信してきてしまう
					// TODO:できれば端末ごとにaccept-charsetのヘッダも設定できるようにしたい。
					httpChannel.setRequestHeader("accept-charset",
							"shift_jis,*", false);

					if (uri.host == "movie.ezweb.ne.jp") {
						dump("host is mos. rewrite URI.\n");
						var path = uri.path;
						dump("#Au path:" + path + "\n");
						var parts = path.split("?");
						var param = parts.length == 2 ? "?" + parts[1] : "";
						rewriteURI(subject,
								"chrome://msim/content/html/au_mos.html?"
										+ parts[0]);
					}
				}

				// set extra http headers
				deviceAttribute[carrier].forEach(function (a) {
					var value = pref.copyUnicharPref("msim.devicelist."
							+ carrier + "." + id + "." + a);
					if (value) {
						// dump("set http header:"+a+":"+value+"\n");
						httpChannel.setRequestHeader(a, value, false);
					}
				});

				return;
			} else if (topic == "http-on-examine-response"
					|| topic == "http-on-examine-merged-response") {
				// cacheから読み込まれるときは、http-on-examine-merged-responseがnotifyされる
				// dump("msim:topic is "+topic+"\n");
				var newContentType = "";
				var pictogramConverterEnabled = pref.getBoolPref("msim.config."+carrier+".pictogram.enabled");
				if (pictogramConverterEnabled) {
					newContentType = "text/msim.html";
				} else {
					newContentType = "text/html";
				}

				var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
				["application/xhtml+xml", "text/vnd.wap.wml", "text/x-hdml", "text/html"].forEach(function (contentType) {
					if (contentType == subject.contentType) {
						subject.contentType = newContentType;
					}
				});
			}
		} else if (topic == "app-startup") {
			dump("msim:topic is app-startup.\n");
			var os = Cc["@mozilla.org/observer-service;1"]
					.getService(Ci.nsIObserverService);
			os.addObserver(this, "http-on-modify-request", false);
			os.addObserver(this, "http-on-examine-response", false);
			os.addObserver(this, "http-on-examine-merged-response", false);
			return;
		}
	},

	QueryInterface : function(iid) {
		if (iid.equals(Ci.nsIObserver) || iid.equals(Ci.nsISupports)
				|| iid.equals(Ci.nntIMsimHTTPListener)) {
			return this;
		}

		Components.returnCode = Cr.NS_ERROR_NO_INTERFACE;
		return null;
	}

};

var myModule = {

	registerSelf : function(compMgr, fileSpec, location, type) {
		var compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(kMSIM_CID, kMSIM_NAME,
				kMSIM_CONTRACTID, fileSpec, location, type);
		var catMgr = Cc["@mozilla.org/categorymanager;1"]
				.getService(Ci.nsICategoryManager);
		catMgr.addCategoryEntry("app-startup", kMSIM_NAME, kMSIM_CONTRACTID,
				true, true);
	},

	getClassObject : function(compMgr, cid, iid) {
		if (!cid.equals(kMSIM_CID))
			throw Cr.NS_ERROR_NO_INTERFACE;

		if (!iid.equals(Ci.nsIFactory))
			throw Cr.NS_ERROR_NOT_IMPLEMENTED;

		return myFactory;
	},

	canUnload : function(compMgr) {
		return true;
	}
};

var myFactory = {
	QueryInterface : function(aIID) {
		if (!aIID.equals(Ci.nsISupports) && !aIID.equals(Ci.nsIFactory))
			throw Cr.NS_ERROR_NO_INTERFACE;
		return this;
	},

	createInstance : function(outer, iid) {
		if (outer != null) {
			throw Cr.NS_ERROR_NO_AGGREGATION;
		}
		var component = new myHTTPListener();
		return component.QueryInterface(iid);
	}
};

function NSGetModule(compMgr, fileSpec) {
	return myModule;
}

function rewriteURI(subject, url) {
	subject.loadFlags = Ci.nsICachingChannel.LOAD_ONLY_FROM_CACHE;
	subject.cancel(Cr.NS_ERROR_FAILURE);
	var webNav = subject.notificationCallbacks
			.getInterface(Ci.nsIWebNavigation);
	webNav.loadURI(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
}
