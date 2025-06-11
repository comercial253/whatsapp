# WhatsApp Support System

This repository includes a small example of a support chat system. It contains a simple Express backend and a minimal frontend.

## Backend

The Node.js server (`server/index.js`) exposes the following endpoints:

- `POST /users` – create a new user and a personal messages table
- `GET /users` – list users
- `POST /login` – authenticate a user
- `POST /messages/:userId` – store and (placeholder) send a message for a given user
- `GET /messages/:userId` – list stored messages for that user

SQLite is used as a lightweight database. Messages are only printed to the console instead of actually sending to WhatsApp. You can replace the placeholder with real WhatsApp Business API calls.

### Running

```bash
cd server
npm install
node index.js
```

The server listens on port `3000` by default.

## Frontend

Open `client/index.html` in the browser. After logging in with a user, you can send messages through a simple chat interface. Messages are loaded and sent via fetch requests to the backend.

## Notes

This project is a minimal example and does not implement authentication, authorization or a real WhatsApp integration.
