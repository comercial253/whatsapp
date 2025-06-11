const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const loginBtn = document.getElementById('loginBtn');
const sendBtn = document.getElementById('sendBtn');
let currentUser = null;

async function loadMessages(){
  if(!currentUser) return;
  const res = await fetch(`http://localhost:3000/messages/${currentUser}`);
  const data = await res.json();
  messagesDiv.innerHTML = '';
  data.forEach(m => {
    const p = document.createElement('p');
    p.textContent = `${m.sent_at}: ${m.message} (${m.phone})`;
    messagesDiv.appendChild(p);
  });
}

loginBtn.addEventListener('click', async () => {
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
    chatDiv.style.display = 'block';
    loadMessages();
  } else {
    alert('Login failed');
  }
});

sendBtn.addEventListener('click', async () => {
  const phone = document.getElementById('phone').value;
  const message = document.getElementById('message').value;
  await fetch(`http://localhost:3000/messages/${currentUser}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({phone, message})
  });
  document.getElementById('message').value = '';
  loadMessages();
});
