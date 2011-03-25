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
const Cu = Components.utils;

const SCHEME = "device";
const NAME = "KDDI device protocol";
const CONTRACTID = "@mozilla.org/network/protocol;1?name=" + SCHEME;
const CID = Components.ID("{79e63cb7-ba95-40c5-902d-edb918b4679c}");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function MsimProtocolHandler() {};
MsimProtocolHandler.prototype = {

  // Firefox <= 3.6.*
  classDescription: NAME,

  // Firefox <= 3.6.*
  contractID: CONTRACTID,

  classID: CID,

  // Firefox <= 3.6.*
  _xpcom_categories: [],

  QueryInterface : XPCOMUtils.generateQI([
  	Ci.nsIProtocolHandler,
  	Ci.nsISupports
  ]),

  scheme: SCHEME,
  
  defaultPort: -1,
  
  protocolFlags: Ci.nsIProtocolHandler.URI_NORELATIVE | Ci.nsIProtocolHandler.URI_NOAUTH | Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

  allowPort: function(port, scheme){
    return false;
  },

  newURI: function(spec, charset, baseURI){
    var uri = Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);
    dump("[msim]spec:"+spec+"\n");
    try {
      uri.spec = spec;
    } catch (ex) {
      dump("[msim]uri.spec error.\n")
      var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      uri = ios.newURI("chrome://msim/content/html/error.html", null, null);
    }
    return uri;
  },

  newChannel: function(aURI){
    var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    if (aURI.asciiSpec.indexOf("device:location") == 0 || aURI.asciiSpec.indexOf("device:gpsone") == 0) {
      return ios.newChannel("chrome://msim/content/html/au_gps.html", null, null);
    } else {
      return ios.newChannel("chrome://msim/content/html/error.html", null, null);
    }
  }
};

if (XPCOMUtils.generateNSGetFactory) {
  // Firefox >= 4
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([MsimProtocolHandler]);
} else {
  // Firefox <= 3.6.*
  var NSGetModule = XPCOMUtils.generateNSGetModule([MsimProtocolHandler]);
}
