const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000).sockets;

//connect to mongo
mongo.connect('mongodb://127.0.0.1/', function(err, res) {

    if (err) {
        throw err;
    }
    console.log('Mongodb connected...');

    var db = res.db('mongochat');


    //Connect to Socket.io
    io.on('connection', function(socket) {
	    console.log("This is now printed!!");
        let chat = db.collection('chats');

        //Create function to send status
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        chat.find().limit(100).sort({ _id: 1 }).toArray(function(err, res) {
            if (err) {
                throw err;
            }

            //Emit the messages
            socket.emit('output', res);

        });

        //Handle input events
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;

            //Check for name and message
            if (name == '' || message == '') {
                //Send error status
                sendStatus('Please enter a name and message');
            } else {
                //insert message
                chat.insert({ name: name, message: message }, function() {
                    io.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        //Handle clear
        socket.on('clear', function(data) {
            //Remove all chats from collection
            chat.remove({}, function() {
                //Emit cleared
                socket.emit('cleared');
            });
        })
    });
});
