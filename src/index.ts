import { Hono } from 'hono'
import { APPLICATION_COMMANDS } from './commands'
import { InteractionResponseType, verifyKey } from 'discord-interactions'
import {
    APIApplicationCommand,
    APIGuild,
    APIInteraction,
    APIUser,
    APIWebhookEvent,
    APIWebhookEventApplicationAuthorizedData,
    APIWebhookEventApplicationDeauthorizedData,
    ApplicationIntegrationType,
    ApplicationWebhookEventType,
    ApplicationWebhookType,
    InteractionType,
} from 'discord-api-types/v10'
import { applicationCommandHandler } from './commandHandler'
import { messageComponentHandler } from './componentHandler'
import { DISCORD_BASE_API, DISCORD_IMAGE_BASE } from './utils/consts'
import { modalHandler } from './modalHandler'
import { toCode, toCodeblock, toUnixTimestamp } from './utils/helpers'

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
            'User-Agent': 'BookmarkBot (https://github.com/scrazzz/bookmark-bot)',
            'Content-Type': 'application/json',
            Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}`,
        },
        method: 'PUT',
        body: JSON.stringify(APPLICATION_COMMANDS),
    })
    if (resp.ok) {
        const cmds = (await resp.json()) as Array<APIApplicationCommand>
        return c.json({
            status: resp.status,
            message: 'Registered all commands',
            cmds: cmds.map((c) => ({ name: c.name, desc: c.description, type: c.type })),
        })
    } else {
        c.status(400)
        let err = undefined
        if (resp.headers.get('Content-Type') === 'application/json') {
            err = await resp.json()
        } else {
            err = await resp.text()
        }
        return c.json({
            status: resp.status,
            message: err,
        })
    }
})

// Webhook events from Discord
app.post('/webhook_events', async (c) => {
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

    // Respond to PING
    const webhookEventPayload = JSON.parse(rawBody) as APIWebhookEvent
    switch (webhookEventPayload.type) {
        case ApplicationWebhookType.Ping: {
            return c.json({ type: 0 })
        }

        case ApplicationWebhookType.Event: {
            const eventBody = webhookEventPayload.event
            let fmt = `- ${eventBody.type} on ${toUnixTimestamp(eventBody.timestamp)} (${toUnixTimestamp(
                eventBody.timestamp,
                'R'
            )})\n`

            function createAvatarUrl(user: APIUser) {
                return `${DISCORD_IMAGE_BASE}/avatars/${user.id}/${user.avatar}.webp?animated=true`
            }

            function createGuildImageUrl(guild: APIGuild, type: 'icon' | 'banner') {
                if (type === 'icon') return `${DISCORD_IMAGE_BASE}/icons/${guild.id}/${guild.icon}.webp?animated=true`
                else return `${DISCORD_IMAGE_BASE}/banners/${guild.id}/${guild.banner}.webp?animated=true`
            }

            if (eventBody.type === ApplicationWebhookEventType.ApplicationAuthorized) {
                const data = eventBody.data as APIWebhookEventApplicationAuthorizedData
                const user = data.user
                const uavatar = createAvatarUrl(user)
                fmt += `- Installation type: ${data.integration_type === 0 ? 'GUILD' : 'USER'}\n`
                fmt += `- Auth'd by:\n${toCodeblock(
                    `Username: @${user.username}\nGlobalName: ${user.global_name}\nID: ${user.id}`
                )}\n[Avatar](${uavatar})`

                if (data.integration_type === ApplicationIntegrationType.GuildInstall) {
                    const guild = data.guild!
                    const gicon = createGuildImageUrl(guild, 'icon')
                    const gbanner = createGuildImageUrl(guild, 'banner')
                    fmt += toCodeblock(
                        `Name: ${guild.name} (${guild.id})\nDesc: ${guild.description}\nOwner ID: ${guild.owner_id}\nVanity URL: ${guild.vanity_url_code}\nNSFW Level: ${guild.nsfw_level}\n`
                    )
                    fmt += `[Icon](${gicon}) | [Banner](${gbanner})`
                    await fetch(c.env.WEBHOOK_CHANNEL, {
                        method: 'POST',
                        body: JSON.stringify({
                            content: fmt,
                            username: `BookmarkBot Event - ${eventBody.type}`,
                        }),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                }
            } else {
                const data = eventBody.data as APIWebhookEventApplicationDeauthorizedData
                const u = data.user
                const uavatar = `${DISCORD_IMAGE_BASE}/avatars/${u.id}/${u.avatar}.webp?animated=true`
                const fmt = `- ${eventBody.type} by [${toCode('@' + data.user.username)}](${uavatar}) (${toCode(
                    data.user.id
                )}) on ${toUnixTimestamp(eventBody.timestamp)} (${toUnixTimestamp(eventBody.timestamp, 'R')})`

                await fetch(c.env.WEBHOOK_CHANNEL, {
                    method: 'POST',
                    body: JSON.stringify({
                        content: fmt,
                        username: `BookmarkBot Event - ${eventBody.type}`,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            }

            return c.body(null, 204)
        }
    }
})

export default app
