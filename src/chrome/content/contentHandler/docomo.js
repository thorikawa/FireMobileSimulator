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
if (!firemobilesimulator)
  firemobilesimulator = {};
if (!firemobilesimulator.contentHandler)
  firemobilesimulator.contentHandler = {};

firemobilesimulator.contentHandler.docomo = {

  filter : function (ndDocument, deviceId) {
    //
    var mpc = firemobilesimulator.mpc.factory("DC");
    mpc.setImagePath("chrome://msim/content/emoji");
    var parser = new fms.contentHandler.parser(ndDocument, mpc);
    parser.parse(ndDocument);
    //

    firemobilesimulator.contentHandler.common.filter(ndDocument, deviceId);    
    var setUtnFunction = function(e) {
      dump("[msim]click utn\n");
      if (true == confirm(firemobilesimulator.overlay.strings
          .getString("msim_utnConfirmation"))) {
        firemobilesimulator.common.pref.setBoolPref("msim.temp.utnflag",
            true);
      }
      return true;
    };
  
    var setLcsFunction = function(e) {
      dump("[msim]click lcs\n");
      if (true == confirm(firemobilesimulator.overlay.strings
          .getString("msim_lcsConfirmation"))) {
        firemobilesimulator.common.pref.setBoolPref("msim.temp.lcsflag",
            true);
        return true;
      } else {
        return false;
      }
    };
  
    firemobilesimulator.common.pref.setBoolPref("msim.temp.utnflag", false);
    firemobilesimulator.common.pref.setBoolPref("msim.temp.lcsflag", false);
  
    var anchorTags = ndDocument.getElementsByTagName("a");
    for (var i = 0; i < anchorTags.length; i++) {
      var anchorTag = anchorTags[i];
      var utn = anchorTag.getAttribute("utn");
      if (null != utn) {
        anchorTag.addEventListener("click", setUtnFunction, false);
      }
  
      var lcs = anchorTag.getAttribute("lcs");
      if (null != lcs) {
        dump("setlcs for a tag\n");
        anchorTag.addEventListener("click", setLcsFunction, false);
      }
    }
  
    // accesskey対応
    ndDocument.addEventListener("keypress", firemobilesimulator.contentHandler.common.createAccessKeyFunction(["accesskey"]), false);
  
    // formのUTN送信
    // uid=NULLGWDOCOMOのPOST送信
    // オープンiエリアの場合のメソッドを強制的にGETに書き換え
    // ##本当はhttp-on-modify-requestで書き換えたい##
    var formTags = ndDocument.getElementsByTagName("form");
    for (var i = 0; i < formTags.length; i++) {
      var formTag = formTags[i];
  
      // UTNセット
      var utn = formTag.getAttribute("utn");
      if (null != utn) {
        formTag.addEventListener("submit", setUtnFunction, false);
      }
  
      var lcs = formTag.getAttribute("lcs");
      if (null != lcs) {
        dump("setlcs for form tag\n");
        formTag.addEventListener("submit", setLcsFunction, false);
      }
  
      // オープンiエリアの場合のメソッドを強制的にGETに書き換え
      var action = formTag.getAttribute("action");
      if (action && action == "http://w1m.docomo.ne.jp/cp/iarea") {
        formTag.setAttribute("method", "GET");
      }
  
      // uid=NULLGWDOCOMOのPOST送信
      var method = formTag.getAttribute("method");
      if (method && method.toUpperCase() == "POST") {
        var inputTags = formTag.getElementsByTagName("input");
        for (var j = 0; j < inputTags.length; j++) {
          var inputTag = inputTags[j];
          var key = inputTag.getAttribute("name");
          var value = inputTag.value;
          if (key && value && key.toUpperCase() == "UID"
              && value.toUpperCase() == "NULLGWDOCOMO") {
            dump("replace uid\n");
            var uid = firemobilesimulator.common.carrier.getId(firemobilesimulator.common.carrier.idType.DOCOMO_UID,deviceId);
            inputTag.value = uid;
          }
        }
      }
    }
  }
};