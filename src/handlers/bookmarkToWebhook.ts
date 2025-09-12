import { APIApplicationCommandInteraction, InteractionResponseType, MessageFlags } from 'discord-api-types/v10'
import { Context } from 'hono'
import { getInteractionAuthor, toCode } from '../utils/helpers'
import { getWebhook } from '../utils/kv/workersKV'
import { BOT_WEBHOOK_AVATAR, DISCORD_WEBHOOK_BASE } from '../utils/consts'
import { createBookmarkedComponent } from './bookmarkToDMs'

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

    const webhookURL = `${DISCORD_WEBHOOK_BASE}/${config.url}?with_components=true&wait=true`
    const bookmarkComponent = createBookmarkedComponent(interaction)

    const webhookResp = await fetch(webhookURL, {
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
    if (!webhookResp.ok) {
        // Sending the webhook failed, inform the user about it
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `❌ Failed to bookmark this message to your configured webhook (${config.name}): ${toCode(
                    webhookResp.status + webhookResp.statusText
                )}`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }

    return c.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: `✅ Bookmarked message to your configured webhook (${config.name})`,
            flags: MessageFlags.Ephemeral,
        },
    })
}
