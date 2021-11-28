/*
Version 3.04
============
 
*/

const IconGrid            = imports.ui.iconGrid;
const MainAppDisplay      = imports.ui.main.overview.viewSelector.appDisplay;

let appGridTweaker = null;

function enable(extensionPrefs) {

  appGridTweaker = new AppGridTweaks(extensionPrefs);
  appGridTweaker.startAppGridTweaks();
  reloadExtensionOnPrefsChange();

}

function disable() {

  appGridTweaker.undoChanges();
  appGridTweaker.prefs.run_dispose();

}

function reloadExtensionOnPrefsChange() {

  // Reloads the Extension when preferences are changed.
  appGridTweaker.reloadSignal = appGridTweaker.prefs.connect("changed::reload-signal", () => {
    appGridTweaker.undoChanges();
    appGridTweaker.startAppGridTweaks();
  });

}

class AppGridTweaks {

  constructor(extensionPrefs) {
  
    this.prefs = extensionPrefs;
    
  }

  applyFolderViewChanges() {
  
    MainAppDisplay._folderIcons.forEach(icon => {
      icon.view._grid.layout_manager.rows_per_page = (Math.ceil(icon.view._appIds.length/this.fColumns) < this.fRows)? Math.ceil(icon.view._appIds.length/this.fColumns): this.fRows;
      icon.view._grid.layout_manager.columns_per_page = (icon.view._appIds.length > this.fColumns) ? this.fColumns : icon.view._appIds.length ;
      icon.view._grid.layout_manager.fixed_icon_size = this.iconSize;
      icon._ensureFolderDialog();
      icon._dialog._popdownCallbacks = [];   
      icon._dialog.child.style = "height: "+(icon.view._grid.layout_manager.rows_per_page*(this.iconSize+72)+152)+"px; width: "+Math.max(icon.view._grid.layout_manager.columns_per_page*(this.iconSize+78)+202, 640)+"px;";
      icon.view._redisplay();
    });  
  
  }

  startAppGridTweaks() {

    this.gridMode   = MainAppDisplay._grid._gridModes;
    this.maxRows    = MainAppDisplay._grid.layout_manager.rows_per_page;
    this.maxColumns = MainAppDisplay._grid.layout_manager.columns_per_page;    
    MainAppDisplay._grid._gridModes = 0;   

    this.iconSize = this.prefs.get_int("appgrid-icon-size");
    this.fRows = this.prefs.get_int("folder-max-rows"); 
    this.fColumns = this.prefs.get_int("folder-max-columns"); 
    
    IconGrid.ANIMATION_TIME_IN  = this.prefs.get_int("open-animation-time");
    IconGrid.ANIMATION_TIME_OUT = this.prefs.get_int("close-animation-time");
    IconGrid.PAGE_SWITCH_TIME = this.prefs.get_int("page-switch-animation-time");
    
    MainAppDisplay._grid.style = "column-spacing: "+this.iconSize*0.35+"px; row-spacing: "+this.iconSize*0.35+"px; font-size: "+this.prefs.get_double("app-icon-font-size")+"px;"+this.prefs.get_string("label-style"); 
    MainAppDisplay._grid.layout_manager.rows_per_page = this.prefs.get_int("appgrid-max-rows");
    MainAppDisplay._grid.layout_manager.columns_per_page = this.prefs.get_int("appgrid-max-columns"); 
    MainAppDisplay._grid.layout_manager.fixed_icon_size = this.iconSize;
    for (const appIcon of MainAppDisplay._grid.layout_manager._container) {
      appIcon.icon.setIconSize(this.iconSize);
    }      
    if(MainAppDisplay._folderIcons.length > 0) {
      this.applyFolderViewChanges();
    }
    this.reloadingSig = MainAppDisplay.connect("view-loaded", ()=> {
      this.applyFolderViewChanges();
    });    
    MainAppDisplay._redisplay();

  }
  
  undoChanges() {
  
    IconGrid.ANIMATION_TIME_IN  = 350;
    IconGrid.ANIMATION_TIME_OUT = 175;
    IconGrid.PAGE_SWITCH_TIME   = 300;
    
    MainAppDisplay._grid._gridModes = this.gridMode;
    MainAppDisplay._grid.layout_manager.rows_per_page = this.maxRows;
    MainAppDisplay._grid.layout_manager.columns_per_page = this.maxColumns; 
    MainAppDisplay._grid.layout_manager.fixed_icon_size = -1;
    this.iconSize = MainAppDisplay._grid.layout_manager._findBestIconSize();
    for (const appIcon of MainAppDisplay._grid.layout_manager._container) {
      appIcon.icon.setIconSize(this.iconSize); 
    }

    MainAppDisplay.disconnect(this.reloadingSig);
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

