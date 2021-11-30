/*

Version 3.04
============
 
*/

const Clutter          = imports.gi.Clutter;
const IconGrid         = imports.ui.iconGrid;
const MainAppDisplay   = imports.ui.main.overview._overview._controls._appDisplay;
const OverviewControls = imports.ui.overviewControls; 

let appGridTweaker = null;

function enable(extensionPrefs) {

  appGridTweaker = new AppGridTweaks(extensionPrefs);
  appGridTweaker.startAppGridTweaks();
  // Reloads the Extension when preferences are changed.
  appGridTweaker.reloadSignal = appGridTweaker.prefs.connect("changed::reload-signal", () => {
    appGridTweaker.undoChanges();
    appGridTweaker.startAppGridTweaks();
  });

}

function disable() {

  appGridTweaker.undoChanges();
  appGridTweaker.prefs.run_dispose();

}

class AppGridTweaks {

  constructor(extensionPrefs) {
  
    this.prefs = extensionPrefs;
    
  }

  applyFolderViewChanges() {
  
    MainAppDisplay._folderIcons.forEach(icon => {
      icon.view._grid.layout_manager.rows_per_page = (Math.ceil(icon.view._appIds.length/this.fColumns) < this.fRows)? Math.ceil(icon.view._appIds.length/this.fColumns): this.fRows;
      icon.view._grid.layout_manager.columns_per_page = (icon.view._appIds.length > this.fColumns) ? this.fColumns : icon.view._appIds.length ;
      icon._ensureFolderDialog();
      icon._dialog._popdownCallbacks = [];   
      icon._dialog.child.style = "height: "+(icon.view._grid.layout_manager.rows_per_page*(this.iconSize+72)+152)+"px; width: "+Math.max(icon.view._grid.layout_manager.columns_per_page*(this.iconSize+78)+202, 640)+"px;";
      icon.view._redisplay();
    });  
  
  }

  startAppGridTweaks() {
 
    let appGrid = MainAppDisplay._grid;
    
    [appGrid.style, appGrid._gridModes[0].rows, appGrid._gridModes[0].columns, this.iconSize, this.fRows, this.fColumns, this.sidePadding, OverviewControls.SIDE_CONTROLS_ANIMATION_TIME, IconGrid.PAGE_SWITCH_TIME] = ["font-size: "+this.prefs.get_double("app-icon-font-size")+"px;"+this.prefs.get_string("label-style"), this.prefs.get_int("appgrid-max-rows"), this.prefs.get_int("appgrid-max-columns"), this.prefs.get_int("appgrid-icon-size"), this.prefs.get_int("folder-max-rows"), this.prefs.get_int("folder-max-columns"), this.prefs.get_int("side-padding"), this.prefs.get_int("open-animation-time"), this.prefs.get_int("page-switch-animation-time")];       
    [IconGrid.IconSize.LARGE, IconGrid.IconSize.MEDIUM, IconGrid.IconSize.SMALL, IconGrid.IconSize.TINY] = [this.iconSize, this.iconSize, this.iconSize, this.iconSize];   
      
    this.defaultAdaptToSizeFunction = MainAppDisplay.adaptToSize;
    MainAppDisplay.adaptToSize = this.overriddenAdaptToSizeFunction;     

    if(MainAppDisplay._folderIcons.length > 0) {
      this.applyFolderViewChanges();
    }
     
    this.reloadingSig = MainAppDisplay.connect("view-loaded", ()=> {
      this.applyFolderViewChanges();  
      this.updatePages();
    });   

    appGrid._currentMode = 0; 
    appGrid.layout_manager.rows_per_page    = appGrid._gridModes[0].rows;
    appGrid.layout_manager.columns_per_page = appGrid._gridModes[0].columns;
    appGrid.layout_manager.rowsPerPage      = appGrid._gridModes[0].rows;
    appGrid.layout_manager.columnsPerPage   = appGrid._gridModes[0].columns;
    if(appGrid.layout_manager._iconSize != this.iconSize) {
      appGrid.layout_manager._pageWidth--; // To trigger execution of MainAppDisplay._grid.adaptToSize(pageWidth, pageHeight) which only executes when page width is changed. This is done to update Iconsize.
    }
    
    this.updatePages();
    MainAppDisplay._redisplay();

  }
  
  updatePages() {  
  
    for(let i = 0; i < MainAppDisplay._grid.layout_manager._pages.length; i++)
      MainAppDisplay._grid.layout_manager._fillItemVacancies(i);   
    MainAppDisplay._grid.layout_manager._updatePages();
    for(let i = 0; i < MainAppDisplay._grid.layout_manager._pages.length; i++)
      MainAppDisplay._grid.layout_manager._fillItemVacancies(i);
      
  }
  
  undoChanges() {
    
    let appGrid = MainAppDisplay._grid; 
    appGrid.layout_manager._pageWidth--;
    MainAppDisplay.disconnect(this.reloadingSig);
    MainAppDisplay.adaptToSize = this.defaultAdaptToSizeFunction;  
    [IconGrid.IconSize.LARGE, IconGrid.IconSize.MEDIUM, IconGrid.IconSize.SMALL, IconGrid.IconSize.TINY, OverviewControls.SIDE_CONTROLS_ANIMATION_TIME, IconGrid.PAGE_SWITCH_TIME, appGrid._gridModes[0].rows, appGrid._gridModes[0].columns] = [96, 64, 32, 16, 250, 300, 8, 3];
    MainAppDisplay.adaptToSize(appGrid.layout_manager._pageWidth, appGrid.layout_manager._pageHeight);
    MainAppDisplay._folderIcons.forEach(icon => {
      icon.view._grid.layout_manager.rows_per_page    = 3;
      icon.view._grid.layout_manager.columns_per_page = 3;
      icon._ensureFolderDialog();
      icon._dialog._popdownCallbacks = [];
      icon._dialog.child.style = "";
      icon.view._redisplay();
    });
    appGrid.style = "";   
    this.updatePages();  
    MainAppDisplay._redisplay(); 
    
  }
  
  overriddenAdaptToSizeFunction(width, height) {

    const [, indicatorHeight] = this._pageIndicators.get_preferred_height(-1);
    height -= indicatorHeight;
 
    let box = new Clutter.ActorBox({
      x2: width,
      y2: height,
    });
    
    box = MainAppDisplay.get_theme_node().get_content_box(box);
    box = MainAppDisplay._scrollView.get_theme_node().get_content_box(box);
    box = MainAppDisplay._grid.get_theme_node().get_content_box(box);

    const availWidth = box.get_width();
    const availHeight = box.get_height();

    let pageHeight = availHeight;
    let hPadding   = appGridTweaker.sidePadding;
    let pageWidth  = availWidth-hPadding*2;

    MainAppDisplay._grid.adaptToSize(pageWidth, pageHeight);

    const vPadding = Math.floor((availHeight - MainAppDisplay._grid.layout_manager.pageHeight) / 2);

    MainAppDisplay._scrollView.content_padding = new Clutter.Margin({
      left: hPadding,
      right: hPadding,
      top: vPadding,
      bottom: vPadding,
    });

    MainAppDisplay._availWidth = availWidth;
    MainAppDisplay._availHeight = availHeight;

    MainAppDisplay._pageIndicatorOffset = hPadding;
    MainAppDisplay._pageArrowOffset = Math.max(hPadding - 80/*PAGE_PREVIEW_MAX_ARROW_OFFSET*/, 0);
  
  }  
    
}
