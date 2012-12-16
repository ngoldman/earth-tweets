var socketio = require('socket.io')
  , Twit = require('twit')
  , T = new Twit({
    consumer_key:         process.env.EARTH_TWEETS_CONSUMER_KEY
  , consumer_secret:      process.env.EARTH_TWEETS_CONSUMER_SECRET
  , access_token:         process.env.EARTH_TWEETS_ACCESS_TOKEN
  , access_token_secret:  process.env.EARTH_TWEETS_ACCESS_TOKEN_SECRET
});

var stream;

function readyStream(io, socket){
  socket.emit('msg','ready to stream');
  socket.on('start', function(data){
    startStream(socket, data);
  });
  socket.on('stop', function(){
    stopStream(socket);
  });
}

function startStream(socket, data){
  if (data && data.term) {
    stream = T.stream('statuses/filter', { track: data.term });
  } else {
    stream = T.stream('statuses/sample');
  }
  socket.emit('msg','starting stream');

  stream.on('tweet', function (tweet) {
    if (tweet.geo) socket.emit('tweet', tweet);
  });
}

function stopStream(socket){
  if (stream && stream.stop) stream.stop();
  socket.emit('msg','stream stopped');
}

function connect(io) {
  io.on('connection', function(socket) {
    readyStream(io, socket);
    socket.on('disconnect', function() {
      stopStream(socket);
    });
  });
}

module.exports = {
  listen: function(server) {
    var io = socketio.listen(server, { "log level": 1 });

    if(process.env.LONG_POLLING_REQUIRED){
      io.configure(function () {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);
      });
    }

    return connect(io);
  }
};
