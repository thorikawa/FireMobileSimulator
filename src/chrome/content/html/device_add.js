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

Ext.onReady(function() {

    var deviceDB = firemobilesimulator.common.pref.copyUnicharPref("msim.config.devicedb.url");
    var filePath = deviceDB + "?level=0";

    //データストア
    var ds = new Ext.data.Store({
        proxy:  new Ext.data.HttpProxy(
            {url: filePath}
        ),
        reader: new Ext.data.XmlReader(
            {id: 'Id', record: 'Device'},
            [
                {name: 'name', mapping: 'DeviceName'},
                {name: 'carrier', mapping: 'Carrier'},
                {name: 'type', mapping: 'Type'},
                {name: 'release-date', mapping: 'ReleaseDate'}
            ]
        )
    });

    //グリッド
    var sm = new Ext.grid.CheckboxSelectionModel({
    //var sm = new Ext.grid.SmartCheckboxSelectionModel({
        singleSelect: false,
        //excel: true
    });

    var grid = new Ext.grid.GridPanel({
        id: 'grid-device-cmp',
        store: ds,
        colModel: new Ext.grid.ColumnModel([
            sm,
            {header: '端末名', width: 160, sortable: true, dataIndex: 'name'},
            {header: 'キャリア', width: 80, sortable: true, dataIndex: 'carrier'},
            {header: 'タイプ', width: 80, sortable: true, dataIndex: 'type'},
            {header: '発売日', width: 80, sortable: true, dataIndex: 'release-date'}
        ]),
        renderTo: 'grid-device',
        height: 380,
        width: 500,
        stripeRows: true,
        title: '端末リスト',
        frame: true,
        sm: sm,
        viewConfig: {
            forceFit: true // 自動的にカラムサイズを調整
        },
        loadMask: {msg: "Loading..."},
        tbar: [{
            text: '選択した端末を追加',
            handler: firemobilesimulator.addDevice
        }]
    });

    ds.load();
});

firemobilesimulator.addDevice = function() {
    var postData = "level=5&id=";
    var idArray = new Array();
    var sm = Ext.getCmp('grid-device-cmp').getSelectionModel();
    var records = sm.getSelections();
    for(var i = 0; i<records.length; i++){
        var record = records[i];
        idArray.push(record.id);
    }
    postData += idArray.join("_");
    var deviceDB = firemobilesimulator.common.pref.copyUnicharPref("msim.config.devicedb.url");
    var devices = firemobilesimulator.core.parseDeviceListXML(deviceDB, postData);
    var result = firemobilesimulator.core.LoadDevices(devices, false);
    if(result){
        Ext.Msg.show({
            title: "追加完了",
            msg: "選択した端末がFireMobileSimulatorに追加されました"
        });
    }
    sm.clearSelections();
};
