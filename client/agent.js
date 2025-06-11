const loginDiv = document.getElementById('login');
const agentDiv = document.getElementById('agent');
const chatDiv = document.getElementById('chat');
const conversationsDiv = document.getElementById('conversations');
const messagesDiv = document.getElementById('messages');
const chatTitle = document.getElementById('chatTitle');
const loginBtn = document.getElementById('loginBtn');
const sendBtn = document.getElementById('sendBtn');
const assignBtn = document.getElementById('assignBtn');
let currentUser = null;
let currentConv = null;

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
  if(!currentConv) return;
  await fetch(`http://localhost:3000/messages/${currentUser}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ phone: currentConv.phone, message })
  });
  document.getElementById('message').value = '';
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
