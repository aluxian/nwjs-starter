var gui = window.require('nw.gui');
var clipboard = gui.Clipboard.get();
var AutoLaunch = require('auto-launch');
var windowBehaviour = require('./window-behaviour');
var dispatcher = require('./dispatcher');
var platform = require('./platform');
var settings = require('./settings');
var updater = require('./updater');

module.exports = {
  /**
   * The main settings items. Their placement differs for each platform:
   * - on OS X they're in the top menu bar
   * - on Windows they're in the tray icon's menu
   * - on all 3 platform, they're also in the right-click context menu
   */
  settingsItems: function(win, keep) {
    var self = this;
    return [{
      label: 'Reload',
      click: function() {
        windowBehaviour.saveWindowState(win);
        win.reload();
      }
    }, {
      type: 'checkbox',
      label: 'Open Links in the Browser',
      setting: 'openLinksInBrowser',
      click: function() {
        settings.openLinksInBrowser = this.checked;
        windowBehaviour.setNewWinPolicy(win);
      }
    }, {
      type: 'separator'
    }, {
      type: 'checkbox',
      label: 'Run as Menu Bar App',
      setting: 'asMenuBarAppOSX',
      platforms: ['osx'],
      click: function() {
        settings.asMenuBarAppOSX = this.checked;
        win.setShowInTaskbar(!this.checked);

        if (this.checked) {
          self.loadTrayIcon(win);
        } else if (win.tray) {
          win.tray.remove();
          win.tray = null;
        }
      }
    }, {
      type: 'checkbox',
      label: 'Launch on Startup',
      setting: 'launchOnStartup',
      platforms: ['osx', 'win'],
      click: function() {
        settings.launchOnStartup = this.checked;

        var launcher = new AutoLaunch({
          name: 'Starter',
          isHidden: true // hidden on launch - only works on a mac atm
        });

        launcher.isEnabled(function(enabled) {
          if (settings.launchOnStartup && !enabled) {
            launcher.enable(function(error) {
              if (error) {
                console.error(error);
              }
            });
          }

          if (!settings.launchOnStartup && enabled) {
            launcher.disable(function(error) {
              if (error) {
                console.error(error);
              }
            });
          }
        });
      }
    }, {
      type: 'checkbox',
      label: 'Check for Update on Launch',
      setting: 'checkUpdateOnLaunch'
    }, {
      type: 'separator'
    }, {
      label: 'Check for Update',
      click: function() {
        updater.check(gui.App.manifest, function(error, newVersionExists, newManifest) {
          if (error || newVersionExists) {
            updater.prompt(win, false, error, newVersionExists, newManifest);
          } else {
            dispatcher.trigger('win.alert', {
              win: win,
              message: 'You’re using the latest version: ' + gui.App.manifest.version
            });
          }
        });
      }
    }, {
      label: 'Launch Dev Tools',
      click: function() {
        win.showDevTools();
      }
    }].map(function(item) {
      // If the item has a 'setting' property, use some predefined values
      if (item.setting) {
        if (!item.hasOwnProperty('checked')) {
          item.checked = settings[item.setting];
        }

        if (!item.hasOwnProperty('click')) {
          item.click = function() {
            settings[item.setting] = item.checked;
          };
        }
      }

      return item;
    }).filter(function(item) {
      // Remove the item if the current platform is not supported
      return !Array.isArray(item.platforms) || (item.platforms.indexOf(platform.type) != -1);
    }).map(function(item) {
      var menuItem = new gui.MenuItem(item);
      menuItem.setting = item.setting;
      return menuItem;
    });
  },

  /**
   * Create the menu bar for the given window, only on OS X.
   */
  loadMenuBar: function(win) {
    if (!platform.isOSX) {
      return;
    }

    var menu = new gui.Menu({
      type: 'menubar'
    });

    menu.createMacBuiltin('Starter');
    var submenu = menu.items[0].submenu;

    submenu.insert(new gui.MenuItem({
      type: 'separator'
    }), 1);

    // Add the main settings
    this.settingsItems(win, true).forEach(function(item, index) {
      submenu.insert(item, index + 2);
    });

    // Watch the items that have a 'setting' property
    submenu.items.forEach(function(item) {
      if (item.setting) {
        settings.watch(item.setting, function(value) {
          item.checked = value;
        });
      }
    });

    win.menu = menu;
  },

  /**
   * Create the menu for the tray icon.
   */
  createTrayMenu: function(win) {
    var menu = new gui.Menu();

    // Add the main settings
    this.settingsItems(win, true).forEach(function(item) {
      menu.append(item);
    });

    menu.append(new gui.MenuItem({
      type: 'separator'
    }));

    menu.append(new gui.MenuItem({
      label: 'Show Starter',
      click: function() {
        win.show();
      }
    }));

    menu.append(new gui.MenuItem({
      label: 'Quit Starter',
      click: function() {
        win.close(true);
      }
    }));

    // Watch the items that have a 'setting' property
    menu.items.forEach(function(item) {
      if (item.setting) {
        settings.watch(item.setting, function(value) {
          item.checked = value;
        });
      }
    });

    return menu;
  },

  /**
   * Create the tray icon.
   */
  loadTrayIcon: function(win) {
    if (win.tray) {
      win.tray.remove();
      win.tray = null;
    }

    var tray = new gui.Tray({
      icon: 'images/icon_' + (platform.isOSX ? 'menubar.tiff' : 'tray.png')
    });

    tray.on('click', function() {
      win.show();
    });

    tray.tooltip = 'Starter';
    tray.menu = this.createTrayMenu(win);

    // keep the object in memory
    win.tray = tray;
  },

  /**
   * Create a context menu for the window and document.
   */
  createContextMenu: function(win, window, document, targetElement) {
    var menu = new gui.Menu();

    if (targetElement.tagName.toLowerCase() == 'input') {
      menu.append(new gui.MenuItem({
        label: "Cut",
        click: function() {
          clipboard.set(targetElement.value);
          targetElement.value = '';
        }
      }));

      menu.append(new gui.MenuItem({
        label: "Copy",
        click: function() {
          clipboard.set(targetElement.value);
        }
      }));

      menu.append(new gui.MenuItem({
        label: "Paste",
        click: function() {
          targetElement.value = clipboard.get();
        }
      }));
    } else if (targetElement.tagName.toLowerCase() == 'a') {
      menu.append(new gui.MenuItem({
        label: "Copy Link",
        click: function() {
          clipboard.set(targetElement.href);
        }
      }));
    } else {
      var selection = window.getSelection().toString();
      if (selection.length > 0) {
        menu.append(new gui.MenuItem({
          label: "Copy",
          click: function() {
            clipboard.set(selection);
          }
        }));
      }
    }

    this.settingsItems(win, false).forEach(function(item) {
      menu.append(item);
    });

    return menu;
  },

  /**
   * Listen for right clicks and show a context menu.
   */
  injectContextMenu: function(win, window, document) {
    document.body.addEventListener('contextmenu', function(event) {
      event.preventDefault();
      this.createContextMenu(win, window, document, event.target).popup(event.x, event.y);
      return false;
    }.bind(this));
  }
};
