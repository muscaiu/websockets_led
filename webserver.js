const http = require('http').createServer(handler);
const fs = require('fs');
const io = require('socket.io')(http)
const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
const LED = new Gpio(4, 'out'); //use GPIO pin 4 as output
const pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

http.listen(3000);
console.log('listening on port 3000');

function handler(req, res) {
  fs.readFile(__dirname + '/public/index.html', (err, data) => { //read file index.html in public folder
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' }); //display 404 on error
      return res.end("404 Not Found");
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(data);
    return res.end();
  });
}

io.sockets.on('connection', (socket) => {// WebSocket Connection
  console.log('a connection showed up')
  let lightvalue = 0; //static variable for current status
  pushButton.watch((err, value) => { //Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue); //send button status to client
  });

  socket.on('light', (data) => { //get light switch status from client
    console.log('requested light event')
    lightvalue = data;
    if (lightvalue != LED.readSync()) { //only change LED if status has changed
      LED.writeSync(lightvalue); //turn LED on or off
    }
  });
});

process.on('SIGINT', () => { //on ctrl+c
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
}); 