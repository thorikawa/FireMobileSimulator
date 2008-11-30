/**
 * @class Ext.grid.SmartCheckboxSelectionModel
 * @extends Ext.grid.RowSelectionModel
 *
 * A custom selection model that renders a column of checkboxes that can be toggled to select or deselect rows.
 * By passing in a dataIndex and a store, it can pre-check (and select) rows after it renders.
 * Included are all the standard navigation options of a RowSelectionModel, including Up/Down arrow keyMaps and Ctrl/Shift selections.
 *
 * @param         (object)         config         The configuration options, as highlighted below
 * @param        (string)        dataIndex    The field that contains the boolen true/false value for checked/selected rows        
 *
 * @copyright    June 4, 2008    <last updated: July 1, 2008>
 * @author        Noah Kronemeyer    <nkronemeyer@therubicongroup.com>
 * @version        1.7
 */
Ext.grid.SmartCheckboxSelectionModel = Ext.extend(Ext.grid.RowSelectionModel, {
    /**
     * @header (string)        Any valid text or HTML fragment to display in the header cell for the checkbox column
     *                         (defaults to '<div id="x-grid3-hd-checker" class="x-grid3-hd-checker"> </div>').  The default CSS
     *                        class of 'x-grid3-hd-checker' displays a checkbox in the header and provides support
     *                        for automatic check all/none behavior on header click. This string can be replaced by
     *                        any valid HTML fragment, but if you use a simple text string (e.g., 'Select Rows'), you must include it
     *                        in the following format: <div id="x-grid3-hd-checker">&nbsp;Simple String</div>, in addition
     *                         the automatic check all/none behavior will only work if the 'x-grid3-hd-checker' class is supplied.
     */
    header: '<div id="x-grid3-hd-checker" class="x-grid3-hd-checker"> </div>',
    /**
     * @width        (int)    The default width in pixels of the checkbox column (defaults to 20).
     */
    width: 20,
    /**
     * @sortable    (bool)    Set to true if you want the checkbox column to be sortable.
     */
    sortable: false,
    /**
     * @email        (bool)    Will mimic email client functionality by separating out the selection of rows
     *                        with the checking of rows, similar to how Yahoo! or Gmail works. One could then
     *                        apply different actions on checked rows vs. selected rows.
     *                        Defaults to false. 
     */
    email: false,
    /**
     * @excel        (bool)    Mimics excel functionality when clicking on rows or checkboxes. If set to true,
     *                        all other rows will be deselected and unchecked except the row you most recently
     *                        clicked. If set to false, all previous selections will remain selected and/or checked
     *                        as you click around the grid (as if you were holding down CTRL and clicking).
     *                        Defaults to false. 
     */
    excel: true,
    
    /**
     * @alwaysSelectOnCheck        
     *                (bool)    If set to true, clicking a checkbox will always select the row, working in conjunction
     *                        with the email option.
     *                        Defaults to false.
     *
     */
    alwaysSelectOnCheck: false,
    
    // private
    menuDisabled:true,
    fixed:true,
    id: 'checker',
    dataIndex: '', // Define the dataIndex when you construct the selectionModel, not here

    // private
    initEvents : function(){
        // Call the parent
        Ext.grid.SmartCheckboxSelectionModel.superclass.initEvents.call(this);
        // Assign the handlers for the mousedown events
        this.grid.on('render', function(){
            var view = this.grid.getView();
            view.on('columnmove', this.onColumnMove, this);
            view.mainBody.on('mousedown', this.onMouseDown, this);
            Ext.fly(view.innerHd).on('mousedown', this.onHdMouseDown, this);
        }, this);        
           // Disable the rowNav created in our parent object, otherwise pressing DOWN will go down two rows!
        this.rowNav.disable();
        // Create our new rowNav that controls checkboxes as well
        this.rowNav2 = new Ext.KeyNav(this.grid.getGridEl(), {
            "up" : function(e){
                if(!e.shiftKey){
                    if(!this.email){ this.selectPreviousChecked(e.shiftKey); }
                    if(this.email){ this.selectPrevious(e.shiftKey); }
                }
                else if(this.last !== false && this.lastActive !== false){
                    var last = this.last;
                    if(!this.email){ this.selectRangeChecked(this.last, this.lastActive-1); }
                    if(this.email){ this.selectRange(this.last,  this.lastActive-1); }
                    this.grid.getView().focusRow(this.lastActive);
                    if(last !== false){
                        this.last = last;
                    }
                }
                else{
                    this.selectFirstRow();
                    if(!this.email){ this.toggleChecked(0, true); }
                }
            },
            "down" : function(e){
                if(!e.shiftKey){
                    if(!this.email){ this.selectNextChecked(e.shiftKey); }
                    if(this.email){ this.selectNext(e.shiftKey); }
                }
                else if(this.last !== false && this.lastActive !== false){
                    var last = this.last;
                    if(!this.email){ this.selectRangeChecked(this.last, this.lastActive+1); }
                    if(this.email){ this.selectRange(this.last,  this.lastActive+1); }
                    this.grid.getView().focusRow(this.lastActive,true);
                    if(last !== false){
                        this.last = last;
                    }
                }
                else{
                    this.selectFirstRow();
                    if(!this.email){ this.toggleChecked(0, true); }
                }
            },
            scope: this
        });
        // Listen for the movement of the columns  
        this.grid.on('columnmove', function(p){
            var t = Ext.get('x-grid3-hd-checker');
            if(t != null){
                if(t.dom.className != 'x-grid3-hd-checker'){
                       Ext.fly(t.dom.parentNode).removeClass('x-grid3-hd-checker');
                }
            }
        });
        // If we sent a store to the selModel, auto-select rows based on dataIndex
        if (this.grid.store){
            this.grid.store.on('load', function(p){
                // This block of code checks the status of the checkbox header, 
                // and if checked, will check all other checkboxes (but not on the initial load)
                var t = Ext.get('x-grid3-hd-checker');
                if(t != null){
                    if(t.dom.className == 'x-grid3-hd-checker' && Ext.state.Manager.loaded){
                        var hd = Ext.fly(t.dom.parentNode);
                        var isChecked = hd.hasClass('x-grid3-hd-checker-on');
                        if(isChecked){
                            hd.addClass('x-grid3-hd-checker-on');
                            if(!this.email){ this.selectAll(); }
                            this.selectAllChecked(true);
                        }
                    }
                    else{
                           Ext.fly(t.dom.parentNode).removeClass('x-grid3-hd-checker');
                    }
                }
            
                // This block of code will pre-select checkboxes based on the dataIndex supplied,
                // but only on the initial load.
                  var dataIndex = this.grid.getSelectionModel().dataIndex; // the dataIndex for the selectionModel
                  var count = this.grid.store.getCount();
                for(var i = 0, len = count; i < len; i++){
                    var dataIndexValue = p.data.items[i].data[dataIndex]; // the value of the dataIndex for each row
                    var isSelected = this.isSelected(i);
                    if((dataIndexValue == true || isSelected) && !Ext.state.Manager.loaded){
                        // This code will only run the first time a grid is loaded 
                        // Make sure that any "checked" rows are also selected
                        if(!this.email || this.alwaysSelectOnCheck){ this.grid.getSelectionModel().selectRow(i, true); }
                    }
                    else if(isSelected){
                        // Let the state.Manager check the correct rows now
                        if(!this.email){ this.toggleChecked(i, true); }
                    }
                    else{
                        // Uncheck everything else
                        if(!this.email){ this.toggleChecked(i, false); }
                    }
                }
            }, this);
        }
    },

    /**
     * private function that controls the checkboxes
     *
     * @param    (int)    rowIndex    the row you want to toggle
     * @param    (bool)    c            optional flag set to either true (to check) or false (to uncheck)
     *                                if no second param, the checkbox will toggle itself 
     */
    toggleChecked : function(rowIndex, c){
        if(this.locked) return;
           var record = this.grid.store.getAt(rowIndex);
        if(c === true){
            // Check
               record.set(this.dataIndex, true);
           }
           else if(c === false){
               // Uncheck
               record.set(this.dataIndex, false);
           }
           else{
               // Toggle checked / unchecked
               record.set(this.dataIndex, !record.data[this.dataIndex]);
           }
    },

    /**
     * private functions that toggles all checkboxes on or off depending on param
     *
     * @param    (bool)    c        true to check all checkboxes, false to uncheck all checkboxes        
     * @param    (int)    e        (optional) if an exception is given, all rows will be checked/unchecked except this row        
     */
    selectAllChecked : function(c, e){
        if(this.locked) return;
         var count = this.grid.store.getCount();
        for(var i = 0, len = count; i < len; i++){
            if(c){
                if(i !== e){
                    this.toggleChecked(i, true);
                }
            }
            else{
                if(i !== e){
                    this.toggleChecked(i, false);
                }
            }
        }            
    },
    
    /**
     * private function that clears all checkboxes
     * specifically used to deal with shift+arrow keys,
     * but can also be called with fast param to quickly uncheck everything
     *
     * @param    (bool)    fast    true to quickly deselect everything with no exceptions
     */
    clearChecked : function(fast){
        if(this.locked) return;
        if(fast !== true){
            var count = this.grid.store.getCount();
            for(var i = 0, len = count; i < len; i++){
                var isSelected = this.isSelected(i);
                if(!isSelected){
                    this.toggleChecked(i, false);
                }
            }
        }
        else{
            // Quick and dirty method to uncheck everything
            this.selectAllChecked(false);
        }
        this.last = false;
    },    
    
    /**
     * private function used in conjuction with the shift key for checking multiple rows at once
     */
    selectRangeChecked : function(startRow, endRow, keepExisting){
        if(this.locked) return;
        if(!keepExisting){
            if(!this.email || this.alwaysSelectOnCheck){ this.clearSelections(); }
            this.clearChecked();
        }    
        if(startRow <= endRow){
            for(var i = startRow; i <= endRow; i++){
                if(this.grid.store.getAt(i)){
                    this.toggleChecked(i, true);
                    if(!this.email || this.alwaysSelectOnCheck){ this.selectRow(i, true); }
                }
            }
        }
        else{
            for(var i = startRow; i >= endRow; i--){
                if(this.grid.store.getAt(i)){
                    this.toggleChecked(i, true);
                    if(!this.email || this.alwaysSelectOnCheck){ this.selectRow(i, true); }
                }
            }
        }    
    },
    /**
     * private function that is used with the UP arrow keyMap
     */
    selectPreviousChecked : function(keepExisting){
        if(this.hasPrevious()){
            // Select the next row
            this.selectRow(this.last-1, keepExisting);
            // Set the focus
            this.grid.getView().focusRow(this.last);
            if(!this.email){         
                // Check the current (selected) row
                this.toggleChecked(this.last, true);
                // Uncheck all other rows
                this.selectAllChecked(false, this.last);
            }
            return true;
        }
        return false;
    },
    /**
     * private function that is used with the DOWN arrow keyMap
     */      
    selectNextChecked : function(keepExisting){
        if(this.hasNext()){
            // Select the next row
            if(!this.email){ this.selectRow(this.last+1, keepExisting); }
            // Set the focus
            this.grid.getView().focusRow(this.last);
            if(!this.email){      
                // Check the current (selected) row
                this.toggleChecked(this.last, true);
                // Uncheck all other rows
                this.selectAllChecked(false, this.last);
            }
            return true;
        }
        return false;
    },    
   
    /**
     * private function that executes when you click on any row
     * will keep other row selections active as you click around
     */
    handleMouseDown : function(g, rowIndex, e){
        var t = e.getTarget('.ux-row-action-item');
        if(!t) {
            if(e.button !== 0 || this.isLocked()){
                return;
            };
            var view = this.grid.getView();
            var record = this.grid.store.getAt(rowIndex);
            if(e.shiftKey && this.last !== false){
                var last = this.last;
                this.selectRange(last, rowIndex, e.ctrlKey);
                if(!this.email){ this.selectRangeChecked(last, rowIndex, e.ctrlKey); }
                this.last = last; // reset the last
                view.focusRow(rowIndex);
            }else{
                var isChecked = record.data[this.dataIndex];
                var isSelected = this.isSelected(rowIndex);
                
                if (isSelected){
                    this.deselectRow(rowIndex);
                    if(!this.email){ this.toggleChecked(rowIndex, false); }
                }else{
                    if(!this.excel){
                        this.selectRow(rowIndex, true);
                        if(!this.email){ 
                            this.toggleChecked(rowIndex, true);
                        }
                    }
                    else{
                        this.selectRow(rowIndex, e.ctrlKey);
                        if(!this.email){
                            this.selectRangeChecked(rowIndex, rowIndex, e.ctrlKey);
                        }
                    }
                    view.focusRow(rowIndex);
                }
            }
        }
    },
    /**
     * private function restricted to execute when you click a checkbox itself
     */
    onMouseDown : function(e, t){
        if(t.className && t.className.indexOf('x-grid3-cc-'+this.id) != -1){
            e.stopEvent();
            // Define variables
            var view = this.grid.getView();
            var rowIndex = view.findRowIndex(t);
            var record = this.grid.store.getAt(rowIndex);            
            var isSelected = this.isSelected(rowIndex);
            var isChecked = record.data[this.dataIndex];
            // Logic to select/de-select rows and the checkboxes
            if(!this.email || this.alwaysSelectOnCheck){
                if (isSelected){
                    if(!isChecked && this.alwaysSelectOnCheck){
                        this.toggleChecked(rowIndex, true);
                    }
                    else{
                        this.deselectRow(rowIndex);
                        this.toggleChecked(rowIndex, false);
                    }
                }
                else{
                    this.selectRow(rowIndex, true);
                    this.toggleChecked(rowIndex, true);
                    view.focusRow(rowIndex);
                }
            }
            else{
                if (isChecked){
                    this.toggleChecked(rowIndex, false);
                }
                else{
                    this.toggleChecked(rowIndex, true);
                }
            }
            view.focusRow(rowIndex);
        }
        // Load the state manager
           Ext.state.Manager.setProvider(new Ext.state.CookieProvider());            
           Ext.state.Manager.loaded = true;            
    },
    

    /**
     * private function that executes when you click the checkbox header
     */
    onHdMouseDown : function(e, t){
        if(t.className == 'x-grid3-hd-checker'){
            e.stopEvent();
            var hd = Ext.fly(t.parentNode);
            var isChecked = hd.hasClass('x-grid3-hd-checker-on');
            if(isChecked){
                hd.removeClass('x-grid3-hd-checker-on');
                if(!this.email || this.alwaysSelectOnCheck){ this.clearSelections(); }
                this.clearChecked(true); // the true param enables fast mode
            }else{
                hd.addClass('x-grid3-hd-checker-on');
                if(!this.email || this.alwaysSelectOnCheck){ this.selectAll(); }
                this.selectAllChecked(true);
            }
        }
        // Load the state manager
           Ext.state.Manager.setProvider(new Ext.state.CookieProvider());            
           Ext.state.Manager.loaded = true;            
    },
    
    /**
     * private function that renders the proper checkbox based on your dataIndex variable
     *
     * @param    (varchar)    v        the dataIndex passed into the selectionModel that contains whether a row is checked by default or not
     */
    renderer : function(v, p, record){
        p.css += ' x-grid3-check-col-td'; 
        return '<div class="x-grid3-check-col'+(v?'-on':'')+' x-grid3-cc-'+this.id+'"> </div>';
    }
}); 