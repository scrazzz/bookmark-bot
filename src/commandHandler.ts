import { APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10'
import { Context } from 'hono'
import { bookmarkToDMsHandler } from './responses/bookmarkToDMs'
import { bookmarkToWebhookHandler } from './responses/bookmarkToWebhook'
import { configHandler } from './responses/config'
import { aboutmeHandler } from './responses/aboutme'

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

        case 'aboutme': {
            return await aboutmeHandler(c)
        }

        case 'config': {
            return configHandler(c, interaction)
        }

        // Main commands
        case 'Bookmark to DMs': {
            return await bookmarkToDMsHandler(c, interaction)
        }

        case 'Bookmark to Webhook': {
            return await bookmarkToWebhookHandler(c, interaction)
        }
    }
}
