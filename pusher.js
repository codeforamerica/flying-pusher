var apns = require('apn');

var options = {
    cert: "dev_cert.pem",             /* Certificate file path */
    certData: null,                   /* String or Buffer containing certificate data, if supplied uses this instead of cert file path */
    key:  "dev_cert.pem",             /* Key file path */
    keyData: null,                    /* String or Buffer containing key data, as certData */
    passphrase: null,                 /* A passphrase for the Key file */
    ca: null,                         /* String or Buffer of CA data to use for the TLS connection */
    gateway: 'gateway.sandbox.push.apple.com',/* gateway address */
    port: 2195,                       /* gateway port */
    enhanced: true,                   /* enable enhanced format */
    errorCallback: function(e) {console.log(e);},         /* Callback when error occurs function(err,notification) */
    cacheLength: 100                  /* Number of notifications to cache for error purposes */
};

// push
var apnsConnection = new apns.Connection(options);
var myDevice = new apns.Device("daa91a4c 12c00203 c8adbdd2 9a1445fb bb4d77a9 88108b08 807f78f0 2e462942");

//mongo
var mongo = require('mongodb');
var url = require('url');
var connectionUri = url.parse(process.env.MONGOHQ_URL);
var dbName = connectionUri.pathname.replace(/^\//, '');
    
// express
var express = require('express');
var app = express();
app.use(express.bodyParser());

app.get('/', function(req, res) {
  res.send('hello world');
});
app.post('/register', function(req, res) {
  var token = req.param("token");
  console.log(token);
  mongo.Db.connect(process.env.MONGOHQ_URL, function(error, client) {
    if (error) throw error;

    client.collection('test', function(err, collection) {
      var doc = {token: token};
      collection.insert(doc);
    });
  });  

  res.status(201).send('');  
});
app.post('/github/webhook', function(req, res) {
  var payload = JSON.parse(req.param("payload", null));
  console.log(payload.pusher.username + " pushed to " + payload.repository.name);

  var note = new apns.Notification();
  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.badge = 0;
  note.sound = "ping.aiff";
  note.alert = payload.pusher.username + " pushed to " + payload.repository.name;
  note.payload = {'messageFrom': 'flying pusher'};
  note.device = myDevice;

  apnsConnection.sendNotification(note);
  res.status(201).send('');
});

app.listen(process.env.PORT || 3000);
console.log("running on port 3000");