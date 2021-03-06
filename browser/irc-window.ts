const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const {shell} = require('electron');
const {ipcMain} = require('electron');
import irc = require('./irc');
import nodeIrc = require('irc');

class IrcWindow {
  private _window;
  focused: boolean;
  client: nodeIrc.Client;

  constructor(url: string) {
    this._window = new BrowserWindow({width: 800, height: 600});

    this._window.loadURL(url);
    this._window.webContents.openDevTools();
    this._window.on('closed', () => {
      this._window = null;
      IrcWindow.remove(this);
      if (this.client) {
        this.client.disconnect('bye');
      }
    });
    this._window.on('focus', () => {
      this._window.webContents.send('focus', {});
      IrcWindow.focus(this);
    });
    this._window.on('blur', () => {
      this._window.webContents.send('blur', {});
      IrcWindow.blur();
    });
    this._window.webContents.on('new-window', function (e, url) {
      shell.openExternal(url);
      e.preventDefault();
    });

    ipcMain.on('connect', (event, data) => {
      this.client = irc.connect(data, this._window);
    });

    this.focused = true;
    IrcWindow.focus(this);
  }

  focus() {
    this.focused = true;
  }

  blur() {
    this.focused = false;
  }

  static windows: IrcWindow[] = [];


  static create(url: string) {
    IrcWindow.windows.push(new IrcWindow(url));
  }

  static remove(wToRemove: IrcWindow) {
    IrcWindow.windows = IrcWindow.windows.filter(function (w, idx) {
      if (w === wToRemove) {
        delete IrcWindow.windows[idx];
        return false;
      } else {
        return true;
      }
    });
  }

  static focus(wToFocus: IrcWindow) {
    IrcWindow.windows.forEach(function (w) {
      if (wToFocus === w) {
        w.focus();
      } else {
        w.blur();
      }
    });
  }

  static blur() {
    IrcWindow.windows.forEach(function (w) {
      w.blur();
    });
  }

  static currentBrowserWindow() {
    return IrcWindow.windows.filter(w => w.focused)[0]._window;
  }
}

export = IrcWindow;
