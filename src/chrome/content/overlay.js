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
if (!firemobilesimulator.overlay)
	firemobilesimulator.overlay = {};

firemobilesimulator.overlay.onInitialize = function() {
	// initialization code
	dump("[msim]onInitialize\n");

	firemobilesimulator.overlay.strings = document
			.getElementById("msim-strings");
	// initialize UserAgent
	var windowContent = window.getBrowser();
	if (windowContent) {
		dump("set load2\n");
		try {

			window.removeEventListener('load',
					firemobilesimulator.overlay.onInitialize, false);
		} catch (exception) {
			dump("[msim]removeEventListner error:" + exception + "\n");
		}
		//windowContent.addEventListener('load',
		//		firemobilesimulator.overlay.BrowserOnLoad, true);
		//window.addEventListener('load',
		//		firemobilesimulator.overlay.BrowserOnLoad, true);
		var appcontent = document.getElementById("appcontent");   // ブラウザ
		if (appcontent) {
			dump("###\n");
			//appcontent.addEventListener("DOMContentLoaded", firemobilesimulator.overlay.BrowserOnLoad, true);
			appcontent.addEventListener("load", firemobilesimulator.overlay.BrowserOnLoad, true);
		} else {
			dump("[msim]no appcontent.\n");
		}

	}

	var initialized = firemobilesimulator.common.pref
			.getBoolPref("msim.config.initialized");
	if (!initialized) {
		// 何か初期化処理をしたい場合はここに記載
		// firemobilesimulator.common.pref.setBoolPref("msim.config.initialized",
		// true);
	}
	firemobilesimulator.core.updateIcon();
};

firemobilesimulator.overlay.onUnload = function() {
	dump("[msim]onUnload\n");
	var windowCount = 0;
	var windowEnumeration = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getEnumerator("navigator:browser");

	try {
		window.removeEventListener("load",
				firemobilesimulator.overlay.onInitialize, false);
	} catch (exception) {
		dump("[msim]removeEventListner error:" + exception + "\n");
	}

	while (windowEnumeration.hasMoreElements()) {
		windowEnumeration.getNext();
		windowCount++;
	}

	dump("[msim]windowcount:" + windowCount.toString() + "\n");
	if (windowCount == 0) {
		var resetOnQuit = firemobilesimulator.common.pref
				.getBoolPref("msim.config.general.reset-device-onquit");
		if (resetOnQuit)
			firemobilesimulator.core.resetDevice();
	}

	try {
		window.removeEventListener("close",
				firemobilesimulator.overlay.onUnload, false);
	} catch (exception) {
		dump("[msim]removeEventListner error:" + exception + "\n");
	}

};

firemobilesimulator.overlay.displayDeviceSwitcherMenu = function(menu, suffix) {
	var optionsSeparator = document.getElementById("msim-separator2-" + suffix);

	this.removeGeneratedMenuItems(menu, ["msim-default-" + suffix,
					"msim-options-" + suffix, "msim-about-" + suffix]);

	var deviceCount = firemobilesimulator.common.pref
			.getIntPref("msim.devicelist.count");
	for (var i = 1; i <= deviceCount; i++) {
		var menuItem = document.createElement("menuitem");

		var carrier = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i
						+ ".carrier");
		var device = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i
						+ ".label");
		var useragent = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i
						+ ".useragent");

		if (device) {
			menuItem.setAttribute("id", "msim-device-" + suffix + "-" + i);
			menuItem.setAttribute("label", carrier + " " + device);
			menuItem.setAttribute("oncommand",
					"firemobilesimulator.core.setDevice(" + i + ");");
			menuItem.setAttribute("type", "radio");
			menuItem.setAttribute("name", "devicelist");
			menu.insertBefore(menuItem, optionsSeparator);
		}
	}

	var currentMenuId = "msim-device-"
			+ suffix
			+ "-"
			+ firemobilesimulator.common.pref
					.copyUnicharPref("msim.current.id");
	var currentMenu = document.getElementById(currentMenuId);
	if (!currentMenu) {
		currentMenu = document.getElementById("msim-default-" + suffix);
	}
	currentMenu.setAttribute("checked", true);
};

firemobilesimulator.overlay.removeGeneratedMenuItems = function(menu,
		permanentMenus) {
	var menuItem = null;

	// radioMenuItems = menu.getElementsByAttribute("type", "radio");
	var menuItems = menu.getElementsByTagName("menuitem");

	while (menuItems.length > permanentMenus.length) {
		menuItem = menuItems[1];

		if (!menuItem.hasAttribute("id")) {
			menu.removeChild(menuItem);
		} else {
			var deleteFlag = true;
			for (var i = 0; i < permanentMenus.length; i++) {
				if (menuItem.hasAttribute("id") == permanentMenus[i]) {
					deleteFlag = false
				}
			}
			deleteFlag && menu.removeChild(menuItem);
		}
	}

};

firemobilesimulator.overlay.openOptions = function() {
	window.openDialog("chrome://msim/content/options/options.xul",
			"msim-options-dialog", "centerscreen,chrome,modal,resizable");
};

firemobilesimulator.overlay.openAbout = function() {
	window.openDialog("chrome://msim/content/about.xul", "msim-about-dialog",
			"centerscreen,chrome,modal,resizable");
};

firemobilesimulator.overlay.BrowserOnLoad = function(objEvent) {
	dump("[msim]BrowserOnLoad is fired.\n");
	var carrier = firemobilesimulator.common.pref
			.copyUnicharPref("msim.current.carrier");
	var id = firemobilesimulator.common.pref.copyUnicharPref("msim.current.id");

	if (carrier) {
		var ndDocument = objEvent.originalTarget;
		if (objEvent.originalTarget.nodeName != "#document") {
			dump("[msim]nodeName is not #document\n");
			return;
		}
		//if (!ndDocument.body) {
		//	dump("[msim]body is null\n");
		//	return;
		//}

		if (ndDocument.body) {
			//フォントを等幅に統一
			ndDocument.body.style.fontFamily = "monospace";

			//表示領域サイズの制御（現在は横幅のみ）
			var forceScreenWidth = firemobilesimulator.common.pref
					.getBoolPref("msim.config.general.force-screen-width");
			var forceScreenHeight = firemobilesimulator.common.pref
					.getBoolPref("msim.config.general.force-screen-height");

			if (forceScreenWidth) {
				var width = firemobilesimulator.common.pref
						.copyUnicharPref("msim.devicelist." + id + ".screen-width")
						|| firemobilesimulator.common.pref
								.copyUnicharPref("msim.config.general.screen-width-default");
				ndDocument.body.style.width = width + "px";
				ndDocument.body.style.border = "2px solid black";
			}
		}

		// Firefoxの埋め込み表示Content-Typeは、自動的にDOMに変換されている為、除外する。
		if (ndDocument.contentType != "text/html") {
			dump("document is not html\n");
			return;
		}

		if (firemobilesimulator.common.carrier.AU == carrier) {
			// HDML暫定対応
			var hdmls = ndDocument.getElementsByTagName("hdml");
			if (hdmls.length >= 1) {
				var nodisplays = hdmls[0].getElementsByTagName("nodisplay");
				for (var i = 0; i < nodisplays.length; i++) {
					var actions = nodisplays[i].getElementsByTagName("action");
					for (var j = 0; j < actions.length; j++) {
						var task = actions[j].getAttribute("task");
						var dest = actions[j].getAttribute("dest");
						if (task.toUpperCase() == "GO" && dest) {
							dump("[msim]Debug : hdml go <" + dest + ">\n");
							ndDocument.location.href = dest;
							return;
						}
					}
				}
			}

			// WML暫定対応
			var oneventTags = ndDocument.getElementsByTagName("wml:onevent");
			for (var i = 0; i < oneventTags.length; i++) {
				dump("wml:onevent found:" + i + "\n");
				var onevent = oneventTags[i];
				var type = onevent.getAttribute("type");
				if (type == "onenterforward") {
					var goTags = onevent.getElementsByTagName("wml:go");
					for (var j = 0; j < goTags.length; j++) {
						dump("wml:go found:" + j + "\n");
						var go = goTags[j];
						var href = go.getAttribute("href");
						if (href) {
							dump("onenterforward go:" + href + "\n");
							ndDocument.location.href = href;
						}
					}
				}
			}
			var wmlAnchorTags = ndDocument.getElementsByTagName("wml:anchor");
			for (var i = 0; i < wmlAnchorTags.length; i++) {
				var anchor = wmlAnchorTags[i];
				var spawnTags = anchor.getElementsByTagName("wml:spawn");
				for (var j = 0; j < spawnTags.length; j++) {
					var spawn = spawnTags[j];
					var href = spawn.getAttribute("href");
					if (href) {
						dump("wml:anchor->wml:spawn found. set link:" + href
								+ "\n");
						// spawn.addEventListener("click",
						// function() {ndDocument.location.href=href;},
						// false);
						spawn.innerHTML = '<a href="' + href + '">'
								+ spawn.innerHTML + "</a>";
					}
				}
			}

			var pictogramConverterEnabled = firemobilesimulator.common.pref
					.getBoolPref("msim.config." + carrier
							+ ".pictogram.enabled");
			if (pictogramConverterEnabled) {
				dump("[msim]convert pictogram in overlay.js\n");
				var mpc = firemobilesimulator.mpc.factory(carrier);
				mpc.setImagePath("chrome://msim/content/emoji");
				var imgs = ndDocument.getElementsByTagName("img");
				for (var i = 0; i < imgs.length; i++) {
					var iconno = imgs[i].getAttribute("localsrc")
							|| imgs[i].getAttribute("icon");
					if (iconno && !isNaN(iconno)) {
						imgs[i].setAttribute("src", mpc.getImageSrc(parseInt(
										iconno, 10)));
					} else if (iconno) {
						iconno = mpc.getIconNumFromIconName("_" + iconno);
						if (iconno) {
							imgs[i]
									.setAttribute("src", mpc
													.getImageSrc(iconno));
						}
					}

				}
			}
		}

		if (firemobilesimulator.common.carrier.DOCOMO == carrier) {

			var setUtnFunction = function(e) {
				dump("[msim]click utn\n");
				if (true == confirm(firemobilesimulator.overlay.strings
						.getString("msim_utnConfirmation"))) {
					firemobilesimulator.common.pref.setBoolPref(
							"msim.temp.utnflag", true);
				}
				return true;
			};

			var setLcsFunction = function(e) {
				dump("[msim]click lcs\n");
				if (true == confirm(firemobilesimulator.overlay.strings
						.getString("msim_lcsConfirmation"))) {
					firemobilesimulator.common.pref.setBoolPref(
							"msim.temp.lcsflag", true);
					return true;
				} else {
					return false;
				}
			};

			firemobilesimulator.common.pref.setBoolPref("msim.temp.utnflag",
					false);
			firemobilesimulator.common.pref.setBoolPref("msim.temp.lcsflag",
					false);

			var anchorTags = ndDocument.getElementsByTagName('a');
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

			// formのUTN送信
			// uid=NULLGWDOCOMOのPOST送信
			// オープンiエリアの場合のメソッドを強制的にGETに書き換え
			// ##本当はhttp-on-modify-requestで書き換えたい##
			var formTags = ndDocument.getElementsByTagName('form');
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
					var inputTags = formTag.getElementsByTagName('input');
					for (var j = 0; j < inputTags.length; j++) {
						var inputTag = inputTags[j];
						var key = inputTag.getAttribute("name");
						var value = inputTag.value;
						if (key && value && key.toUpperCase() == "UID"
								&& value.toUpperCase() == "NULLGWDOCOMO") {
							dump("replace uid\n");
							var uid = firemobilesimulator.common.pref
									.copyUnicharPref("msim.config.DC.uid");
							inputTag.value = uid;
						}
					}
				}
			}
		}
	}
};

// 他のツールバーボタンが開いていても、FireMobileSimulatorのツールバーボタンを開く
firemobilesimulator.overlay.openToolbarButton = function(currentToolbarButton) {
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

/*
 * firemobilesimulator.overlay.onInitialize = function(e) {
 * firemobilesimulator.overlay.onInitialize(e); };
 * 
 * firemobilesimulator.overlay.onUnload = function(e) {
 * firemobilesimulator.overlay.onUnload(e); };
 */

window.addEventListener("load", firemobilesimulator.overlay.onInitialize,
				false);
window.addEventListener("unload", firemobilesimulator.overlay.onUnload, false);

dump("[msim]overlay.js is loaded.\n");
