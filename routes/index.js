const express = require('express');
const http = require('http');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

var router = express.Router();

function getResponse(counter, message){
  switch(counter){
    case 0:
      return "Hello! You may qualify for the Supplemental Nutrition Assistance Program (SNAP). In other words, free food! Would you like to continue? (reply yes or no)";
      break;
    case 1:
      if(message.toLowerCase() == 'yes' || message.toLowerCase() == 'y'){
        return "Great! Let's get started."
        break;
      }
    default:
      return "Something went wrong";

  }
  return '$INVALID$'; // invalid response
}

/* GET home page. */
router.post('/sms', function(req, res, next) {
  let message = req.body.Body;
  const smsCount = req.session.counter || 0;

  var response = getResponse(smsCount, message);

  req.session.counter = smsCount + 1;

  const twiml = new MessagingResponse();
  twiml.message(response);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

module.exports = router;
