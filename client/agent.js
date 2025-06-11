const loginDiv = document.getElementById('login');
const agentDiv = document.getElementById('agent');
const chatDiv = document.getElementById('chat');
const conversationsDiv = document.getElementById('conversations');
const messagesDiv = document.getElementById('messages');
const chatTitle = document.getElementById('chatTitle');
const loginBtn = document.getElementById('loginBtn');
const sendBtn = document.getElementById('sendBtn');
const assignBtn = document.getElementById('assignBtn');
const mediaInput = document.getElementById('media');
let currentUser = null;
let currentConv = null;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadConversations(){
  const res = await fetch('http://localhost:3000/conversations');
  const data = await res.json();
  conversationsDiv.innerHTML = '';
  data.forEach(c => {
    const p = document.createElement('p');
    p.textContent = c.phone + (c.assigned_to ? ` (user ${c.assigned_to})` : '');
    p.style.cursor = 'pointer';
    p.onclick = () => openConversation(c);
    conversationsDiv.appendChild(p);
  });
}

async function openConversation(c){
  currentConv = c;
  chatTitle.textContent = c.phone;
  agentDiv.style.display = 'none';
  chatDiv.style.display = 'block';
  loadMessages();
}

async function loadMessages(){
  if(!currentConv) return;
  const res = await fetch(`http://localhost:3000/messages/conversation/${currentConv.id}`);
  const data = await res.json();
  messagesDiv.innerHTML = '';
  data.forEach(m => {
    const p = document.createElement('p');
    p.textContent = `${m.direction}: ${m.message}`;
    messagesDiv.appendChild(p);
    if (m.media_data) {
      const link = document.createElement('a');
      link.href = `data:${m.media_mimetype};base64,${m.media_data}`;
      link.textContent = 'attachment';
      link.target = '_blank';
      messagesDiv.appendChild(link);
    }
  });
}

loginBtn.onclick = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  if(res.ok){
    const data = await res.json();
    currentUser = data.id;
    loginDiv.style.display = 'none';
    agentDiv.style.display = 'block';
    loadConversations();
  }else{
    alert('Login failed');
  }
};

sendBtn.onclick = async () => {
  const message = document.getElementById('message').value;
  const file = mediaInput.files[0];
  let media = null;
  if(file){
    media = { mimetype: file.type, data: await fileToBase64(file) };
  }
  if(!currentConv) return;
  await fetch(`http://localhost:3000/messages/${currentUser}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ phone: currentConv.phone, message, media })
  });
  document.getElementById('message').value = '';
  mediaInput.value = '';
  loadMessages();
  loadConversations();
};

assignBtn.onclick = async () => {
  if(!currentConv) return;
  await fetch(`http://localhost:3000/conversations/${currentConv.id}/assign`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ userId: currentUser })
  });
  loadConversations();
};
