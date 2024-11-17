const { GoogleGenerativeAI } = require('@google/generative-ai');
const markdownIt = require('markdown-it');

let thisPage = document.documentElement;
let welcome = document.getElementsByClassName("system");
let textbox = document.getElementById("chat-input-text");
let sendButton = document.getElementById("chat-input-send");
let reloadButton = document.getElementById("reloadAll");
let selectFile = document.getElementById("file-input");
let chatArea = document.getElementById("chat");
let usermsg = document.getElementsByClassName("user-message"); let usermsg_bg = document.getElementsByClassName("user-message-bg");
let aimsg = document.getElementsByClassName("ai-message"); let aimsg_bg = document.getElementsByClassName("ai-message-bg");
let file_name = document.getElementById("filename");
let API_KEY = 'AIzaSyD8IWCVHh3DMxPcN0BjKG-rpXXnIFlll2s';
let i=-1;  let j=-1;
setTimeout(function(){welcome[0].classList.remove('messageshow')},1000);

let outContent;
let history_1 = '', history_2 = '';
const fileReader = new FileReader();
let fileContent;
let isFileSelected = false;
let lastFill = '';

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {

    }     
  }
);

// File Reader setup
fileReader.onload = function(e) {
  fileContent = e.target.result;
}

//Add new user message to chat area
function newUserMessage() {
  chatArea.innerHTML += '<br><div class="user-message messageshow"><div class="user-message-bg messageshow"></div><p>' + textbox.value + '</p></div>';
 
  setTimeout(function(){
    usermsg[i].classList.remove("messageshow");
    usermsg_bg[i].classList.remove("messageshow");
  }, 1000)
  i++;
}

//Add new response to chat area
function newAIMessage(content){
  chatArea.innerHTML += '<br/><div class="ai-message messageshow"><div class="ai-message-bg messageshow"></div>' + content + '</div>'

  setTimeout(function(){
    aimsg[j].classList.remove("messageshow");
    aimsg_bg[j].classList.remove("messageshow");
  }, 5000)
  j++;
}

//Edit selected file name
selectFile.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file.name.length > 0 && file.name.length < 25) {
  file_name.textContent = file.name;
  fileReader.readAsText(file);
  isFileSelected = true;
 } 
  else if (file.name.length >= 25) {
  file_name.textContent = file.name.slice(0, 23) + "...";
  fileReader.readAsText(file);
  isFileSelected = true;
 }
  else {
  file_name.textContent = "No File Selected.";
} 
})

//Shortcut to send message with Ctrl+Enter
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === 'Enter'){
    sendButton.click();
  }
})

//Prepare and send user message to AI
sendButton.onclick = function () {
  if (textbox.value !== '' && textbox.value !== 'Enter your request here...'){
    newUserMessage();
    if (isFileSelected == true) {
      callAI(textbox.value + "...Here's the document to refer on:" + fileContent);
    }
    else{
      callAI(textbox.value);
    }
  
    textbox.value = "";
  }
  else{
    textbox.value = "Enter your request here...";
    setTimeout(function (){
      textbox.value = "";
    }, 3000)
  }
}

//Call API
async function callAI(msg) {
  try{
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    const chat = model.startChat({
      history: [{
        role: "user",
        parts: [{ text: "You are a writing assistant in Microsoft Word. Follow the user's instructions unless illegal. " +
                        "If asked to write or edit a passage(especially when user starts with 'write a passage about...' or 'make it...'), begin your response with 'INDOC=YES' BEFORE ANYTHING and then write the passage ONLY, NO OTHER TEXT (GREETINGS, PERMITTING, ETC.) ALLOWED." +
                        "Make sure to provide a FULL passage with ENOUGH words(unless user tell you not to) and start with a title." +
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
    //store history
    outContent = message;
    history_1 = outContent;
    history_2 = history_1;
    if (outContent.includes("INDOC=YES") && lastFill == ''){
      insertHTML(outContent.replace(/INDOC=YES/g, '' ), "add"); //Word response
      newAIMessage('Done. Feel free to let me edit!');
    }
      else if (outContent.includes("INDOC=YES") && lastFill !== ''){
        insertHTML(outContent.replace(/INDOC=YES/g, '' ), "replaceOld");
        newAIMessage('Done. Feel free to let me edit!');
    }
      else {
        newAIMessage(outContent.replace(/INDOC=YES/g, '' )); //Taskpane response
    }
    selectFile.value = '';
    file_name.textContent = 'Upload your file here'; //Reset file selection
  }
  catch(e){
    newAIMessage('Sorry, but something went wrong. Try checking your network connection or reloading.');
    setTimeout(function() {
      reloadButton.click();
    }, 2000)
  }
}

//Insert HTML to Word
async function insertHTML(html, p) {
  return Word.run(async (context) => {
    switch (p) {
      case "add":
        let paragraph = '';
        paragraph = context.document.body.insertHtml(html, Word.InsertLocation.end);
        lastFill = html;
        await context.sync();
        break;
      case "replaceOld":
        let searchResults = body.search(lastFill, { matchCase: false, matchWholeWord: false });
        context.load(searchResults, 'items');
        await context.sync();
        if (searchResults.items.length > 0) {
          lastFill = html;
          return context.sync().then(function() {
            for (var i = 0; i < searchResults.items.length; i++) {
              searchResults.items[i].insertText(html, Word.InsertLocation.replace);
            }
          })
        } else {
          let paragraph = '';
          paragraph = context.document.body.insertHtml(html, Word.InsertLocation.end);
          lastFill = html;
          await context.sync();
        }
        break;
    }
  });
}

//Reload page
reloadButton.onclick =()=> {
  document.getElementById('chat-input').style.display = 'none';
  setTimeout(function() {
    document.getElementById('chat-input').style.display = 'block';
  }, 2000)
  //location.reload();
}
