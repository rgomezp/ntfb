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
    ["You qualify for ", "Usted es elegible para recibir beneficios. Por favor marque 214-269-0906 para completar su aplicacion."]
  ]

  switch(counter){
    // W E L C O M E, P L E A S E  S E L E C T  L A N G U A G E
    case 0:
      return "Hello! You may qualify for the Supplemental Nutrition Assistance Program (SNAP). To continue in English, send 1 \n---------\n Hola! Su hogar pude ser eligible para SNAP. Para continuar en Español, envie 2";
      break;
    // L A N G U A G E  S E L E C T O R
    case 1:
      if(message === '1' || message === '2') return setLang(message);
      else return "$INVALID$";
      break;
    // D O   Y O U   A L R E A D Y  R E C E I V E  B E N E F I T S?
    case 2:
      if(message === "no"){
        return questions[0][lang];
      }
      if(message === "yes"){
        return "$FINISHED$";
      }
      break;
    // D O   Y O U   M A K E   L E S S   T H A N
    case 3:
      let famIncomes = {
        1:"$1659",
        2:"$2233",
        3:"$2808",
        4:"$3383",
        5:"$3958",
      }
      let value = famIncomes[Number(message)];
      return questions[1][lang]+value+'?';
      break;
    // Y O U  Q U A L I F Y , S E N D  M E S S A G E  W I T H  P H O N E  N U M B E R
    case 4:
      if(message === "yes" || message === "si"){
        return questions[2][lang];
      }
      if(message === "no"){
        return "$UNQUALIFIED$";
      }
      break;
    default:
      return "$FINISHED$";
  }
  return '$INVALID$'; // invalid response
}

function setLang(value){
  if(value === '1') return 0; // english
  else if(value === '2') return 1; // spanish
  else return -1; // not valid
}

/* GET home page. */
router.post('/sms', function(req, res, next) {
  let message = req.body.Body.toLowerCase().split(' ')[0];
  console.log("message:", message);
  const smsCount = req.session.counter || 0;

  var response = getResponse(smsCount, message, req.session.language);
  console.log('initial resp:', response);

  // OVERRIDE RESPONSE ONCE LANGUAGE IS SET
  if(response !== '$INVALID$' && smsCount == 1){
    req.session.language = response;
    response = response === 0 ? "Do you get state benefits now? (yes/no)":"¿Usted recibe beneficios del estado actualmente? (si/no)";
  }

  // send other questions
  if(response !== '$INVALID$') req.session.counter = smsCount + 1;
  else response = "Sorry, I didn't get that. Please provide a valid response.";

  if(response == '$FINISHED$'){
    response = "Please call 214-269-0906 to complete your application.";
    req.session.counter = 0;
  }

  if(response == '$UNQUALIFIED$'){
    response = "While you dont qualify for automatic benefits, your family may still be eligibile for the SNAP program. Please call 214-269-0906 to complete your application.";
    req.session.counter = 0;
  }
  console.log("response:", response);

  const twiml = new MessagingResponse();
  twiml.message(response);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

module.exports = router;
