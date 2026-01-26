import {
    APIApplicationCommandInteraction,
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { bookmarkToDMsHandler } from './responses/bookmarkToDMs'
import { bookmarkToWebhookHandler } from './responses/bookmarkToWebhook'
import { configHandler } from './responses/config'
import { BOT_INSTALL_URL } from './utils/consts'

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
            return c.json({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `Easily bookmark any message from any server - right to your DMs or to a specific channel via Webhook.\n-# Developed by @scruzism`,
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Link,
                                    label: 'Add Bot',
                                    url: BOT_INSTALL_URL,
                                },
                            ],
                        },
                    ],
                },
            })
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
