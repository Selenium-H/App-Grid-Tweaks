const GLib = imports.gi.GLib;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

function init() {
    if (Config.PACKAGE_VERSION >= '40') {
        Extension.imports.prefsAdw.init();
    } else {
    		Extension.imports.prefsGtk3;
    }
}

function fillPreferencesWindow(window) {
    Extension.imports.prefsAdw.fillPreferencesWindow(window);
}

function buildPrefsWidget() {
    // something for gnome 3.xx
    gtkVersion = Extension.imports.prefsGtk3;
    gtkVersion.init();
    let widget = new gtkVersion.Prefs_AppGridTweaksExtension();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, ()=> {
	  new gtkVersion.ExtensionPreferencesWindow_AppGridTweaksExtension( widget );
    	    return false;
    });
    widget.show_all();
}
