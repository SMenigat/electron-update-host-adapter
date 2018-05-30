# electron-update-host-adapter
Drop in replacement for electron `autoUpdater`, which makes it super easy to connect your app to an [electron-update-host](https://github.com/SMenigat/electron-update-host) instance.

So far, this package is not downloading updates in the background (yet). Read *API Documentation* for more information about this.

## Installation

Install the package via npm:

```bash
# with npm
npm install --save-dev electron-update-host-adapter

# with yarn
yarn add --dev electron-update-host-adapter
```

## API Documentation

This module is a drop in replacement, which means that it offers the same API as the original [Electron autoUpdater module](https://github.com/electron/electron/blob/v2.0.2/docs/api/auto-updater.md).

There are some important difference though:

* Event `update-downloaded` is not emitted after the update has been downloaded. It fires at the same time as `update-available` but passes the documented arguments into the callback.
* Method `autoUpdater.quitAndInstall()` does nothing.

All the rest should behave pretty much as expected. 

## Usage example

The following real world example connects an electron app to an [electron-update-host](https://github.com/SMenigat/electron-update-host) instance.

```javascript
const { app, Menu, BrowserWindow, dialog } = require('electron');
const autoUpdater = require('electron-update-host-adapter');
const open = require('open');

// electron-update-host expects version to be 1-0-0 instad of 1.0.0
const appVersion = app.getVersion().split('.').join('-');

// We set the feed like we would do with the standard autoUpdater
const server = 'http://<electron-update-host>.com';
const feed = `${server}/check-update/${process.platform}/${appVersion}`;
autoUpdater.setFeedURL(feed);

// update-downloaded fires if there is a new app version available.
// We just show an message box which offers a download button.
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Download & Quit', 'Later'],
    title: 'Application Update',
    message: `Version v${releaseName} available`,
    detail: 'A newer version of this app can be downloaded.\n' + 
      'It is recommended to use the latest version.\n\n' + 
      'Do you want to download it now?'
  }

  dialog.showMessageBox(dialogOpts, (response) => {
    if (response === 0) {
      // We open the update URL in the users standard
      // browser to trigger the download
      open(updateURL);
      app.quit();
    }
  })
});

autoUpdater.on('error', (message) => {
  dialog.showMessageBox({
    type: 'error',
    title: 'Update Error',
    message: 'Something went wrong',
    detail: `There was an error while trying to check for new updates.\n${message}`,
  });
});

autoUpdater.checkForUpdates();
```




