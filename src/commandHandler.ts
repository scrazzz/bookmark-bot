import {
    APIApplicationCommandInteraction,
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { bookmarkHandler, createBookmarkedComponent } from './handlers/bookmark'
import { BOT_WEBHOOK_AVATAR, ButtonCustomId, DISCORD_WEBHOOK_BASE } from './utils/consts'
import { getInteractionAuthor, toCode } from './utils/helpers'
import { getWebhook } from './utils/kv/workersKV'
import { bookmarkToWebhookHandler } from './handlers/bookmarkToWebhook'
import { configHandler } from './handlers/config'

/**
 * This function handles every type of interaction commands and routes to the required command's
 * handler in /handlers/
 */
export async function applicationCommandHandler(c: Context, interaction: APIApplicationCommandInteraction) {
    const command = interaction.data.name

    switch (command) {
        case 'hello': {
            return c.json({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content:
                        "I'm a new soul, I came to this strange world\nHoping I could learn a bit 'bout how to give and take",
                },
            })
        }

        // Main Bot Commands
        case 'Bookmark Message to DMs': {
            return await bookmarkHandler(c, interaction)
        }

        case 'config': {
            return configHandler(c, interaction)
        }

        case 'Bookmark to Webhook': {
            return await bookmarkToWebhookHandler(c, interaction)
        }
    }
}
