# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**manbou-bot** is a LINE messaging bot that uses the Claude API to power an empathetic companion character named "マンボウ" (a pufferfish). The bot is designed for users with ADHD — it listens and validates rather than advising or solving. The entire bot lives in a single file: `index.js`.

## Commands

```bash
# Install dependencies
npm install

# Start the bot server (default port 3000)
npm start

# Run with a custom port
PORT=8080 npm start
```

There are no tests and no linter configured.

## Environment Variables

Copy `env.example` to `.env` and populate:

```
LINE_CHANNEL_ACCESS_TOKEN=   # From LINE Developers Console
LINE_CHANNEL_SECRET=         # From LINE Developers Console
ANTHROPIC_API_KEY=           # From Anthropic Console
PORT=3000                    # Optional, defaults to 3000
```

## Architecture

The bot is a single Express server (`index.js`) that:

1. Exposes a `POST /webhook` endpoint — LINE's platform POSTs events here after the webhook URL is registered in the LINE Developers Console.
2. LINE middleware (`line.middleware(lineConfig)`) validates the request signature using `LINE_CHANNEL_SECRET` before the handler runs.
3. `handleEvent()` dispatches on event type:
   - `follow` — user adds the bot as a friend → sends `FIRST_MESSAGE`
   - `message` (text only) — all other message types are ignored with `return null`
4. For text messages, per-user conversation history is maintained in an in-memory `Map<userId, {role, content}[]>`. History is capped at 20 messages (older entries spliced out).
5. The history array is passed directly as the `messages` parameter to `anthropic.messages.create`, with `SYSTEM_PROMPT` passed separately as the `system` parameter.
6. Claude's reply is appended to the history and sent back via `lineClient.replyMessage`.

**State is in-memory only** — all conversation history is lost on process restart.

## Key Constants

- `SYSTEM_PROMPT` — Defines the Manbou character in Japanese. Governs personality, speech style, empathy approach, and hard constraints (no advice unless asked, no blame, ADHD-aware pacing). Do not alter this without understanding the character design intent.
- `FIRST_MESSAGE` — Sent once when a user first follows the bot.
- Model in use: `claude-opus-4-5`, `max_tokens: 1000`.

## LINE Webhook Setup

For local development, the LINE platform requires a publicly accessible HTTPS URL. Use a tunneling tool (e.g., ngrok) and register the URL (`https://<your-tunnel>/webhook`) in the LINE Developers Console under Messaging API settings.
