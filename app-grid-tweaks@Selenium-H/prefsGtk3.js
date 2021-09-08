/*

Version 3.01
============
 
*/

const Config         = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension      = ExtensionUtils.getCurrentExtension();
const Metadata       = Extension.metadata;
const Gio            = imports.gi.Gio;
const GLib           = imports.gi.GLib;
const GObject        = imports.gi.GObject;
const Gtk            = imports.gi.Gtk;
const Lang           = imports.lang;
const _              = imports.gettext.domain("app-grid-tweaks").gettext;

const SETTINGS_APPLY_DELAY_TIME = 500; 

let settings = null;
let reloadExtensionAfterSomeTime = null;

function init() {

  ExtensionUtils.initTranslations("app-grid-tweaks");
  settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.app-grid-tweaks");
  
}

function buildPrefsWidget() {

  let widget = new Prefs_AppGridTweaksExtension();
   
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, ()=> {    
    new ExtensionPreferencesWindow_AppGridTweaksExtension( widget );
    return false;
  });
 
  widget.show_all();  
  return widget;  
  
}

function reloadExtension() {

  if(reloadExtensionAfterSomeTime != null) {
      GLib.source_remove(reloadExtensionAfterSomeTime);
      reloadExtensionAfterSomeTime = null;
  }
 
  
  reloadExtensionAfterSomeTime = GLib.timeout_add(GLib.PRIORITY_DEFAULT, SETTINGS_APPLY_DELAY_TIME, ()=> {
    settings.set_boolean("reload-signal", (settings.get_boolean("reload-signal")) ? false : true ); 
    reloadExtensionAfterSomeTime = null;
  });
    
}

const ExtensionPreferencesWindow_AppGridTweaksExtension = new GObject.Class({

  Name: 'ExtensionPreferencesWindow_AppGridTweaksExtension',

  _init: function( widget ) {
  
    this.toplevel  = widget.get_toplevel();
    this.headerBar = this.toplevel.get_titlebar();
    this.headerBar.custom_title = new Gtk.StackSwitcher({expand:true, halign: Gtk.Align.CENTER, visible: true, stack: widget});
    this.createAppMenu();  
    this.createRefreshButton();  
    
  },
  
  createAppMenu: function( ) {
      
    let preferencesDialogAction = new Gio.SimpleAction({ name: 'app.preferences'});  
    let helpDialogAction        = new Gio.SimpleAction({ name: 'app.help'});
    let aboutDialogAction       = new Gio.SimpleAction({ name: 'app.about'});
    let actionGroup             = new Gio.SimpleActionGroup();
    let menu                    = new Gio.Menu();
    let appMenu                 = new Gtk.PopoverMenu();
    let appMenuButton           = new Gtk.MenuButton({ popover: appMenu, image: new Gtk.Image({ gicon: new Gio.ThemedIcon({ name: "open-menu-symbolic" }), icon_size: Gtk.IconSize.BUTTON, visible: true, }), visible:true});
    
    actionGroup.add_action(aboutDialogAction)
    actionGroup.add_action(helpDialogAction)
    actionGroup.add_action(preferencesDialogAction)

    menu.append(_("Preferences"),               "app.preferences" ); 
    menu.append(_("Help"),                      "app.help"        ); 
    menu.append(_("About")+" App Grid Tweaks ", "app.about"       );
    appMenu.bind_model(menu, "app"); 
        
    this.headerBar.pack_end(appMenuButton);
    this.toplevel.insert_action_group('app', actionGroup);    
    
    preferencesDialogAction.connect('activate', ()=> {
      let dialog                = new Gtk.Dialog({ title: _("Preferences"),transient_for: this.toplevel,use_header_bar: true, modal: true });
      let vbox                  = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin: 30 });    
      this.resetExtensionButton = new ExtensionResetButton_AppGridTweaksExtension(this.toplevel );
      vbox.pack_start(this.resetExtensionButton, false, false, 0);
      dialog.get_content_area().pack_start(vbox, false, false, 0);  
      dialog.show_all();  
    });

    helpDialogAction.connect('activate', ()=> {
      let dialog    = new Gtk.Dialog({ title: _("Help"), transient_for: this.toplevel, use_header_bar: true, modal: true });
      let vbox      = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin: 30 });    
      let firstInfo = new Gtk.Label({ justify: 0, use_markup: true, label: _(Metadata.description)});  
      vbox.pack_start(firstInfo,            false, false, 0);
      dialog.get_content_area().pack_start(vbox, false, false, 0);  
  
      dialog.show_all();  
    });    

    aboutDialogAction.connect('activate', ()=> {  
      let aboutDialog = new Gtk.AboutDialog({ transient_for: this.toplevel, modal: true, logo: (new Gtk.Image({ file: Extension.dir.get_child('eicon.png').get_path(), pixel_size: 128 })).get_pixbuf(), program_name: Extension.metadata.name, version: Extension.metadata.version.toString()+_(Extension.metadata.status), comments: _(Extension.metadata.comment), license_type: 3    } );
      aboutDialog.get_header_bar().get_custom_title().visible = true;
      aboutDialog.show_all();      
    });
    
    appMenu.connect("button-release-event", ()=> {
      appMenu.popdown();
    });
            
  },
  
  createRefreshButton: function() {
  
    let refreshButton = new Gtk.Button({ image: new Gtk.Image({ gicon: new Gio.ThemedIcon({ name: "view-refresh-symbolic" }), icon_size: Gtk.IconSize.BUTTON, visible: true, }), visible:true}); 
    refreshButton.connect('clicked', ()=> {
      reloadExtension();
    });
    this.headerBar.pack_start(refreshButton);

  },  
  
});

const ExtensionResetButton_AppGridTweaksExtension =  new GObject.Class({

  Name: 'ExtensionResetButton_AppGridTweaksExtension',

  _init: function( object ) {
    
    this.resetExtensionButton = new Gtk.Button({label: _("Reset App Grid Tweaks Extension"),halign:Gtk.Align.CENTER});
    this.resetExtensionButton.connect('clicked', ()=> { this.resetExtension( object, null, null ) });    
    return this.resetExtensionButton;
    
  },
  
  resetExtension: function( object, functionToBeCalledAtTheEnd, parameter ) {
  
    let dialog = new Gtk.MessageDialog({ transient_for: object.get_toplevel ? object.get_toplevel() : object, modal: true });  
    dialog.set_default_response(Gtk.ResponseType.OK);
    dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
    dialog.add_button(Gtk.STOCK_OK, Gtk.ResponseType.OK);
    dialog.set_markup("<big><b>"+_("Reset App Grid Tweaks to defaults?")+"</b></big>");
    dialog.get_message_area().pack_start(new Gtk.Label({ wrap: true, justify: 3, use_markup: true, label: _("Resetting the extension will discard the current preferences configuration and restore default one.")}), true, true, 0);
    dialog.connect('response', Lang.bind(this, function(dialog, id) {
      if(id != Gtk.ResponseType.OK) {
        dialog.destroy();  
        return;
      }
  
    settings.reset("open-animation-time");
    settings.reset("close-animation-time");
    settings.reset("page-switch-animation-time");
    settings.reset("appgrid-max-rows");
    settings.reset("appgrid-max-columns");
    settings.reset("appgrid-icon-size");
    settings.reset("app-icon-font-size");
    settings.reset("label-style");
    
    settings.reset("folder-max-rows");
    settings.reset("folder-max-columns");
    settings.reset("folder-icon-size");

    dialog.destroy();
    if(object[functionToBeCalledAtTheEnd]) {
      object[functionToBeCalledAtTheEnd]( parameter );
    }
		
    reloadExtension();
    }));
    
    dialog.show_all();
		
  }, 
	  
});

const Prefs_AppGridTweaksExtension = new GObject.Class({
  Name: 'Prefs_AppGridTweaksExtension',
  Extends: Gtk.Stack,
    
  _init: function() {
  
    this.appGridPrefs    = new PrefsWindowForAppGrid_AppGridTweaksExtension();
    this.folderGridPrefs = new PrefsWindowForFolderGrid_AppGridTweaksExtension();
    
    this.parent({ transition_type: 6, transition_duration: 200 });
    this.add_titled(this.appGridPrefs,    "Apps",   _("Apps"));
    this.add_titled(this.folderGridPrefs, "Folders", _("Folders"));

    this.appGridPrefs.displayPrefs();
    this.folderGridPrefs.displayPrefs();

  }
  
});


const PrefsWindow_AppGridTweaksExtension =  new GObject.Class({
  Name: "PrefsWindow_AppGridTweaksExtension",
  Extends: Gtk.Grid,

  _init: function(page) {
    
    this.parent({ column_spacing: 80, halign: Gtk.Align.CENTER, margin: 20, row_spacing: 20 ,border_width:20});

  },

  attachLabel: function(KEY,pos) {
    let prefLabel = new Gtk.Label({xalign: 1, label: _(settings.settings_schema.get_key(KEY).get_summary()), halign: Gtk.Align.START});
    this.attach(prefLabel,0,pos,1,1);
  },

  prefCombo: function(KEY, pos, options, items) {
  
    let SettingCombo = new Gtk.ComboBoxText();
    for (let i = 0; i < options.length; i++) {
      SettingCombo.append(options[i],  items[i]);
    }
    SettingCombo.set_active(options.indexOf(settings.get_string(KEY)));
    SettingCombo.connect('changed', Lang.bind(this, function(widget) {
      settings.set_string(KEY, options[widget.get_active()]);
      reloadExtension();
    }));
    
    this.attachLabel(KEY,pos);
    this.attach(SettingCombo, 1, pos, 1, 1);
    
  },

  prefDouble: function(KEY, pos, mn, mx, st) {
  
    let timeSetting = Gtk.SpinButton.new_with_range(mn, mx, st);
    timeSetting.set_value(settings.get_double(KEY));
    timeSetting.connect('notify::value', function(spin) {
      settings.set_double(KEY,spin.get_value());
    });

    this.attachLabel(KEY,pos);
    this.attach(timeSetting, 1, pos, 1, 1);
    
  },
   
  prefTime: function(KEY, pos, mn, mx, st) {
  
    let timeSetting = Gtk.SpinButton.new_with_range(mn, mx, st);
    timeSetting.set_value(settings.get_int(KEY));
    timeSetting.connect('notify::value', function(spin) {
      settings.set_int(KEY,spin.get_value_as_int());
    });

    this.attachLabel(KEY,pos);
    this.attach(timeSetting, 1, pos, 1, 1);
    
  },

});

const PrefsWindowForAppGrid_AppGridTweaksExtension =  new GObject.Class({
  Name: "PrefsWindowForAppGrid_AppGridTweaksExtension",
  Extends: PrefsWindow_AppGridTweaksExtension,
  
  _init: function(){
  
    this.parent();
  
  },
  
  displayPrefs: function() {
  
    let pos = 0;
    this.prefTime("appgrid-max-rows",           pos++, 1,  20,    1  );
    this.prefTime("appgrid-max-columns",        pos++, 1,  20,    1  );
    this.prefTime("appgrid-icon-size",          pos++, 32, 256,   1  );
    this.prefDouble("app-icon-font-size",       pos++, 0,  20,    0.1);    
    this.prefCombo("label-style",               pos++, [ "font-weight: normal;", "font-weight: normal; text-shadow: 2px 3px 3px #000000, 2px 3px 3px #000000;", "font-weight: bold;", "font-weight: bold; text-shadow: 2px 3px 3px #000000, 2px 3px 3px #000000;" ], [ _("Normal"), _("Normal with Shadow"), _("Bold"), _("Bold with Shadow") ] );        
    this.prefTime("open-animation-time",        pos++, 1,  10000, 1  );
    this.prefTime("close-animation-time",       pos++, 1,  10000, 1  );
    this.prefTime("page-switch-animation-time", pos++, 1,  10000, 1  );
 
  },
  
});

const PrefsWindowForFolderGrid_AppGridTweaksExtension =  new GObject.Class({
  Name: "PrefsWindowForFolderGrid_AppGridTweaksExtension",
  Extends: PrefsWindow_AppGridTweaksExtension,
  
  _init: function(){
  
    this.parent();
  
  },
  
  displayPrefs: function() {
  
    let pos = 0;
    this.prefTime  ("folder-max-rows",    pos++, 1,  20,  1);
    this.prefTime  ("folder-max-columns", pos++, 1,  20,  1);
    //this.prefTime  ("folder-icon-size",   pos++, 16, 512, 1);
    
  },
  
});
