const electron = require('electron')
const rq = require('electron-require');
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Main window object
let mainWindow

let indexThread
/**
 * Starts the application UI
 */
function startApp() {
  var cp = require('child_process');
  // Init the main window
  mainWindow = new BrowserWindow({width: 800, height: 107, frame: false, transparent: true})
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/import/search/searcher.html'),
    protocol: 'file:',
    slashes: true
  }))

  // When the app has finished loading show the window
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    indexThread = cp.fork(path.join(__dirname,'/import/modules/index'));
    indexThread.on('message', function(m) {
      // Receive results from child process
      console.log(m);
    });

    // Wait a bit before indexing files
    setTimeout(function () {
      var storage = require('electron-json-storage');

      //Get the sources configured by the user and send them to the indexer
      storage.get('sources', function(error, data) {
        if (error){
          console.log(error);
        }
        else {
          for (var i = 0; i < data.length; i++) {
            console.log(data[i]);
            if(data[i].name == "Local"){
              indexThread.send(data[i].account[0]);
            }
          }
        }
      });
    }, 3000)
  });

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  //indexer.routineIndex();

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', startApp)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
