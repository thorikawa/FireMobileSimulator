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

dump("[msim]load start msimStreamConverter.js\n");

/* components defined in this file */
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

const NAME = "FireMobileSimulator StreamConverter";
const CONVERSION = "?from=text/msim.html&to=*/*";
const CONTRACTID = "@mozilla.org/streamconv;1" + CONVERSION;
const CID = Components.ID("{202e8afd-d3f2-4615-bde7-62afd8cd898f}");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

// Load our component JS file.
var jsLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
jsLoader.loadSubScript("chrome://msim/content/common/ecl.js");
jsLoader.loadSubScript("chrome://msim/content/common/carrier.js");
jsLoader.loadSubScript("chrome://msim/content/common/pref.js");
jsLoader.loadSubScript("chrome://msim/content/mpc/common.js");
jsLoader.loadSubScript("chrome://msim/content/mpc/ezweb.js");
jsLoader.loadSubScript("chrome://msim/content/mpc/docomo.js");
jsLoader.loadSubScript("chrome://msim/content/mpc/softbank.js");
jsLoader.loadSubScript("chrome://msim/content/mpc.js");
jsLoader.loadSubScript("chrome://msim/content/common/util.js");
jsLoader.loadSubScript("chrome://msim/content/core.js");

/* text/msim.html -> text/html stream converter */
function MsimStreamConverter() {};
MsimStreamConverter.prototype = {

  // Firefox <= 3.6.*
  classDescription: NAME,

  // Firefox <= 3.6.*
  contractID: CONTRACTID,

  classID: CID,

  // Firefox <= 3.6.*
  _xpcom_categories: [{category: "@mozilla.org/streamconv;1",
                       entry: CONVERSION,
                       value: NAME,
                       service: true}],

  QueryInterface : XPCOMUtils.generateQI([
  	Ci.nsIStreamConverter,
  	Ci.nsIStreamListener,
  	Ci.nsIRequestObserver
  ]),
  
  // nsIRequestObserver methods
  onStartRequest : function(aRequest, aContext) {
	dump("[msim]onStartRequest\n");
	this.data = "";
	this.uri = aRequest.QueryInterface(Components.interfaces.nsIChannel).URI.spec;

	// Sets the charset if it is available. (For documents loaded from the
	// filesystem, this is not set.)
	this.charset = aRequest.QueryInterface(Components.interfaces.nsIChannel).contentCharset;
	this.channel = aRequest;
	this.channel.contentType = "text/html";

	this.listener.onStartRequest(this.channel, aContext);
  },
  
  // This is RequestObserver's method
  onStopRequest : function(aRequest, aContext, aStatusCode) {
	dump("[msim]onStopRequest\n");

    var id;
    var carrier;
    // タブごとに端末選択機能が有効になっている場合はタブから端末情報を取得する
    var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
    if (tabselect_enabled) {
      var tab = fms.common.util.getTabFromHttpChannel(this.channel);
      if (tab) {
        //id = tab.getAttribute("firemobilesimulator-device-id");
        var ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
        id = ss.getTabValue(tab, "firemobilesimulator-device-id");
        var pref_prefix = "msim.devicelist." + id;
        carrier = fms.common.pref.copyUnicharPref(pref_prefix + ".carrier");
      }
    } else {
      id = fms.common.pref.copyUnicharPref("msim.current.id");
      var pref_prefix = "msim.devicelist." + id;
      carrier = fms.common.pref.copyUnicharPref(pref_prefix + ".carrier");
      
      //ホスト制限に端末が指定されていればそれを優先する
      if(id){
        //ホスト制限に設定されている端末情報を取得する
        var deviceObj = firemobilesimulator.core.getDeviceByLimitHost(this.channel.URI.host);
        if(deviceObj){
          id = deviceObj.index;
          pref_prefix = "msim.devicelist." + id;
          carrier = fms.common.pref.copyUnicharPref(pref_prefix + ".carrier");
        }
      }
    }
    if (!id || !carrier) {
      dump("[msim][streamConverter]id or carrier is null\n");
      return;
    }

	//絵文字変換
	dump("[msim]convert pictogram in msimStreamConverter.js\n");
	var mpc = firemobilesimulator.mpc.factory(carrier);
	mpc.setImagePath("chrome://msim/content/emoji");

	//文字コード判別
	var mpccharset = "";
	if (this.charset.toUpperCase() == "SHIFT_JIS"
			|| this.charset.toUpperCase() == "X-SJIS"
			|| this.charset.toUpperCase() == "CP932"
			|| this.charset.toUpperCase() == "WINDOWS-31J") {
		mpccharset = firemobilesimulator.mpc.common.MPC_SJIS;
	} else if (this.charset.toUpperCase() == "UTF-8") {
		mpccharset = firemobilesimulator.mpc.common.MPC_UTF8
	} else if (this.charset.toUpperCase() == "EUC-JP"
			|| this.charset.toUpperCase() == "X-EUC-JP") {
		mpccharset = firemobilesimulator.mpc.common.MPC_EUCJP;
	} else {
		mpccharset = firemobilesimulator.mpc.common.MPC_SJIS;
	}
	mpc.charset = mpccharset;

	if (firemobilesimulator.common.carrier.AU == carrier) {
		dump("[msim]convertPictogram for AU\n");
		this.data = mpc.preConvert(this.data);
		var mpc2 = firemobilesimulator.mpc.factory(firemobilesimulator.common.carrier.DOCOMO);
		mpc2.setImagePath("chrome://msim/content/emoji");
		mpc2.charset = mpccharset;
		this.data = mpc2.preConvert(this.data);
	} else if (carrier) {
		dump("[msim]convertPictogram for DoCoMo or SoftBank\n");
		//dump("[msim]convertPictogram for docomo or SoftBank\n");
		this.data = mpc.preConvert(this.data);
	}

	var sis = Components.classes["@mozilla.org/io/string-input-stream;1"]
			.createInstance(Components.interfaces.nsIStringInputStream);
	sis.setData(this.data, this.data.length);

	// Pass the data to the main content listener
	this.channel.contentCharset = this.charset;
	this.listener.onDataAvailable(this.channel, aContext, sis, 0,
			this.data.length);
	this.listener.onStopRequest(this.channel, aContext, aStatusCode);
  },

  // nsIStreamListener methods
  onDataAvailable : function(aRequest, aContext,
		aInputStream, aOffset, aCount) {
	dump("[msim]onDataAvailable\n");
	var si = Components.classes["@mozilla.org/scriptableinputstream;1"]
			.createInstance();
	si = si.QueryInterface(Components.interfaces.nsIScriptableInputStream);
	si.init(aInputStream);
	var data = si.read(aCount);

	var m;
	if (this.charset == undefined || this.charset == "") {
		if (/^<\?xml(?:\s[^>]*?)?\sencoding\s*=\s*["']([^"']*)|<meta(?:\s[^>]*?)?\s(?:http-equiv\s*=\s*(["']?)content-type\2(?:\s[^>]*?)?\scontent\s*=\s*["']?[^;]+(?:;[^;=]+(?:=\s*[^\s;]*)?)*?;\s*charset\s*=\s*([^"'\s;<>]+)|content\s*=\s*(["']?)[^;]+(?:;[^;=]+(?:=\s*[^\s;]*)?)*?;\s*charset\s*=\s*([^"'\s;<>]+)[^"']*?\4(?:\s[^>]*?)?\shttp-equiv\s*=\s*(["']?)content-type\6)/i.test(data)) {
			m = RegExp.$1 || RegExp.$3 || RegExp.$5;
			this.charset = m;
			dump("[msim]guessed charset is " + m + "\n");
		} else {
			dump("[msim]No encoding match found");
		}
	} else {
		dump("[msim]Already got charset: " + this.charset
				+ "\n");
	}

	this.data += data;
  },
  
  // nsIStreamConverter methods
  // old name (before bug 242184)...
  AsyncConvertData : function(aFromType, aToType,
		aListener, aCtxt) {
	dump("[msim]AsyncConvertData\n");
	this.asyncConvertData(aFromType, aToType, aListener, aCtxt);
  },

  // renamed to...
  asyncConvertData : function(aFromType, aToType,
		aListener, aCtxt) {
	// Store the listener passed to us
	this.listener = aListener;
  },
  
  // Old name (before bug 242184):
  Convert : function(aFromStream, aFromType,
		aToType, aCtxt) {
	return this.convert(aFromStream, aFromType, aToType, aCtxt);
  },

  // renamed to...
  convert : function(aFromStream, aFromType,
		aToType, aCtxt) {
	return aFromStream;
  }

};

if (XPCOMUtils.generateNSGetFactory) {
  // Firefox >= 4
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([MsimStreamConverter]);
} else {
  // Firefox <= 3.6.*
  var NSGetModule = XPCOMUtils.generateNSGetModule([MsimStreamConverter]);
}

dump("[msim]load end msimStreamConverter.js\n");