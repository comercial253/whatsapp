# WhatsApp Support System

This repository includes a small example of a support chat system. It contains a simple Express backend and a minimal frontend.

## Backend

The Node.js server (`server/index.js`) exposes the following endpoints:

- `POST /users` – create a new user and a personal messages table
- `GET /users` – list users
- `POST /login` – authenticate a user
- `POST /messages/:userId` – store and send a message for a given user
- `GET /messages/:userId` – list stored messages for that user
- `POST /webhook` – receive incoming WhatsApp webhooks
- `GET /conversations` – list all conversations
- `GET /messages/conversation/:id` – list messages of a conversation
- `POST /conversations/:id/assign` – assign a conversation to a user

SQLite is used as a lightweight database. Messages are only printed to the console instead of actually sending to WhatsApp. You can replace the placeholder with real WhatsApp Business API calls.

### Running

```bash
cd server
npm install
node index.js
```

Set the following environment variables before starting if you want to connect to [waapi.app](https://waapi.app):

- `WA_API_TOKEN` – your API token
- `WA_INSTANCE_ID` – the instance id to use

The server listens on port `3000` by default.

## Frontend

Open `client/index.html` in the browser for a simple per-user chat interface.
Support staff can open `client/agent.html` to see all conversations, assign them and reply directly from the browser.

## Notes

This project is a minimal example and does not implement authentication, authorization or a real WhatsApp integration.
