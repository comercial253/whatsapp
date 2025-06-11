# WhatsApp Support System

This repository includes a small example of a support chat system. It contains a simple Express backend and a minimal frontend.

## Backend

The Node.js server (`server/index.js`) exposes the following endpoints:

- `POST /users` – create a new user
- `GET /users` – list users
- `POST /messages` – store and (placeholder) send a message
- `GET /messages` – list stored messages

SQLite is used as a lightweight database. Messages are only printed to the console instead of actually sending to WhatsApp. You can replace the placeholder with real WhatsApp Business API calls.

### Running

```bash
cd server
npm install
node index.js
```

The server listens on port `3000` by default.

## Frontend

Open `client/index.html` in the browser. It contains a small form where you can specify a user ID, phone number and message. Messages are sent via fetch requests to the backend.

## Notes

This project is a minimal example and does not implement authentication, authorization or a real WhatsApp integration.
