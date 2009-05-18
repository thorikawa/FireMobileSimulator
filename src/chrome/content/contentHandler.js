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

firemobilesimulator.contentHandler.factoryMap = {};
firemobilesimulator.contentHandler.factoryMap[firemobilesimulator.common.carrier.DOCOMO] = firemobilesimulator.contentHandler.docomo;
firemobilesimulator.contentHandler.factoryMap[firemobilesimulator.common.carrier.AU] = firemobilesimulator.contentHandler.au;
firemobilesimulator.contentHandler.factoryMap[firemobilesimulator.common.carrier.SOFTBANK] = firemobilesimulator.contentHandler.softbank;
firemobilesimulator.contentHandler.factoryMap[firemobilesimulator.common.carrier.OTHER] = firemobilesimulator.contentHandler.common; 

firemobilesimulator.contentHandler.factory = function (carrier) {
	return firemobilesimulator.contentHandler.factoryMap[carrier];
};
