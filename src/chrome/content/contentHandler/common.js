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

firemobilesimulator.contentHandler.common = {
	filter : function (ndDocument, deviceId) {
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
						.copyUnicharPref("msim.devicelist." + deviceId + ".screen-width")
						|| firemobilesimulator.common.pref
								.copyUnicharPref("msim.config.general.screen-width-default");
				ndDocument.body.style.width = width + "px";
				ndDocument.body.style.border = "2px solid black";
			}
		}
	},
	
	createAccessKeyFunction : function (keyNameArray) {
		return function(e) {
			var anchorTags = this.getElementsByTagName("a");
			for (var i = 0; i < anchorTags.length; i++) {
				var anchorTag = anchorTags[i];
				var accesskey;
				for (var j = 0; j < keyNameArray.length; j++) {
					accesskey = anchorTag.getAttribute(keyNameArray[j]);
					if(accesskey){
						break;
					}
				}
				if (accesskey && accesskey.match(/^(\d|\*|\#)$/)) {
					accesskey = accesskey.charCodeAt(0);
					if (e.charCode == accesskey) {
						anchorTag.focus();
						var evt = document.createEvent("MouseEvents");
						evt.initMouseEvent("click", true, true, window, 0,
								0, 0, 0, 0, false, false, false, false, 0,
								null);
						anchorTag.dispatchEvent(evt);
						break;
					}
				}
			}
		};
	}
};