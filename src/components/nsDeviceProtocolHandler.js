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
const kSCHEME = "device";
const kPROTOCOL_NAME = "KDDI device protocol";
const kPROTOCOL_CONTRACTID = "@mozilla.org/network/protocol;1?name=" + kSCHEME;
const kPROTOCOL_CID = Components.ID("79e63cb7-ba95-40c5-902d-edb918b4679c");

function Protocol(){
}

Protocol.prototype = {
	QueryInterface: function(iid){
		if (!iid.equals(Ci.nsIProtocolHandler) &&
				!iid.equals(Ci.nsISupports))
			throw Cr.NS_ERROR_NO_INTERFACE;
		return this;
	},

	scheme: kSCHEME,
	defaultPort: -1,
	protocolFlags: Ci.nsIProtocolHandler.URI_NORELATIVE | Ci.nsIProtocolHandler.URI_NOAUTH,

	allowPort: function(port, scheme){
		return false;
	},

	newURI: function(spec, charset, baseURI){
		var uri = Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);
		dump("spce:"+spec+"\n");
		uri.spec = spec;
		return uri;
	},

	newChannel: function(aURI){
		var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		if(aURI.asciiSpec.indexOf("device:location") == 0 || aURI.asciiSpec.indexOf("device:gpsone") == 0){
			return ios.newChannel("chrome://msim/content/html/au_gps.html", null, null);
		}else{
			return ios.newChannel("chrome://msim/content/html/error.html", null, null);
		}
	}
};

var ProtocolFactory = {
	createInstance: function (outer, iid){
		if (outer != null)
			throw Cr.NS_ERROR_NO_AGGREGATION;

		if (!iid.equals(Ci.nsIProtocolHandler) &&
				!iid.equals(Ci.nsISupports))
			throw Cr.NS_ERROR_NO_INTERFACE;

		return new Protocol();
	}
};

var myModule = {
	registerSelf: function (compMgr, fileSpec, location, type){
		compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(
			kPROTOCOL_CID,
			kPROTOCOL_NAME,
			kPROTOCOL_CONTRACTID,
			fileSpec,
			location,
			type
		);
	},

	getClassObject: function (compMgr, cid, iid){
		if (!cid.equals(kPROTOCOL_CID))
			throw Cr.NS_ERROR_NO_INTERFACE;

		if (!iid.equals(Ci.nsIFactory))
			throw Cr.NS_ERROR_NOT_IMPLEMENTED;

		return ProtocolFactory;
	},

	canUnload: function (compMgr){
		return true;
	}
};

function NSGetModule(compMgr, fileSpec){
	return myModule;
}
