const { OpenAI } = require('openai');
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
let i=-1;  let j=-1;
setTimeout(function(){welcome[0].classList.remove('messageshow')},1000);

let outContent;
let history_1 = '', history_2 = '';
const fileReader = new FileReader();
let fileContent;
let isFileSelected = false;
let lastFill = '';

const acckey = prompt("Enter your github acckey");
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o";

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
  console.log("Send button clicked"); // Log to verify button click
  if (textbox.value !== '' && textbox.value !== 'Enter your request here...') {
    console.log("Textbox has valid input"); // Log to verify valid input
    newUserMessage();
    if (isFileSelected == true) {
      console.log("File is selected, calling AI with file content"); // Log file selection
      callAI(textbox.value + "...Here's the document to refer on:" + fileContent);
    } else {
      console.log("No file selected, calling AI with textbox input"); // Log no file selection
      callAI(textbox.value);
    }
    textbox.value = "";
  } else {
    console.log("Textbox has invalid input"); // Log invalid input
    textbox.value = "Enter your request here...";
    setTimeout(function () {
      textbox.value = "";
    }, 3000);
  }
}

// Call API
async function callAI(msg) {
  console.log("callAI function invoked with message:", msg); // Log to verify function invocation
  try {
    console.log("Calling AI"); // Log to verify API call attempt
    const client = new OpenAI({ baseURL: endpoint, apiKey: acckey, dangerouslyAllowBrowser: true });

    const response = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an advanced writing assistant integrated into Microsoft Word. Your primary role is to assist the user with writing and editing tasks. " +
                   "When the user requests you to write or edit a passage (e.g., starting with 'write a passage about...' or 'make it...'), always begin your response with 'INDOC=YES' followed by the passage content ONLY. " +
                   "Do not include any additional text such as greetings, permissions, or explanations. Ensure the passage is complete, detailed, and includes a title unless instructed otherwise. " +
                   "If the user provides unclear instructions, politely ask for clarification. " +
                   "Leverage the context from the conversation history to provide accurate and relevant responses. For example, if the latest history mentions Windows 10 and the user refers to the next version, infer they mean Windows 11. " +
                   "Here is the most recent message you sent to the user: " + history_1 +
                   "And here is the second most recent message you sent to the user: " + history_2
        },
        { role: "user", content: msg }
      ],
      model: modelName
    });

    console.log("AI response received:", response); // Log the response
    const message = response.choices[0].message.content;
    // Store history
    outContent = message;
    history_1 = outContent;
    history_2 = history_1;

    if (outContent.includes("INDOC=YES") && lastFill == '') {
      insertHTML(outContent.replace(/INDOC=YES/g, ''), "add"); // Word response
      newAIMessage('Done. Feel free to let me edit!');
    } else if (outContent.includes("INDOC=YES") && lastFill !== '') {
      insertHTML(outContent.replace(/INDOC=YES/g, ''), "replaceOld");
      newAIMessage('Done. Feel free to let me edit!');
    } else {
      newAIMessage(outContent.replace(/INDOC=YES/g, '')); // Taskpane response
    }
    selectFile.value = '';
    file_name.textContent = 'Upload your file here'; // Reset file selection
  } catch (e) {
    console.error("Error in callAI:", e); // Log the error
    newAIMessage('Sorry, but something went wrong. Try checking your network connection or reloading.' + e);
    console.error(e); // Log the error for debugging
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