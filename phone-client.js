const express = require('express')
const axios = require('axios');
const config = require('config');
const ini = require('ini');
const WSCLIENT = require('ws-reconnect');

//const WebSocket = require('ws');
const phoneUrl = 'http://admin:admin@192.168.241.41/servlet?';
const ws = new WSCLIENT('ws://localhost:3007/', {
  retryCount: 10000000, // default is 2
  reconnectInterval: 1 // default is 5
});

ws.start();
ws.on('open', () => {
  ws.send('something');
});

ws.on("reconnect", () =>{
    console.log("reconnecting");
});

ws.on('message', (data) => {

  console.log(data);
  if (!data) return;

  let action;
  try {
    action = JSON.parse(data)
  } catch (err) {
    return
  }
  
  console.log('action:', action);
  let url;
  switch (action.type) {
    case 'key':
      console.log('action key');
      let key = action.key;
      url = phoneUrl + 'key=' + key;
      axios.get(url)
        .then((response) => {
            console.log(response.data);
        });
      break;
    case 'info':
      console.log('action info');
      url = phoneUrl + 'phonecfg=get&accounts=1&dnd=1&fw=1';
      axios.get(url)
        .then((response) => {
            console.log(response.data);
            let info = ini.parse(response.data);
            console.log('info:', info);
            return info
        })
        .then((info) => {
            ws.send(JSON.stringify({
              type: 'infoResponse',
              info
            }));
        });
      break;
    case 'call':
      console.log('action call');
      let number = action.number;
      if (!number) { return }
      url = phoneUrl + 'number=' + number + '&outgoing_uri=2';
      axios.get(url)
        .then((response) => {
            console.log(response.data)
        });
      break;
    default:
      console.log('undefined action type');
  }
});

const app = express()
const port = 3000

app.get('/event/:id', (req, res) => {
    res.send('OK');
    console.log('get', req.query);
    console.log('param', req.params.id);
    
    ws.send(JSON.stringify({
      type: 'event', 
      event: req.params.id, 
      data: req.query
    }));
})

app.listen(port, () => {
	console.log(`app listening on port ${port}!`);
})