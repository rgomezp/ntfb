const express = require('express');
const http = require('http');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

var router = express.Router();

class Node{
  constructor(id, double, left, right){
    this.id = id;
    this.double = double;
    this.left = left;
    this.right = right;
  }
}

const tree = new Node(0, false, null, new Node(1, false, null,
  new Node(3, true,
    new Node(2, false, null, null),
    new Node(4, false, null,
      new Node(5, false, null,
        new Node(7, true,
          new Node(6, false, null, null),
          new Node(8, false, null, null)
        ))
    )
  )
));

const validLogic = {
  0:{},
  1:{1:'', 2:''},
  2:{},
  3:{'no':'right','si': 'left', 'yes':'left'},
  4:{},
  5:{1:'',2:'',3:'',4:'',5:'',6:'',7:'',8:'',9:'',10:''},
  6:{},
  7:{'no':'left','si': 'right', 'yes':'right'},
  8:{}
}

const responses = {
  0:['Hello! You may qualify for the Supplemental Nutrition Assistance Program (SNAP). To continue in English, type 1\n------------\nHola! Su hogar puede ser elegible para el Supplemental Nutrition Assistance Program (SNAP). Para continuar en Español, envie 2',
     'Hello! You may qualify for the Supplemental Nutrition Assistance Program (SNAP). To continue in English, type 1\n------------\nHola! Su hogar puede ser elegible para el Supplemental Nutrition Assistance Program (SNAP). Para continuar en Español, envie 2'],
  1:['Do you currently get state benefits? (yes/no)',
     'Usted recibe beneficios del estado actualmente? (si/no)'],
  2:['Great! Please call 214-269-0906 to complete your application. Have a good day!',
     'Exelente! Favor de marcar 214-269-0906 para completar su aplicacion. Que tenga un buen dia!'],
  4:['What size is your family? (example: 4)',
     'De que tamaño es su familia? (ejemplo: 4)'],
  5:['Is your monthly household income less than $',
     'Es el ingreso mensual de su hogar menos de $'],
  6:["While you don't qulify for automatic benefits, your family may still be eligible for the SNAP program. Please call 214-269-0906 to complete your application. Have a good day!",
     'Mientras no califica para beneficios automaticos, es posible que su familia todavia pueda calificar para el programa SNAP. Favor de marcar 214-269-0906 para completar su aplicacion. Que tenga un buen dia!'],
  8:['Congratulations! You qualify for the SNAP program. Please call 214-269-0906 to complete your application. Have a good day!',
     'Felicidades! Usted califica para el SNAP program. Favor de marcar 214-269-0906 para completar su aplicacion. Que tenga un buen dia!']
}

const familyIncome = {
  1:"1659",
  2:"2233",
  3:"2808",
  4:"3383",
  5:"3958"
}

function setLang(value){
  if(Number(value) === 1) return 0; // english
  else if(Number(value) === 2) return 1; // spanish
  else return -1; // not valid
}

function findNode(node, id){
  if(node.id === id) return node;

  if(node.id < id){
    // go right
    return findNode(node.right, id);
  }
  if(node.id > id){
    return findNode(node.left, id);
  }
}

/* GET home page. */
router.post('/sms', function(req, res, next) {
  try{
    let invalid = false;
    const twiml = new MessagingResponse();

    // init msg code
    let msgCode = req.session.msgCode || 0;

    // find node, logic
    let currentNode = findNode(tree, msgCode);
    let logic = validLogic[currentNode.id];

    // get msg
    let message = req.body.Body.toLowerCase().trim();
    let response;

    // get lang
    let lang = req.session.lang || 0;
    // set lang
    if(msgCode === 1) lang = setLang(message);

    if(lang !== -1) req.session.lang = lang;
    else invalid = true;

    // check if msg is valid
    if(Object.keys(logic).indexOf(message) === -1) invalid = true;

    if(invalid && currentNode.id > 0) response = "Please type a valid response";
    else{
      var next;
      // get next node
      if(currentNode.double){
        dir = logic[message];
        currentNode = currentNode[dir];
        response = responses[currentNode.id][lang];
      }else{
        if(currentNode.id===5){
          // get direction based on income and family size
          let income = familyIncome[Number(message)];
          if(!income && Number(message) > 5){
            income = Number(familyIncome[5])+Number((Number(message)-5)*575);
          }else response = "Something went wrong";
          response = responses[currentNode.id][lang] + income + '?';
        }else response = responses[currentNode.id][lang];
      }
      next = currentNode.right;
      if(next == null){
        next = tree;
      }

      if(next.id >= 0) req.session.msgCode = next.id;
    }

    console.log("response:", response);

    twiml.message(response);

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }catch(err){
    console.log(err);
    twiml.message(err);

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }

});

module.exports = router;
