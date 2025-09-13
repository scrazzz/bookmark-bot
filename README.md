# Bookmark Bot
A simple Discord app that lets you bookmark any message directly to your DMs

[![Built with Cloudflare](https://workers.cloudflare.com/built-with-cloudflare.svg)](https://cloudflare.com)

## How-to-use
- Since this is a user-installable app, you can use it in any server without needing to add it as a bot.
- Install the app: [Click here to install](https://discord.com/oauth2/authorize?client_id=812586569902850084)
- Start bookmarking:
  1. Right-click on any message you want to save.
  2. Go to **Apps** -> **Bookmark to DMs**.
  3. The message will be sent to your DMs, neatly formatted for easy reference.

- If you want to bookmark a message to a specific channel via webhook, set it using the `/config` command.

---

## Setup
I strongly recommend using my [app on Discord](https://discord.com/oauth2/authorize?client_id=812586569902850084) rather than setting everything up on your own. It saves you time, effort, and potential headaches.

However, if you still prefer to handle the setup manually, the *reference* for installation and steps are provided below. Please note that these steps may be incorrect or outdated, and I will not provide any support if you choose to set it up on your own.

### Prerequisites
1. Discord account
1. Cloudflare account
1. Discord bot/application (https://discord.com/developers/applications)

### Installation
```
git clone https://github.com/scrazzz/bookmark-bot
cd bookmark-bot
pnpm i
```

Note: I've added my original `wrangler.jsonc` file to `.gitignore`. If you need the default configuration, simply rename `RENAME.wrangler.jsonc` to `wrangler.jsonc`.

### Enviroment / Secrets
- You need to set 3 env variables in your `.env` file.
- You can get these values from the discord.dev portal.
```
# .env
DISCORD_BOT_TOKEN=""
DISCORD_PUBLIC_KEY=""
DISCORD_APPLICATION_ID=""
```

- Cloudflare Workers also need access to the env variables, set it using `wrangler secret put`:
```
pnpm wrangler secret put DISCORD_BOT_TOKEN
pnpm wrangler secret put DISCORD_PUBLIC_KEY
pnpm wrangler secret put DISCORD_APPLICATION_ID
```

- Once you have successfully uploaded the secrets using `wrangler`, run `cf-typegen` so you get autocomplete for your env variables. [Read more](https://developers.cloudflare.com/workers/wrangler/commands/#types):
```
pnpm run cf-typegen
```

### Deployment
After completing the setup steps without errors, you can deploy to Cloudflare Workers:
```
pnpm run deploy
```
If the deployment is successful:
- You’ll see a URL like `https://bookmark-bot.<account>.workers.dev` in your terminal output.
- Set the Interactions Endpoint URL to your deployed worker's `/interactions` path in discord.dev portal.
- Example: `https://bookmark-bot.<account>.workers.dev/interactions`

### Syncing commands
- Syncing commands is as simple as visiting the `/register` route from your workers.dev URL.
- Example: If your workers.dev URL is `https://bookmark-bot.johndoe.workers.dev` then visit `https://bookmark-bot.johndoe.workers.dev/register` in your browser.

---

## Project structre
```gql
src
├── index.ts             # Main entry point
├── commandHandler.ts    # Main interaction handler for all commands
├── commands.ts          # All the commands are defined here
├── componentHandler.ts  # Handler for all message components (buttons)
├── modalHandler.ts      # Handler for all modals
├── handlers
│   ├── bookmarkToDMs.ts
│   ├── bookmarkToWebhook.ts
│   └── config.ts
└── utils
    ├── consts.ts
    ├── helpers.ts
    ├── kv
    │   └── workersKV.ts
    └── log.ts
```

## License
This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE).
