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
if(!firemobilesimulator) firemobilesimulator = {};
if(!firemobilesimulator.common) firemobilesimulator.common = {};

firemobilesimulator.common.jsLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
firemobilesimulator.common.jsLoader.loadSubScript("chrome://global/content/nsUserSettings.js");

firemobilesimulator.common.pref = {
	__proto__ : nsPreferences,

	getPrefService2 : function()
	{
		return Components.classes["@mozilla.org/preferences-service;1"].
			getService(Components.interfaces.nsIPrefService).getBranch("");
	},

	deletePref : function(preference)
	{
		if(this.getPrefService2().prefHasUserValue(preference))
		{
			this.getPrefService2().clearUserPref(preference);
		}
	}
};
