var Datastore = require('nedb');
var ini = false;
var db = new Datastore({ filename: 'indexes.pdx'});
console.log("init DB");
db.loadDatabase(function (err) {
  ini = true;
  //db.persistence.setAutocompactionInterval(10000);
});

var sources;

exports.reload = function() {
  const storage = require('electron-json-storage');
  storage.get('sources', function(error, data) {
    if (error){
      console.log(error);
    }
    else if(data.length > 0){
      sources = data;
      console.log(data);
    }
  });
}

exports.reload();

Array.prototype.unique = function() {
  var re = this;
  var arr = {};
  for ( var i=0, len = re.length; i < len; i++ )
      arr[re[i]['path']] = re[i];

  re = new Array();
  for ( var key in arr )
      re.push(arr[key]);
      return re;
}

exports.search = function(q, callback) {
  if(ini && q != ""){
    var res = [];
    var reg = new RegExp(q);
    db.loadDatabase(function (err) {
      db.find({ "word": reg }, function (err, docs) {
        for (var i = 0; i < docs.length; i++) {
          res.push(docs[i].matches.unique());
        }
        callback(res);
      });
    });
    var dropbox = require("./api/dropbox");
    for (var i = 0; i < sources.length; i++) {
      if(sources[i].name == "Dropbox"){
        var curSource = sources[i];
        dropbox.search(q, curSource.data.access_token, function(results) {
          for (var x = 0; x < results.length; x++) {
            var curItem = results[x];
            dropbox.getLink(curItem.metadata, curSource.data.access_token, function (resLink) {
              console.log(curItem);
              var doc =
            [{"line": -1,
              "path": resLink.name,
              "link": resLink.link,
              "source": "Dropbox"
            }];
            res.push(doc);
            //console.log(doc);
            callback(res);
            });
          }
        });
      }
    }
  }
}

exports.insertKeyword = function(q){

}

exports.getDropboxLink = function(path, callback){
  var dropbox = require("./api/dropbox");
  for (var i = 0; i < sources.length; i++) {
    if(sources[i].name == "Dropbox"){
      dropbox.getLink(path, sources[i].data.access_token, function(results) {
        callback(results);
        return;
      });
    }
  }
  callback();
}

exports.insertDocument = function(doc, callback) {
  db.update({ "word": doc.word, $not:{ $and: [{"matches.document.line": doc.matches[0].line, "matches.document.path": doc.matches[0].path}]}}, { $push: {"matches": doc.matches[0]} }, {upsert: true}, function () {
    console.log("updated");
    callback();
  });
}
