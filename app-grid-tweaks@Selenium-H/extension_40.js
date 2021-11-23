/*

Version 3.03
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
 
    [this.iconSize, this.fRows, this.fColumns, this.sidePadding, OverviewControls.SIDE_CONTROLS_ANIMATION_TIME, IconGrid.PAGE_SWITCH_TIME] = [this.prefs.get_int("appgrid-icon-size"), this.prefs.get_int("folder-max-rows"), this.prefs.get_int("folder-max-columns"), this.prefs.get_int("side-padding"), this.prefs.get_int("open-animation-time"), this.prefs.get_int("page-switch-animation-time")];
    [IconGrid.IconSize.LARGE, IconGrid.IconSize.MEDIUM, IconGrid.IconSize.SMALL, IconGrid.IconSize.TINY] = [this.iconSize, this.iconSize, this.iconSize, this.iconSize];

    let appGrid = MainAppDisplay._grid; 
    appGrid.style = "font-size: "+this.prefs.get_double("app-icon-font-size")+"px;"+this.prefs.get_string("label-style");  
    appGrid = appGrid._gridModes;
    [appGrid[0].rows, appGrid[0].columns] = [this.prefs.get_int("appgrid-max-rows"), this.prefs.get_int("appgrid-max-columns")];
      
    this.defaultAdaptToSizeFunction = MainAppDisplay.adaptToSize;
    MainAppDisplay.adaptToSize = this.overriddenAdaptToSizeFunction;     

    if(MainAppDisplay._folderIcons.length > 0) {
      this.applyFolderViewChanges();
    }
     
    this.reloadingSig = MainAppDisplay.connect("view-loaded", ()=> {
      this.applyFolderViewChanges();  
    });   
  
    MainAppDisplay._redisplay();

  }
  
  undoChanges() {
    
    let appGridModes = MainAppDisplay._grid._gridModes; 
    MainAppDisplay.disconnect(this.reloadingSig);
    MainAppDisplay.adaptToSize = this.defaultAdaptToSizeFunction;  
    [IconGrid.IconSize.LARGE, IconGrid.IconSize.MEDIUM, IconGrid.IconSize.SMALL, IconGrid.IconSize.TINY, OverviewControls.SIDE_CONTROLS_ANIMATION_TIME, IconGrid.PAGE_SWITCH_TIME, appGridModes[0].rows, appGridModes[0].columns] = [96, 64, 32, 16, 250, 300, 8, 3];

    MainAppDisplay._folderIcons.forEach(icon => {
      icon.view._grid.layout_manager.rows_per_page    = 3;
      icon.view._grid.layout_manager.columns_per_page = 3;
      icon._ensureFolderDialog();
      icon._dialog._popdownCallbacks = [];
      icon._dialog.child.style = "";
      icon.view._redisplay();
    });
    MainAppDisplay._grid.style = "";   
    MainAppDisplay._redisplay();   
    
  }
  
  overriddenAdaptToSizeFunction(width, height) {

    const [, indicatorHeight] = this._pageIndicators.get_preferred_height(-1);
    height -= indicatorHeight;
 
    MainAppDisplay._grid._currentMode = 0; 
    MainAppDisplay._grid.layout_manager.rows_per_page = MainAppDisplay._grid._gridModes[0].rows;
    MainAppDisplay._grid.layout_manager.columns_per_page = MainAppDisplay._grid._gridModes[0].columns;

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
    let padding    = appGridTweaker.sidePadding;
    let pageWidth  = availWidth-padding*2;

    MainAppDisplay._grid.layout_manager._pageWidth--; // MainAppDisplay._grid.adaptToSize(pageWidth, pageHeight) only executes when page width is changed. This is done to update Iconsize.
    MainAppDisplay._grid.adaptToSize(pageWidth, pageHeight);

    const leftPadding = padding;
    const rightPadding = padding;
    const topPadding = Math.floor((availHeight - MainAppDisplay._grid.layout_manager.pageHeight) / 2);
    const bottomPadding = Math.ceil((availHeight - MainAppDisplay._grid.layout_manager.pageHeight) / 2);

    MainAppDisplay._scrollView.content_padding = new Clutter.Margin({
      left: leftPadding,
      right: rightPadding,
      top: topPadding,
      bottom: bottomPadding,
    });

    MainAppDisplay._availWidth = availWidth;
    MainAppDisplay._availHeight = availHeight;

    MainAppDisplay._pageIndicatorOffset = leftPadding;
    MainAppDisplay._pageArrowOffset = Math.max(leftPadding - 80/*PAGE_PREVIEW_MAX_ARROW_OFFSET*/, 0);
  
  }  
    
}
