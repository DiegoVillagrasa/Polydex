
var lBounds;
var settingsSrcModel;
var providersModel;
/**
 * Used to make calls to the main thread
 */
const remote = require('electron').remote;
const electron = require('electron');

/**
 * Authentificate to a service
 */
function connectToService() {

  var sType = $('.providerTable > table tr.active > td:nth-of-type(2)').text();

  switch (sType) {
    case "Local":
      const {dialog} = require('electron').remote;
      var dir = dialog.showOpenDialog({properties: ['openDirectory']});
      console.log(dir);
      checkPermission (dir[0], 4, function(err, res) {
        if(!err){
          settingsSrcModel.sources.push({name: "Local", icon: "fa-folder", account: dir});
          saveSources();
        }
        else{
          console.log(err);
        }
      });
      break;
    case "Google":
      break;
    case "Dropbox":
    var token = makeid();
    const BrowserWindow = remote.BrowserWindow;
    conWindow = new BrowserWindow({width: 800, height: 600, frame: false, transparent: false})
    conWindow.loadURL("https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=5reu87si7378b0x&redirect_uri=https://polydex.io/oauth/dropbox&state=" + token);
    checkDropboxAdded(token, conWindow);
      break;
    case "OneDrive":
      break;
    case "Github":
      break;
    default:

  }
  setTimeout(function() {
    $('.addSourceDiv').hide();
    loadSources();
  }, 500);
}
/**
 * Ch3cks if the directory/file can be accessed
 * @param  {File}   file Directory/FIle path
 * @param  {Int}   mask
 * @param  {Function} cb
 */
var checkPermission = function (file, mask, cb){
  var fs = require('fs');
  fs.stat (file, function (error, stats){
      if (error){
          cb (error, false);
      }else{
          cb (null, !!(mask & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0])));
      }
  });
};

/**
 * Checks if the Dropbox account has been authorized
 * @param  {String} token   Token used for authentification
 * @param  {Window} bwindow [Authorization window]
 */
function checkDropboxAdded(token, bwindow) {
  var rq = require('request');
  rq.post({url: "https://polydex.io/listener", form:{"token": token}},
  function (err,httpResponse,body) {
    if(body != "err"){
      var resp = JSON.parse(body);
      console.log(resp);
      settingsSrcModel.sources.push({name: "Dropbox", icon: "fa-dropbox", account: "", "data": resp});
      saveSources();
      bwindow.close();
    }
    else{
      setTimeout(function() {
        checkDropboxAdded(token, bwindow);
      }, 1000);
    }
  });
}

/**
 * Save the sources
 */
function saveSources() {
  const storage = require('electron-json-storage');
    storage.set('sources', settingsSrcModel.sources, function(error) {
    if (error){
      console.log(error);
    }
  });
}

/**
 * Load the sources
 */
function loadSources() {
  const storage = require('electron-json-storage');
  storage.get('sources', function(error, data) {
    if (error){
      console.log(error);
    }
    else if(data.length > 0){
      settingsSrcModel.sources = data;
      console.log(data);
    }
  });
}

/**
 * Creates a 32 character ID
 * @return {[type]} [description]
 */
function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 32; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
/**
 * Deletes a source from the saved sources
 * @param  {[type]} index [description]
 * @return {[type]}       [description]
 */
function deleteSource(index) {
  settingsSrcModel.sources.splice(index, 1);
  console.log(settingsSrcModel.sources);
  saveSources();
  setTimeout(function() {
    loadSources();
  }, 500);
}

/**
 * Open a file on the host
 * @param  {String} loc File path
 */
function openFile(loc) {
  loc = decodeURIComponent(loc);
  console.log(loc);
  var exec = require('child_process').exec;
  exec(loc);
}

/**
 * Open a directory in the Explorer
 * @param  {String} loc Directory path
 */
function openLocation(loc) {
  loc = decodeURIComponent(loc);
  console.log(loc);
  var exec = require('child_process').exec;
  exec("start " + loc);
}

/**
 * Open a link on the default browser
 * @param  {String} loc Url
 */
function openLink(loc) {
  var exec = require('child_process').exec;
  console.log(loc);
  exec("start " + loc);
}

// When the app is ready
$(document).ready(function () {


  const search = require('../modules/search');

  /**
   * Model for the settings
   * @type {Vue}
   */
  settingsSrcModel = new Vue({
    el: '.sourceTable',
    data:{
      sources: []
    },
    methods : {

            delete : function (deleteIndex) {
              settingsSrcModel.sources.splice(deleteIndex, 1);
              console.log(settingsSrcModel.sources);
              saveSources();
              setTimeout(function() {
                loadSources();
              }, 500);
            }
        }
  });

  /**
   * Model for the providers
   * @type {Vue}
   */
  providersModel = new Vue({
    el: '.providerTable',
    data:{
      providers: [
        {name: "Local", icon: "fa-folder", default: true},
        {name: "Dropbox", icon: "fa-dropbox"},
        {name: "Google", icon: "fa-google"},
        {name: "OneDrive", icon: "fa-windows"},
        {name: "Github", icon: "fa-github"}
      ]
    }
  });

  // Close the window
  $("#closeBtn").click(function() {
    console.log("click");
    var window = remote.getCurrentWindow();
       window.close();
  });

  // Open the settings menu
  $("#settingsBtn").click(function() {
    loadSources();
    var win = remote.getCurrentWindow();
    lBounds = win.getBounds();
    console.log(lBounds);
    var bounds = lBounds;
    bounds.height = 500;
    win.setBounds(bounds);
    $('.settings').show();
    $('.results').hide();
  });

  // Close the settings menu
  $("#settingsDoneBtn").click(function() {
    $('.settings').hide();
    $('.results').show();
    var win = remote.getCurrentWindow();
    setTimeout(function() {
      console.log(lBounds);
      win.setBounds(lBounds);
    }, 500);
  });

  // Open the general tab
  $("#generalBtn").click(function() {
    $('.cat-general').show();
    $('.cat-sources').hide();
    $("#generalBtn").addClass("cat-active");
    $("#sourcesBtn").removeClass("cat-active");
  });

  // Open the source tab
  $("#sourcesBtn").click(function() {
    $('.cat-general').hide();
    $('.cat-sources').show();
    $("#generalBtn").removeClass("cat-active");
    $("#sourcesBtn").addClass("cat-active");
  });

  /**
   * Returns the correct click event for the given source
   * @param {Document}   item     Indexed file
   * @param {Function} callback
   */
  function setClickFunction(item, callback) {
    var clickRes = "";
    var fa = item.path.split("\\");
    var fname = fa[fa.length-1];
    switch (item.source) {
      case "File":
      clickRes = '<button onClick="openLocation(\''+escape(item.path.replace(fname, ""))+'\');" class="pathBtn" type="button" name="button"><i class="fa fa-folder-open" aria-hidden="true"></i></button> <button class="openBtn" type="button" name="button" onClick="openFile(\''+escape(item.path)+'\');"><i class="fa fa-pencil" aria-hidden="true"></i></button>';
        break;
      case "Dropbox":
      console.log(item);
        clickRes = '<button onClick="openLink(\''+item.link+'\');" class="pathBtn" type="button" name="button"><i class="fa fa-globe" aria-hidden="true"></i></button>';
        break;
      default:

    }
    return clickRes;
  }

  /**
   * Display the results to the user
   */
  function showResults() {
    var win = remote.getCurrentWindow();
    var bounds = win.getBounds();
    bounds.height = 500;
    win.setBounds(bounds);
    $('.results').show();
  }


  /**
   * Add a local source
   */
  function addLocalSource() {
    const {dialog} = require('electron').remote
    return dialog.showOpenDialog({properties: ['openDirectory']});
  }

  // When pressing "ENTER" search for files
  $(document).keypress(function(e) {
    if(e.which == 13) {
      $(".loading-pulse").show();
      console.log("searching");
      search.search($('#searcher').val(), function(docs) {
        console.log(docs);
        $(".results").html("");
        $(".results").scrollTop(0);
          for (var i = 0; i < docs.length; i++) {
            for (var y = 0; y < docs[i].length; y++) {

              var fa = docs[i][y].path.split("\\");
              var fname = fa[fa.length-1];
              if(docs[i][y].line > -1){
                fname += (" Line: " +  (docs[i][y].line+1))
              }

              console.log("hap");
              var clickF = setClickFunction(docs[i][y]);
              var htTemplate = '<div class="document-item"><i class="fa fa-'+docs[i][y].source.toLowerCase()+' fa-4x"></i><p class="fname">'+fname+'</p><p class="fpath">'+docs[i][y].path+'</p>'+clickF+'</div>'
              $(".results").append(htTemplate);
            }
          }
          $(".loading-pulse").hide();
        if(docs.length > 0){
          showResults();
        }
        else{
          $('.results').hide();
        }
      });
    }
});
});
