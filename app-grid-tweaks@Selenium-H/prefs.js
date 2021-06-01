/*

Version 2.01
============
 
*/

const Config            = imports.misc.config;
const Extension         = imports.misc.extensionUtils.getCurrentExtension();
const GLib              = imports.gi.GLib;

function init() {
}

function buildPrefsWidget() {

  const gtkVersion = (Config.PACKAGE_VERSION >= "40") ? Extension.imports.prefsGtk4 : Extension.imports.prefsGtk3;
  gtkVersion.init();
  let widget = new gtkVersion.Prefs_AppGridTweaksExtension();   
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, ()=> {    
    new gtkVersion.ExtensionPreferencesWindow_AppGridTweaksExtension( widget );
    return false;
  });
 
  (Config.PACKAGE_VERSION >= "40") ? null : widget.show_all();  
  return widget;  
  
}

