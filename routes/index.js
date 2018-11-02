const express = require('express');
const http = require('http');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

var router = express.Router();

function getResponse(counter, message, lang){
  // questions 2-4
  let questions = [
    [
      "What size is your family? (example: 4)",
      "¿De que tamaño es su familia? (ejemplo: 4)"
    ],
    [
      "Is your household income less than ",
      "¿Es el ingreso de su hogar menos de "
    ],
    ["You qualify for ", "Usted es elegible para recibir"],
    ["While you dont qualify for automatic benefits, your family may still be eligibile for the SNAP program. Please call 2142690906 to complete your application."]
  ]

  switch(counter){
    case 0:
      return "Hello! You may qualify for the Supplemental Nutrition Assistance Program (SNAP). To continue in English, send 1 \n---------\n Hola! Su hogar pude ser eligible para SNAP. Para continuar en Español, envie 2";
      break;
    case 1:
      if(message === '1' || message === '2') return setLang(message);
      break;
    case 2:
      if(message === "yes" || message === "si"){
        return "Please call 214-269-0906 to complete your application.";
      }
      if(message === "no"){
        return questions[0][lang];
      }
      break;
    case 3:
      let famIncomes = {
        1:"$1659",
        2:"$2233",
        3:"$2808",
        4:"3383",
        5:"3958",
      }
      let value = famIncomes[Number(message)];
      return questions[1][lang]+value+'?';
      break;
    case 4:
      if(message === "yes" || message === "si"){
        return questions[2][lang];
      }
      if(message === "no"){
        return questions[3];
      }
      break;
    default:
      return "Please call 214-269-0906 if you have any questions regarding the SNAP program";
  }
  return '$INVALID$'; // invalid response
}

function setLang(value){
  if(value === '1') return 0; // english
  if(value === '2') return 1; // spanish
}

/* GET home page. */
router.post('/sms', function(req, res, next) {
  let message = req.body.Body.toLowerCase();
  console.log("message:", message);
  const smsCount = req.session.counter || 0;

  var response = getResponse(smsCount, message, req.session.language);

  // set language, send question 1
  if(smsCount == 1){
    req.session.language = response;
    response = response === 0 ? "Do you get state benefits now? (yes/no)":"¿Usted recibe beneficios del estado actualmente? (si/no)";
  }

  // send other questions
  if(response !== '$INVALID$') req.session.counter = smsCount + 1;
  else response = "Sorry, I didn't get that. Please provide a valid response.";
  console.log("response:", response);

  const twiml = new MessagingResponse();
  twiml.message(response);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

module.exports = router;
