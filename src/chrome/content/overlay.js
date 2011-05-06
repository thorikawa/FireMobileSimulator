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
var fms;
if (!fms) fms = firemobilesimulator;
if (!fms.overlay) fms.overlay = {};

fms.overlay.onInitialize = function() {
  // initialization code
  dump("[msim]onInitialize\n");

  fms.overlay.strings = document
      .getElementById("msim-strings");
  // initialize user agent
  var windowContent = window.getBrowser();
  if (windowContent) {
    try {
      window.removeEventListener("load", fms.overlay.onInitialize, false);
    } catch (exception) {
      dump("[msim]removeEventListner error:" + exception + "\n");
    }
    //windowContent.addEventListener("load", fms.overlay.BrowserOnLoad, true);
    //window.addEventListener("load", fms.overlay.BrowserOnLoad, true);
    var appcontent = document.getElementById("appcontent");   // ブラウザ
    if (appcontent) {
      //appcontent.addEventListener("DOMContentLoaded", fms.overlay.BrowserOnLoad, true);
      appcontent.addEventListener("load", fms.overlay.BrowserOnLoad, true);
      // タブごとに端末選択機能のため、タブが選択されたときのイベントハンドラを追加
      gBrowser.tabContainer.addEventListener('TabSelect', function(evt) { fms.overlay.rewrite(); }, false);
    } else {
      dump("[msim]no appcontent.\n");
    }

  }

  var initialized = fms.common.pref
      .getBoolPref("msim.config.initialized");
  if (!initialized) {
    // 何か初期化処理をしたい場合はここに記載
    // fms.common.pref.setBoolPref("msim.config.initialized",
    // true);
  }
  fms.core.updateIcon();  
};

fms.overlay.onUnload = function() {
  dump("[msim]onUnload\n");
  var windowCount = 0;
  var windowEnumeration = Components.classes["@mozilla.org/appshell/window-mediator;1"]
      .getService(Components.interfaces.nsIWindowMediator)
      .getEnumerator("navigator:browser");

  try {
    window.removeEventListener("load",
        fms.overlay.onInitialize, false);
  } catch (exception) {
    dump("[msim]removeEventListner error:" + exception + "\n");
  }

  while (windowEnumeration.hasMoreElements()) {
    windowEnumeration.getNext();
    windowCount++;
  }

  dump("[msim]windowcount:" + windowCount.toString() + "\n");
  if (windowCount == 0) {
    var resetOnQuit = fms.common.pref.getBoolPref("msim.config.general.reset-device-onquit");
    if (resetOnQuit)
      fms.core.resetDevice();
  }

  try {
    window.removeEventListener("close", fms.overlay.onUnload, false);
  } catch (exception) {
    dump("[msim]removeEventListner error:" + exception + "\n");
  }

};

/**
 * 端末選択のポップアップメニューを選択したときのイベントハンドラ
 */
fms.overlay.displayDeviceSwitcherMenu = function(menu, suffix) {
  var optionsSeparator = document.getElementById("msim-separator2-" + suffix);
  //dump(optionsSeparator);

  this.removeGeneratedMenuItems(menu, ["msim-default-" + suffix,
          "msim-options-" + suffix, "msim-devicedb-" + suffix, "msim-about-" + suffix]);

  var deviceCount = fms.common.pref
      .getIntPref("msim.devicelist.count");
  for (var i = 1; i <= deviceCount; i++) {
    var device = fms.common.pref.copyUnicharPref("msim.devicelist." + i + ".label");
    if (!device) continue;

    var carrier = fms.common.pref.copyUnicharPref("msim.devicelist." + i + ".carrier");
    var useragent = fms.common.pref.copyUnicharPref("msim.devicelist." + i + ".useragent");

    var menuItem = menu.insertBefore(document.createElement("menuitem"), optionsSeparator);
    menuItem.setAttribute("id", "msim-device-" + suffix + "-" + i);
    menuItem.setAttribute("label", carrier + " " + device);
    menuItem.setAttribute("oncommand", "fms.core.setDevice(" + i + ");");
    menuItem.setAttribute("type", "radio");
    menuItem.setAttribute("name", "devicelist");
  }
  
  // 現在選択されている端末にチェックをつける
  var currentId;
  var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
  if (tabselect_enabled) {
    var tab = gBrowser.selectedTab;
    var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
    currentId = ss.getTabValue(tab, "firemobilesimulator-device-id");
  } else {
    currentId = fms.common.pref.copyUnicharPref("msim.current.id");
  }

  var currentMenu;  
  if (currentId) {
    currentMenu = document.getElementById("msim-device-" + suffix + "-" + currentId);
  }
  if (!currentMenu) {
    currentMenu = document.getElementById("msim-default-" + suffix);
  }  
  currentMenu.setAttribute("checked", true);

};

/**
 * 端末選択メニューのDOMをXUL上から削除する
 */
fms.overlay.removeGeneratedMenuItems = function(menu,
    permanentMenus) {
  var menuItem = null;

  // radioMenuItems = menu.getElementsByAttribute("type", "radio");
  var menuItems = menu.getElementsByTagName("menuitem");

  while (menuItems.length > permanentMenus.length) {
    menuItem = menuItems[3]; //注意メニューの構造が変わったら変える

    if (!menuItem.hasAttribute("id")) {
      menu.removeChild(menuItem);
    } else {
      var deleteFlag = true;
      for (var i = 0; i < permanentMenus.length; i++) {
        if (menuItem.getAttribute("id") == permanentMenus[i]) {
          deleteFlag = false
        }
      }
      deleteFlag && menu.removeChild(menuItem);
    }
  }

};

fms.overlay.openOptions = function() {
  window.openDialog("chrome://msim/content/options/options.xul",
      "msim-options-dialog", "centerscreen,chrome,modal,resizable");
};

fms.overlay.openDeviceDB = function() {
  window.getBrowser().selectedTab = window.getBrowser().addTab("chrome://msim/content/html/device_add.html");
};

fms.overlay.openAbout = function() {
  window.openDialog("chrome://msim/content/about.xul", "msim-about-dialog",
      "centerscreen,chrome,modal,resizable");
};

fms.overlay.BrowserOnLoad = function(objEvent) {
  dump("[msim]BrowserOnLoad is fired.\n");
  var ndDocument = objEvent.originalTarget;  
  var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
  if (tabselect_enabled) {
    var tab = null;
    var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(ndDocument);
    if (targetBrowserIndex != -1) {
      tab = gBrowser.tabContainer.childNodes[targetBrowserIndex];
    }
    
    //var id = tab.getAttribute("firemobilesimulator-device-id");
    if (tab) {
      var ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
      id = ss.getTabValue(tab, "firemobilesimulator-device-id");
      var pref_prefix = "msim.devicelist." + id;
      carrier = fms.common.pref.copyUnicharPref(pref_prefix + ".carrier");
    }
  } else {
    var carrier = fms.common.pref.copyUnicharPref("msim.current.carrier");
    var id = fms.common.pref.copyUnicharPref("msim.current.id");
  }
  if (!carrier) {
    return;
  }

  if (objEvent.originalTarget.nodeName != "#document") {
    dump("[msim]nodeName is not #document\n");
    return;
  }
  // Firefoxの埋め込み表示Content-Typeは、自動的にDOMに変換されている為、除外する。
  if (ndDocument.contentType != "text/html") {
    dump("document is not html\n");
    return;
  }
  var isSimulate = false;
  try {
    isSimulate = fms.core.isSimulate(ndDocument.location.hostname);
  } catch (e) {
    //about:blankとかだとndDocument.location.hostnameを取得するときに例外を投げるケースがある。
    //Do nothing
  }
  if (isSimulate) {
    var contentHandler = firemobilesimulator.contentHandler.factory(carrier);
    contentHandler && contentHandler.filter(ndDocument, id);
  }
};

// 他のツールバーボタンが開いていても、FireMobileSimulatorのツールバーボタンを開く
fms.overlay.openToolbarButton = function(currentToolbarButton) {
  if (currentToolbarButton && !currentToolbarButton.open) {
    var toolbarButton = null;
    var toolbarButtons = currentToolbarButton.parentNode
        .getElementsByTagName("toolbarbutton");
    var toolbarButtonsLength = toolbarButtons.length;

    for (var i = 0; i < toolbarButtonsLength; i++) {
      toolbarButton = toolbarButtons.item(i);

      if (toolbarButton && toolbarButton != currentToolbarButton
          && toolbarButton.open) {
        toolbarButton.open = false;
        currentToolbarButton.open = true;

        break;
      }
    }
  }
};

/**
 * タブごとの再描画
 */
fms.overlay.rewrite = function () {
  dump("[msim]rewrite tab\n");
  var statusPanel = document.getElementById("msim-status-panel");
  var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
  if (!tabselect_enabled) {
    // タブごとに端末選択モードでない場合は、下部ステータスバーの端末選択メニューを非表示にする
    dump("[msim]tabselect is not enabled\n");
    statusPanel.setAttribute("style","visibility: collapse");
    return;
  }
  
  statusPanel.setAttribute("style","visibility: visible");
  var tab = gBrowser.selectedTab;
  var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
  var id = ss.getTabValue(tab, "firemobilesimulator-device-id");
  var pref_prefix = "msim.devicelist." + id;
  var carrier = fms.common.pref.copyUnicharPref(pref_prefix + ".carrier");
  var name = fms.common.pref.copyUnicharPref(pref_prefix + ".label");

  var statusImage = document.getElementById("msim-status-image");
  var statusLabel = document.getElementById("msim-status-label");
  var msimButton = document.getElementById("msim-button");
  var menu = document.getElementById("msim-menu");
  var target = [msimButton, menu];

  if (id) {
    target.forEach(function(item) {
      if (item) {
        item.setAttribute("device", "on");
      }
    });
    statusImage.setAttribute("device", "on");
  } else {
    target.forEach(function(item) {
      if (item) {
        item.removeAttribute("device");
      }
    });
    statusImage.removeAttribute("device");
  }
  statusLabel.setAttribute("value", name);
};

window.addEventListener("load", fms.overlay.onInitialize,
        false);
window.addEventListener("unload", fms.overlay.onUnload, false);

// タブを復元したときに、タブごとに端末選択モードだった場合、再描画する
document.addEventListener("SSTabRestoring", function (e) {
  var tabselect_enabled = fms.common.pref.getBoolPref("msim.config.tabselect.enabled");
  if (tabselect_enabled) {
    fms.overlay.rewrite();
  }
}, false);

// dump("[msim]overlay.js is loaded.\n");
