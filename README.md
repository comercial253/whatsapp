# WhatsApp Support System

This repository includes a small example of a support chat system. It contains a simple Express backend and a minimal frontend.

## Backend

The Node.js server (`server/index.js`) exposes the following endpoints:

- `POST /users` – create a new user and a personal messages table
- `GET /users` – list users
- `POST /login` – authenticate a user
- `POST /messages/:userId` – store and send a message for a given user
- `GET /messages/:userId` – list stored messages for that user
- `POST /webhook` – receive incoming WhatsApp webhooks in the format provided by waapi.app
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

### Webhook format

The `/webhook` endpoint expects the JSON structure used by waapi.app. A simplified example:

```json
{
  "event": "message",
  "data": {
    "message": { "from": "123456789@c.us", "body": "Hello" },
    "media": { "mimetype": "image/jpeg", "data": "<base64>" }
  }
}
```

Incoming messages and optional media are stored in the `conversation_messages` table.
Outgoing messages can also include a `media` object with `mimetype` and base64 `data`.

## Frontend

When the server is running, open [http://localhost:3000](http://localhost:3000) to access the agent console.
From there you can see all conversations, assign them and reply with text or attachments.
The old per-user page is still available at `client/index.html` for quick tests.

## Notes

This project is a minimal example and does not implement authentication, authorization or a real WhatsApp integration.
