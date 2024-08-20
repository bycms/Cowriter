const { GoogleGenerativeAI } = require('@google/generative-ai');
const markdownIt = require('markdown-it');

let welcome = document.getElementsByClassName("system");
let textbox = document.getElementById("chat-input-text");
let sendButton = document.getElementById("chat-input-send");
let fileButton = document.getElementById("chat-input-file");
let selectFile = document.getElementById("file-input");
let chatArea = document.getElementById("chat");
let usermsg = document.getElementsByClassName("user-message");
let aimsg = document.getElementsByClassName("ai-message");
let file_name = document.getElementById("filename");
let API_KEY = 'AIzaSyD8IWCVHh3DMxPcN0BjKG-rpXXnIFlll2s';
let i=-1;  let j=-1;
setTimeout(function(){welcome[0].classList.remove('messageshow')},1000);

let history_1 = '', history_2 = '';

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
  }
});

function newUserMessage() {
  chatArea.innerHTML += '<br><div class="user-message messageshow">' + textbox.value + '</div>';
 
  setTimeout(function(){
    usermsg[i].classList.remove("messageshow");
  }, 1000)
  i++;
}

function newAIMessage(content){
  chatArea.innerHTML += '<br><div class="ai-message messageshow">' + content + '</div><br><br><br><br><br><br><br><br>'

  setTimeout(function(){
    aimsg[j].classList.remove("messageshow");
  }, 5000)
  j++;
}

sendButton.onclick = function () {
  if (textbox.value !== ''){
    newUserMessage();
    callAI(textbox.value);
  
    textbox.value = "";
  }
  else{
    textbox.value = "Enter something here...";
    setTimeout(function (){
      textbox.value = "";
    }, 3000)
  }
}

fileButton.addEventListener("click", function () {
  selectFile.click();
})

selectFile.addEventListener("change", function (event) {
  const fileName = event.target.files.name;
  file_name.innerHTML = fileName;
})

async function callAI(msg) {
  try{
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    const chat = model.startChat({
      history: [{
        role: "user",
        parts: [{ text: "You are a writing assistant in Microsoft Word. Follow the user's instructions unless illegal. " +
                        "If asked to write a passage, begin your response with 'INDOC=YES' BEFORE ANYTHING and then write the passage ONLY, NO OTHER TEXT (GREETINGS, PERMITTING, ETC.) ALLOWED." +
                        "If not, respond accordingly. If unsure, ask the user to clarify. Make full use of the below history chat." +
                        "For example, if latest history includes sth about Windows 10 and user mentions the next version now, you should know he/she means Windows 11" +
                        "This is the last message you sent to your user:" + history_1 +
                        "And this is the second last message you sent to your user:" + history_2
         }],
      },
      {
        role: "model",
        parts: [{ text: "Sure! Let's start." }]
      },
      ],
    });
    
    let result = await chat.sendMessageStream(msg);
    let buffer = [];
    let md = new markdownIt();
    for await (let response of result.stream){
      buffer.push(response.text());
    }
    let message = md.render(buffer.join(''));
    let outContent = message.replace(/Passage_generated:/g, '');
    newAIMessage(outContent);
    history_1 = outContent;
    history_2 = history_1;
    insertHTML(outContent)
  }
  catch(e){
    newAIMessage(e);
  }
}

async function insertHTML(html) {
  await Word.run(async (context) => {
    const blankParagraph = context.document.body.paragraphs.getLast().insertParagraph("", Word.InsertLocation.after); 
    blankParagraph.insertHtml(html, Word.InsertLocation.after)
    
    await context.sync();
               } )
} 
