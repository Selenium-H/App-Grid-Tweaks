const { Adw, Gio, GLib, GObject, Gtk } = imports.gi;
const Utils = imports.misc.extensionUtils;
const Gettext = imports.gettext;
const Extension = Utils.getCurrentExtension();
const Metadata = Extension.metadata;

const Domain = Gettext.domain('app-grid-tweaks');
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

function init() {
    Utils.initTranslations('app-grid-tweaks');
}

const SETTINGS_APPLY_DELAY_TIME = 500;

class PrefsWindow {
    constructor(window) {
        this.window = window;
        this.settings = Utils.getSettings(Metadata['settings-schema']);
    }

    // create a new Adw.PreferencesPage and add it into this.window
    create_page(title, icon) {
        let page = new Adw.PreferencesPage({
            title: title,
            icon_name: icon,
        });
        this.window.add(page);

        // get the headerbar
        if (!this.headerbar) {
            let pages_stack = page.get_parent(); // AdwViewStack
            let content_stack = pages_stack.get_parent().get_parent(); // GtkStack
            let preferences = content_stack.get_parent(); // GtkBox
            this.headerbar = preferences.get_first_child(); // AdwHeaderBar
        }

        return page;
    }

    // create a new Adw.PreferencesGroup and add it to a prefsPage
    create_group(page, title) {
        let group = new Adw.PreferencesGroup();
        page.add(group);
        return group;
    }

    // create a new Adw.ActionRow to insert an option into a prefsGroup
    append_row(group, title, widget) {
        let row = new Adw.ActionRow({
            title: title,
        });
        group.add(row);
        row.add_suffix(widget);
        row.activatable_widget = widget;
    }

    // create a new Gtk.SpinButton and insert it into a prefsGroup
    append_spin_button(group, is_double, key, min, max, step) {
        let v = 0;
        if (is_double) {
            v = this.settings.get_double(key);
        } else {
            v = this.settings.get_int(key);
        }
        let spin = Gtk.SpinButton.new_with_range(min, max, step);
        spin.set_value(v);
        this.settings.bind(key, spin, 'value', Gio.SettingsBindFlags.DEFAULT);
        this.append_row(group, _(this.settings.settings_schema.get_key(key).get_summary()), spin);
    }

    // create a new Gtk.ComboBoxText and insert it into a prefsGroup
    append_combo_text(group, key, options, items) {
        let combo = new Gtk.ComboBoxText();
        for (let i = 0; i < options.length; i++) {
            combo.append(options[i], items[i]);
        }
        combo.set_active(options.indexOf(this.settings.get_string(key)));
        // this.settings.bind(key, combo, 'active', Gio.SettingsBindFlags.DEFAULT);
        combo.connect('changed', () => {
            this.settings.set_string(key, options[combo.get_active()]);
            this.reloadExtension();
        });
        this.append_row(group,_(this.settings.settings_schema.get_key(key).get_summary()), combo);
    		}

    resetToDefault(){
			this.settings.reset("open-animation-time");
	    this.settings.reset("close-animation-time");
	    this.settings.reset("page-switch-animation-time");
	    this.settings.reset("appgrid-max-rows");
	    this.settings.reset("appgrid-max-columns");
	    this.settings.reset("appgrid-icon-size");
	    this.settings.reset("app-icon-font-size");
	    this.settings.reset("label-style");
    
	    this.settings.reset("folder-max-rows");
	    this.settings.reset("folder-max-columns");
	    this.settings.reset("folder-icon-size");
    }
    
    reloadExtension(){
    	GLib.timeout_add(SETTINGS_APPLY_DELAY_TIME, GLib.PRIORITY_DEFAULT, () => {
      	this.settings.set_boolean("reload-signal", (this.settings.get_boolean("reload-signal")) ? false : true); 
        return false;
    	});
    }
    
    openHelpDialog(){
    	let dialog    = new Gtk.Dialog({ title: _("Help"), transient_for: this.window, use_header_bar: true, modal: true });
      let vbox      = new Gtk.Box({ hexpand:true, vexpand: true, valign:Gtk.Align.CENTER, orientation: Gtk.Orientation.VERTICAL });    
      let firstInfo = new Gtk.Label({ justify: 0, use_markup: true, label: _(Metadata.description)});  
      vbox.append(firstInfo);
      dialog.get_content_area().append(vbox);  
      dialog.present();
    }
    
    openAboutDialog(){
    	let aboutDialog = new Gtk.AboutDialog({ transient_for: this.window, modal: true, logo: (new Gtk.Image({ file: Extension.dir.get_child('eicon.png').get_path(), pixel_size: 128 })).get_paintable(), program_name: Extension.metadata.name, version: Extension.metadata.version.toString()+_(Extension.metadata.status), comments: _(Extension.metadata.comment), license_type: 3 } );
    	aboutDialog.get_titlebar().get_title_widget().visible = true;
    	aboutDialog.present();
    }

    fillPreferencesWindow() {
        // AppGridSettingsPage
        let page_grid = this.create_page(_('Apps'), 'view-app-grid-symbolic');
        {
            let group_grid = this.create_group(page_grid, _('Apps'));
            this.append_spin_button(group_grid, false, 'appgrid-max-rows', 1, 20, 1);
            this.append_spin_button(group_grid, false, 'appgrid-max-columns', 1, 20, 1);
            this.append_spin_button(group_grid, false, 'appgrid-icon-size', 32, 256, 1);
            this.append_spin_button(group_grid, false, 'side-padding', 0, 256, 1);
            this.append_spin_button(group_grid, true, 'app-icon-font-size', 0, 20, 0.1);
            this.append_combo_text( group_grid, "label-style", [ "font-weight: normal;", "font-weight: normal; text-shadow: 2px 3px 3px #000000, 2px 3px 3px #000000;", "font-weight: bold;", "font-weight: bold; text-shadow: 2px 3px 3px #000000, 2px 3px 3px #000000;" ], [ _("Normal"), _("Normal with Shadow"), _("Bold"), _("Bold with Shadow") ] );
            this.append_spin_button(group_grid, false, 'open-animation-time', 1, 10000, 1);
            this.append_spin_button(group_grid, false, 'page-switch-animation-time', 1, 10000, 1);
        }

        // FolderSettingsPage
        let page_folder = this.create_page(_('Folders'), 'folder-symbolic');
        {
            let group_folder = this.create_group(page_folder, _('Folders'));
            this.append_spin_button(group_folder, false, 'folder-max-rows', 1, 20, 1);
            this.append_spin_button(group_folder, false, 'folder-max-columns', 1, 20, 1);
        }

        // left HeaderBar button
        let btn = new Gtk.Button({
            icon_name: 'view-refresh-symbolic',
        });
        btn.connect('clicked', () => {
					this.reloadExtension();
        });
        this.headerbar.pack_start(btn);
        
        // right HeaderBar Button
        let preferencesDialogAction = new Gio.SimpleAction({ name: 'preferences'});  
    		let helpDialogAction        = new Gio.SimpleAction({ name: 'help'});
    		let aboutDialogAction       = new Gio.SimpleAction({ name: 'about'});
    		let actionGroup             = new Gio.SimpleActionGroup();
    		let menu                    = new Gio.Menu();
    		let appMenu                 = Gtk.PopoverMenu.new_from_model(menu);
    		let appMenuButton           = new Gtk.MenuButton({ popover: appMenu, icon_name: "open-menu-symbolic", visible:true});

    		menu.append(_("Reset To Default"),               "prefswindow.preferences");
    		menu.append(_("Help"),                      "prefswindow.help"       );
    		menu.append(_("About")+" App Grid Tweaks", "prefswindow.about"      );
    
    		actionGroup.add_action(aboutDialogAction);
    		actionGroup.add_action(helpDialogAction);
    		actionGroup.add_action(preferencesDialogAction);
    
    		this.window.insert_action_group('prefswindow', actionGroup);    
    		this.headerbar.pack_end(appMenuButton);
    		
    		aboutDialogAction.connect('activate', ()=> {
					this.openAboutDialog();
    		});
    		
    		helpDialogAction.connect('activate', ()=> {
  				this.openHelpDialog();
    		});
    		
    		preferencesDialogAction.connect('activate', ()=> {
    			this.resetToDefault();
					this.reloadExtension();
    		});
    }
}

function fillPreferencesWindow(window) {
    let prefs_win = new PrefsWindow(window);
    prefs_win.fillPreferencesWindow();
}
