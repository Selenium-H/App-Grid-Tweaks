/*

Version 1.01
============
 
*/

const ExtensionUtils = imports.misc.extensionUtils;
const IconGrid       = imports.ui.iconGrid;
const MainAppDisplay = imports.ui.main.overview.viewSelector.appDisplay;

let appGridTweaker = null;

function enable() {

  appGridTweaker = new AppGridTweaks();
  appGridTweaker.startAppGridTweaks();
  reloadExtensionOnPrefsChange();

}

function disable() {

  appGridTweaker.undoChanges();

}

function reloadExtensionOnPrefsChange() {

  // Reloads the Extension when preferences are changed.
  appGridTweaker.reloadSignal = appGridTweaker.prefs.connect("changed::reload-signal", () => {
    disable();
    enable();
  });

}

class AppGridTweaks {

  constructor() {
  
    this.prefs      = ExtensionUtils.getSettings("org.gnome.shell.extensions.app-grid-tweaks");    
    this.gridMode   = MainAppDisplay._grid._gridModes;
    this.maxRows    = MainAppDisplay._grid.layout_manager.rows_per_page;
    this.maxColumns = MainAppDisplay._grid.layout_manager.columns_per_page;    
    MainAppDisplay._grid._gridModes = 0;   
    
  }

  applyFolderViewChanges() {
  
    MainAppDisplay._folderIcons.forEach(icon => {
      icon.view._grid.layout_manager.rows_per_page = (Math.ceil(icon.view._appIds.length/this.fColumns) < this.fRows)? Math.ceil(icon.view._appIds.length/this.fColumns): this.fRows;
      icon.view._grid.layout_manager.columns_per_page = (icon.view._appIds.length > this.fColumns) ? this.fColumns : icon.view._appIds.length ;
      icon.view._grid.layout_manager.fixed_icon_size = this.iconSize;
      icon._ensureFolderDialog();
      icon._dialog._popdownCallbacks = [];        
      icon._dialog.child.style = "height: "+(172+(icon.view._grid.layout_manager.rows_per_page*(this.iconSize+60)))+"px; width: "+Math.max((172+(icon.view._grid.layout_manager.columns_per_page*(this.iconSize+60))), 640)+"px;";
      icon.view._redisplay();
    });  
  
  }

  startAppGridTweaks() {

    this.iconSize = this.prefs.get_int("appgrid-icon-size");
    this.fRows = this.prefs.get_int("folder-max-rows"); 
    this.fColumns = this.prefs.get_int("folder-max-columns"); 
    
    IconGrid.ANIMATION_TIME_IN  = this.prefs.get_int("open-animation-time");
    IconGrid.ANIMATION_TIME_OUT = this.prefs.get_int("close-animation-time");
    IconGrid.PAGE_SWITCH_TIME   = this.prefs.get_int("page-switch-animation-time");

    MainAppDisplay._grid.style = "column-spacing: "+this.iconSize*0.35+"px; row-spacing: "+this.iconSize*0.35+"px; font-size: "+this.prefs.get_double("app-icon-font-size")+"px;";
    MainAppDisplay._grid.layout_manager.rows_per_page = this.prefs.get_int("appgrid-max-rows");
    MainAppDisplay._grid.layout_manager.columns_per_page = this.prefs.get_int("appgrid-max-columns"); 
    MainAppDisplay._grid.layout_manager.fixed_icon_size = this.iconSize;
    for (const appIcon of MainAppDisplay._grid.layout_manager._container) {
      appIcon.icon.setIconSize(this.iconSize);
    }      
      
    this.oneTimeSig = (MainAppDisplay._folderIcons.length > 0) ? this.applyFolderViewChanges() : MainAppDisplay.connect("view-loaded", ()=> {
      MainAppDisplay._grid.disconnect(this.oneTimeSig); 
      this.applyFolderViewChanges();
    });

  }
  
  undoChanges() {
  
    IconGrid.ANIMATION_TIME_IN  = 350;
    IconGrid.ANIMATION_TIME_OUT = 175;
    IconGrid.PAGE_SWITCH_TIME   = 300;
    
    MainAppDisplay._grid._gridModes = this.gridMode;
    MainAppDisplay._grid.layout_manager.rows_per_page = this.maxRows;
    MainAppDisplay._grid.layout_manager.columns_per_page = this.maxColumns; 
    MainAppDisplay._grid.layout_manager.fixed_icon_size = -1;
    MainAppDisplay._scrollView.style = "";
    this.iconSize = MainAppDisplay._grid.layout_manager._findBestIconSize();
    for (const appIcon of MainAppDisplay._grid.layout_manager._container) {
      appIcon.icon.setIconSize(this.iconSize); 
    }

    MainAppDisplay._folderIcons.forEach(icon => {
      icon.view._grid.layout_manager.rows_per_page    = 3;
      icon.view._grid.layout_manager.columns_per_page = 3;
      icon.view._grid.layout_manager.fixed_icon_size = this.iconSize;
      icon._ensureFolderDialog();
      icon._dialog._popdownCallbacks = [];
      icon._dialog.child.style = "";
      icon.view._redisplay();
    });
    MainAppDisplay._grid.style = "";
    
  }
   
}
