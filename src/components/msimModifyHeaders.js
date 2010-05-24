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
jsLoader.loadSubScript("chrome://msim/content/common/pref.js");
jsLoader.loadSubScript("chrome://msim/content/common/carrier.js");
jsLoader.loadSubScript("chrome://msim/content/common/util.js");
jsLoader.loadSubScript("chrome://msim/content/core.js");

function myHTTPListener() {};
myHTTPListener.prototype = {

  observe : function(subject, topic, data) {
    if (topic == "app-startup") {
      var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
      os.addObserver(this, "http-on-modify-request", false);
      os.addObserver(this, "http-on-examine-response", false);
      os.addObserver(this, "http-on-examine-merged-response", false);
      return;
    }

    // dump("topic:"+topic+",subject="+subject+"\n");
    var id = firemobilesimulator.common.pref.copyUnicharPref("msim.current.id");
    var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
    var isSimulate = firemobilesimulator.core.isSimulate(httpChannel.URI.host);

    if (id && isSimulate) {
      // dump("sumulate\n");
      var pref_prefix = "msim.devicelist." + id;
      var carrier = firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".carrier");
      var registerFlag = firemobilesimulator.common.pref.getBoolPref("msim.config.register.enabled");
      var useragent = firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".useragent");
      if (firemobilesimulator.common.carrier.SOFTBANK == carrier) {
        useragent = firemobilesimulator.common.carrier.getSoftBankUserAgent(useragent, id);
      }else if (firemobilesimulator.common.carrier.DOCOMO == carrier) {
        useragent = firemobilesimulator.common.carrier.getDoCoMoUserAgent(useragent, id);
      }

      if (topic == "http-on-modify-request") {
        var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);

        // dump("[msim]httpChennel.name:"+httpChannel.name+"\n");
        // dump("[msim]httpChannel.asciiSpec:"+httpChannel.URI.asciiSpec+"\n");
        httpChannel.setRequestHeader("x-msim-use", "on", false);

        var uri = httpChannel.URI

        if (carrier == "DC") {

          var rewriteFlag = false;
          var as = uri.asciiSpec;
          var qs = "";
          var ps = null;

          var uid = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.DOCOMO_UID,id);
          var ser = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.DOCOMO_SER,id);
          var icc = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.DOCOMO_ICC,id);
          var guid = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.DOCOMO_GUID,id);

          // UTN
          var utnFlag = firemobilesimulator.common.pref
              .getBoolPref("msim.temp.utnflag");
          if (true == utnFlag) {
            // DoCoMo2.0
            var useragentTmp = useragent
                .match(/DoCoMo\/2\.0[^(]+\((?:[^;]*;)*[^)]*(?=\))/);
            if (useragentTmp) {
              dump("##add utn match1 for DoCoMo2.0##\n");
              useragent = useragentTmp[0] + ";ser" + ser + ";icc"
                  + icc + ")";
            }

            // DoCoMo1.0
            useragentTmp = useragent.match(/DoCoMo\/1\.0\/.+/);
            if (useragentTmp) {
              dump("##add utn match for DoCoMo1.0##\n");
              useragent = useragentTmp[0] + "/ser" + ser;
            }
          }

          // パラメータ解析&UID&GUID送信
          var parts = as.split("?");
          var params = {};
          if (parts.length == 2) {
            var sharps = parts[1].split('#');
            var values = sharps.shift().split("&");

            if (uri.scheme != "https") {
              // HTTPSではUID送信とiモードID送信は行わない

              values = values.map(function(value) {
                if (value.toUpperCase() == "UID=NULLGWDOCOMO") {
                  dump("[msim]send uid:"+uid+" for DoCoMo.\n");
                  //dump("[msim]send uid:"+uid+" for docomo.\n");
                  value = value.substr(0, 3) + "=" + uid;
                  rewriteFlag = true;
                } else if (value.toUpperCase() == "GUID=ON") {
                  dump("[msim]send guid:"+guid+" for DoCoMo.\n");
                  //dump("[msim]send guid:"+guid+" for docomo.\n");
                  httpChannel.setRequestHeader("X-DCMGUID",
                      guid, false);
                }
                return value;
              });
            }
            qs = new Array(values.join("&")).concat(sharps).join('#');
            as = parts[0] + "?" + qs;
          }

          // POSTパラメータ解析&UID送信
          if (httpChannel.requestMethod == "POST") {
            var uploadChannel = subject.QueryInterface(Ci.nsIUploadChannel);

            if (uploadChannel.uploadStream != null) {
              var seekable = uploadChannel.uploadStream;
              seekable.QueryInterface(Ci.nsISeekableStream);
              var stream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
              stream.init(uploadChannel.uploadStream);

              var valid = false;
              for (var line = processLine(stream); line; line = processLine(stream)) {
                var header = line.match(/^([^:]+):\s?(.*)/);

                if (header == null)
                  continue;

                if (header[1].toLowerCase() == "content-type" && header[2].toLowerCase() == "application/x-www-form-urlencoded")
                   valid = true;
              }

              if (valid) {
                var postParams = stream.read(stream.available());
                //dump("[msim]POST parameter: "+postParams+"\n");

                var values = postParams.split("&");

                if (uri.scheme != "https") {
                  // HTTPSではUID送信とiモードID送信は行わない

                  values = values.map(function(value) {
                    //dump("[msim]value: "+value+"\n");
                    if (value.toUpperCase() == "UID=NULLGWDOCOMO") {
                      dump("[msim]send uid:"+uid+" for docomo.\n");
                      value = value.substr(0, 3) + "=" + uid;
                      rewriteFlag = true;
                    }
                    return value;
                  });
                }
                ps = values.join("&");
                //dump("[msim]replace POST parameter: "+ps+"\n");
              }
              seekable.seek(0, 0);
            }
          }

          var lcsFlag = firemobilesimulator.common.pref
              .getBoolPref("msim.temp.lcsflag");
          if (true == lcsFlag) {
            dump("[msim]add GPS info for DoCoMo\n");
            //dump("[msim]add GPS info for docomo\n");
            var lat = firemobilesimulator.common.pref
                .copyUnicharPref("msim.config.DC.gps.lat");
            var lon = firemobilesimulator.common.pref
                .copyUnicharPref("msim.config.DC.gps.lon");
            var alt = firemobilesimulator.common.pref
                .copyUnicharPref("msim.config.DC.gps.alt");
            if (parts.length >= 2) {
              if (parts[1]) {
                as += "&lat=" + lat + "&lon=" + lon
                    + "&geo=wgs84&xacc=3&alt=" + alt;
              } else {
                as += "lat=" + lat + "&lon=" + lon
                    + "&geo=wgs84&xacc=3&alt=" + alt;
              }
            } else {
              as += "?lat=" + lat + "&lon=" + lon
                  + "&geo=wgs84&xacc=3&alt=" + alt;
            }
            rewriteFlag = true;
            firemobilesimulator.common.pref.setBoolPref(
                "msim.temp.lcsflag", false);
          }

          // docomo端末はCookie有効でなければ送信しない
          var useCookie = firemobilesimulator.common.pref.getBoolPref("msim.devicelist."+id+".use-cookie");
          if (!useCookie) {
            dump("[msim]not to use cookie\n");
            httpChannel.setRequestHeader("Cookie", null, false);
          }

          if (uri.host == "w1m.docomo.ne.jp") {
            var param = "";
            if (httpChannel.requestMethod == "GET") {
              param = qs ? "?" + qs : "";
            } else if (httpChannel.requestMethod == "POST") {
              param = ps ? "?" + ps : "";
            }
            var path = uri.path.split("?", 2)[0];
            if (path == "/cp/iarea") {
              // オープンiエリア対応
              rewriteURI(subject,
                  "chrome://msim/content/html/dc_openiarea.html"
                      + param);
            }

          } else if (rewriteFlag) {
            dump("[msim]rewrite for DoCoMo\n");
            //dump("[msim]rewrite for docomo\n");
            rewriteURI(subject, as, ps);
          }
        } else if (carrier == "SB") {
          var type = firemobilesimulator.common.pref.copyUnicharPref("msim.devicelist."+id+".type1");
          if(type != "iPhone"){
            var sbUid = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.SB_UID,id);
            httpChannel.setRequestHeader("x-jphone-uid",sbUid,false);
          }
        } else if (carrier == "AU") {
          var auUid = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.AU_UID,id);
          httpChannel.setRequestHeader("x-up-subno",auUid,false);

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

        dump("[msim]set ua:"+useragent+"\n");
        httpChannel.setRequestHeader("User-Agent", useragent, false);
        // set extra http headers
        var extraHeaders = firemobilesimulator.common.pref.getListPref("msim.devicelist." + id
                + ".extra-header", ["name", "value"]);
        extraHeaders.forEach(function (extraHeader) {
          if (extraHeader.value) {
            //dump("[msim]set http header:"+extraHeader.name+":"+extraHeader.value+"\n");
            httpChannel.setRequestHeader(extraHeader.name, extraHeader.value, false);
          }
        });
        return;
      } else if (topic == "http-on-examine-response"
          || topic == "http-on-examine-merged-response") {
        // cacheから読み込まれるときは、http-on-examine-merged-responseがnotifyされる
        // dump("msim:topic is "+topic+"\n");
        // dump("[msim]content-type:"+subject.contentType+"\n");
        var newContentType = "";
        var pictogramConverterEnabled = firemobilesimulator.common.pref
            .getBoolPref("msim.config." + carrier
                + ".pictogram.enabled");
        if (pictogramConverterEnabled) {
          newContentType = "text/msim.html";
        } else {
          newContentType = "text/html";
        }
        var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
        ["application/xhtml+xml", "text/vnd.wap.wml", "text/x-hdml",
            "text/html", "application/vnd.wap.xhtml+xml"].forEach(function(contentType) {
          if (contentType == subject.contentType) {
            subject.contentType = newContentType;
          }
        });
      }
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

function rewriteURI(subject, url, postStr) {
  var documentLoad = subject.loadFlags & (1<<16);
  //TODO: <img src="...">の指定などでrewriteする場合に対応要
  if (documentLoad) {
    subject.loadFlags = Ci.nsICachingChannel.LOAD_ONLY_FROM_CACHE;
    subject.cancel(Cr.NS_ERROR_FAILURE);
    var webNav = subject.notificationCallbacks
        .getInterface(Ci.nsIWebNavigation);
    var uploadChannel = subject.QueryInterface(Ci.nsIUploadChannel);
    var uploadStream = uploadChannel.uploadStream;
    if (postStr != null) {
      if (uploadStream instanceof Ci.nsIMIMEInputStream){
        //dump("[msim]uploadStream is nsIMIMEInputStream\n");
        var inputStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        inputStream.setData(postStr, postStr.length);

        inputStream.QueryInterface(Ci.nsISeekableStream);
        inputStream.seek(0, 0);
        inputStream.QueryInterface(Ci.nsIInputStream);
        uploadStream.setData(inputStream);
      } else if (uploadStream instanceof Ci.nsIStringInputStream) {
        //dump("[msim]uploadStream is nsIStringInputStream\n");
        var contentType = "Content-Type: application/x-www-form-urlencoded\r\n";
        var contentLength = "Content-Length: " + postStr.length + "\r\n";
        uploadStream.setData(contentType + contentLength + "\r\n" + postStr, contentType.length + contentLength.length + 2 + postStr.length);
      }
      //dump("[msim]set upload stream: "+postStr+"\n");
    }

    webNav.loadURI(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, uploadStream, null);
    //webNav.loadURI(url, subject.loadFlags, null, null, null);
  }
}

function processLine(stream) {
  var line = "";
  var size = stream.available();

  for (var i = 0; i < size; i++) {
    var c = stream.read(1);

    if (c == '\n')
      break;

    if (c != '\r')
      line += c;
  }

  return line;
}
