const form = document.getElementById('msgForm');
const log = document.getElementById('log');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    user_id: document.getElementById('user_id').value,
    phone: document.getElementById('phone').value,
    message: document.getElementById('message').value
  };
  const res = await fetch('http://localhost:3000/messages', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  log.textContent += JSON.stringify(data) + '\n';
});
