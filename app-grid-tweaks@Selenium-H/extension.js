/*

Version 3.03
============
 
*/

const ExtensionUtils        = imports.misc.extensionUtils;
const Extension             = ExtensionUtils.getCurrentExtension();
const ExtensionToBeExecuted = (imports.misc.config.PACKAGE_VERSION >= "40") ? Extension.imports.extension_40 : Extension.imports.extension_3_38;

function enable() {

  ExtensionToBeExecuted.enable(ExtensionUtils.getSettings("org.gnome.shell.extensions.app-grid-tweaks"));

}

function disable() {

  ExtensionToBeExecuted.disable();

}

