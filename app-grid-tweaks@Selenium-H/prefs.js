//Import required libraries
const { Gio, GObject, Gtk, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;//Access to settings from schema
const Me = ExtensionUtils.getCurrentExtension();
const _ = imports.gettext.domain("app-grid-tweaks").gettext;

const SETTINGS_APPLY_DELAY_TIME = 500; 

let settings = null;
let reloadExtensionAfterSomeTime = null;

function init() {

  ExtensionUtils.initTranslations("app-grid-tweaks");
  settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.app-grid-tweaks");
  
}

//Dectect Gnome Version Number
const Config = imports.misc.config;
const [major, minor] = Config.PACKAGE_VERSION.split('.').map(s => Number(s));

function bind_int_value(key, settings, builder) {
	const button = builder.get_object(key);
	settings.bind(key, button, 'value', Gio.SettingsBindFlags.DEFAULT);
}

function bind_combo_box(key, settings, builder) {
	const comboRow = builder.get_object(key);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const enum_key = key;
	comboRow.set_selected(settings.get_enum(enum_key));
	comboRow.connect('notify::selected', () => {
		settings.set_enum(enum_key, comboRow.selected);
	});
}

function bindPrefsSettings(builder, settings){

	bind_int_value('appgrid-max-rows', settings, builder);
	bind_int_value('appgrid-max-columns', settings, builder);
	bind_int_value('appgrid-icon-size', settings, builder);
	bind_int_value('side-padding', settings, builder);
	bind_int_value('app-icon-font-size', settings, builder);
	bind_int_value('open-animation-time', settings, builder);
	bind_int_value('page-switch-animation-time', settings, builder);
	bind_int_value('folder-max-rows', settings, builder);
	bind_int_value('folder-max-columns', settings, builder);
}

function fillPreferencesWindow(window) {
    if (major >= 42) {//Check for Gnome 42 or above
        const Adw = imports.gi.Adw;

//    Create a preferences page and group
    let builder = Gtk.Builder.new();
    builder.add_from_file(`${Me.path}/app_grid.ui`);
    let App_page = builder.get_object('Apps');
    let Folder_page = builder.get_object('Folder');
    
//		bind to settings
		bindPrefsSettings(builder, settings);
    
    window.add(App_page);
    window.add(Folder_page);
    _addHeaderBarRefreshButton(window, settings, builder);
    }
}

function _addHeaderBarRefreshButton(window, settings, builder) {
    // Add headerBar button for menu
    // TODO: is this a 'reliable' method to access the headerbar?
    const page = builder.get_object('Apps');
    const pages_stack = page.get_parent(); // AdwViewStack
    const content_stack = pages_stack.get_parent().get_parent(); // GtkStack
    const preferences = content_stack.get_parent(); // GtkBox
    const headerbar = preferences.get_first_child(); // AdwHeaderBar
    headerbar.pack_start(builder.get_object('refresh_button'));
    headerbar.pack_end(builder.get_object('about_button'));
    
    let refreshButton = builder.get_object('refresh_button');
    refreshButton.connect('clicked', () => {log('clicked')});
    
    const actionGroup = new Gio.SimpleActionGroup();
    window.insert_action_group('prefs', actionGroup);
    
    let preferencesDialogAction = new Gio.SimpleAction({ name: 'preferences'});  
    let helpDialogAction        = new Gio.SimpleAction({ name: 'help'});
    let aboutDialogAction       = new Gio.SimpleAction({ name: 'about'});
    
    actionGroup.add_action(aboutDialogAction);
    actionGroup.add_action(helpDialogAction);
    actionGroup.add_action(preferencesDialogAction);
    
    aboutDialogAction.connect('activate', ()=> {  
      let aboutDialog = new Gtk.AboutDialog({ transient_for: window, modal: true, logo: (new Gtk.Image({ file: Me.dir.get_child('eicon.png').get_path(), pixel_size: 128 })).get_paintable(), program_name: Me.metadata.name, version: Me.metadata.version.toString()+_(Me.metadata.status), comments: _(Me.metadata.comment), license_type: 3 } );
      aboutDialog.get_titlebar().get_title_widget().visible = true;
      aboutDialog.present();      
    });
    
		helpDialogAction.connect('activate', ()=> {
      let dialog    = new Gtk.Dialog({ title: _("Help"), transient_for: window, use_header_bar: true, modal: true });
      let vbox      = new Gtk.Box({ hexpand:true, vexpand: true, valign:Gtk.Align.CENTER, orientation: Gtk.Orientation.VERTICAL });    
      let firstInfo = new Gtk.Label({ justify: 0, use_markup: true, label: _(Me.metadata.description)});  
      vbox.append(firstInfo);
      dialog.get_content_area().append(vbox);  
      dialog.present();  
    });
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
