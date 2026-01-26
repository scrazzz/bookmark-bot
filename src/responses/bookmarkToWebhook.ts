import {
    APIApplicationCommandInteraction,
    APIMessage,
    APIWebhook,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { getInteractionAuthor, toCode } from '../utils/helpers'
import { getWebhook } from '../utils/kv'
import { BOT_WEBHOOK_AVATAR, DISCORD_WEBHOOK_BASE } from '../utils/consts'
import { formatBookmarkMessage } from '../utils/formatBookmark'

export async function bookmarkToWebhookHandler(c: Context, interaction: APIApplicationCommandInteraction) {
    const interactionAuthor = getInteractionAuthor(interaction)
    const config = await getWebhook(c, interactionAuthor.id)
    if (config === null) {
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `❌ You have not configured a webhook to bookmark messages. Set it using ${toCode('/config')}`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }

    const webhook = `${DISCORD_WEBHOOK_BASE}/${config.url}?with_components=true&wait=true`
    const bookmarkComponent = formatBookmarkMessage(interaction)
    let webhookGuildId = config.guildId

    if (webhookGuildId === undefined) {
        // Set the Guild ID for this webhook in KV so we don't have to make additional API requests later.
        // webhookGuildId is used to create the message URL so that the user can easily find the config'd webhook after bookmarking.
        const hook = await fetch(webhook)
        if (hook.status === 200) {
            const js: APIWebhook = await hook.json()
            // I'm 99.9% sure the guild ID will be present here
            webhookGuildId = js.guild_id!
        }
    }

    const webhookPostResp = await fetch(webhook, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: `Bookmark Webhook (${config.name})`,
            avatar_url: BOT_WEBHOOK_AVATAR,
            components: bookmarkComponent,
            flags: MessageFlags.IsComponentsV2,
        }),
    })

    if (webhookPostResp.ok) {
        const js: APIMessage = await webhookPostResp.json()
        const messageUrl = `https://discord.com/channels/${webhookGuildId}/${js.channel_id}/${js.id}`
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `✅ Bookmarked message to configured webhook (${config.name})\n${messageUrl}`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }

    // Sending the webhook failed, inform the user about it
    return c.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: `❌ Failed to bookmark this message to your configured webhook (${config.name}): ${toCode(
                webhookPostResp.status + webhookPostResp.statusText,
            )}`,
            flags: MessageFlags.Ephemeral,
        },
    })
}
