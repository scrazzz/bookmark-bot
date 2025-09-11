import { Hono } from 'hono'
import { APPLICATION_COMMANDS } from './commands'
import { InteractionResponseType, verifyKey } from 'discord-interactions'
import { APIInteraction, InteractionType } from 'discord-api-types/v10'
import { applicationCommandHandler } from './appCommandHandler'
import { messageComponentHandler } from './componentHandler'
import { DISCORD_BASE_API } from './utils/consts'
import { modalHandler } from './handlers/modalHandler'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/', (c) => {
    return c.text('Hello Hono!')
})

app.post('/interactions', async (c) => {
    const signature = c.req.header('X-Signature-Ed25519')
    const timestamp = c.req.header('X-Signature-Timestamp')
    if (!signature || !timestamp) {
        return c.text('Missing signature headers', 401)
    }

    const rawBody = await c.req.text()
    const isValid = await verifyKey(rawBody, signature, timestamp, c.env.DISCORD_PUBLIC_KEY)
    if (!isValid) {
        return c.text('Bad request signature', 401)
    }

    const interaction = JSON.parse(rawBody) as APIInteraction
    switch (interaction.type) {
        case InteractionType.Ping:
            return c.json({ type: InteractionResponseType.PONG })

        case InteractionType.ApplicationCommand:
            return applicationCommandHandler(c, interaction)

        case InteractionType.MessageComponent:
            return messageComponentHandler(c, interaction)

        case InteractionType.ModalSubmit:
            return modalHandler(c, interaction)

        default:
            return c.text('Unhandled interaction type', 400)
    }
})

// @ts-ignore
app.get('/register', async (c) => {
    const resp = await fetch(`${DISCORD_BASE_API}/applications/${c.env.DISCORD_APPLICATION_ID}/commands`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}`,
        },
        method: 'PUT',
        body: JSON.stringify(APPLICATION_COMMANDS),
    })
    if (resp.ok) {
        return c.json({
            status: resp.status,
            message: 'Registered all commands',
            cmds: await resp.json(),
        })
    } else {
        c.status(400)
        return c.json({
            status: resp.status,
            message: await resp.json(),
        })
    }
})

export default app
