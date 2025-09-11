import {
    APIApplicationCommandInteraction,
    APIModalInteractionResponseCallbackData,
    ComponentType,
    InteractionResponseType,
    TextInputStyle,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { bookmarkHandler } from './handlers/bookmark'
import { ModalCustomId, TextInputCustomId } from './utils/consts'
import { toCode } from './utils/helpers'

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

        case 'config_add': {
            const modal: APIModalInteractionResponseCallbackData = {
                title: 'Bookmark Config',
                custom_id: ModalCustomId.configAdd,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `### Add an easy to remember ${toCode('Name')} that maps to a ${toCode(
                            'Webhook URL'
                        )} to save your bookmarks.`,
                    },
                    {
                        type: ComponentType.Label,
                        label: 'Name',
                        description: 'Example: "Todo", "Important stuff", etc.',
                        component: {
                            type: ComponentType.TextInput,
                            custom_id: TextInputCustomId.configAddName,
                            style: TextInputStyle.Short,
                            min_length: 3,
                            max_length: 40,
                        },
                    },
                    {
                        type: ComponentType.Label,
                        label: 'Webhook URL',
                        description: 'Enter a valid Discord Webhook URL.',
                        component: {
                            type: ComponentType.TextInput,
                            custom_id: TextInputCustomId.configAddWebhook,
                            style: TextInputStyle.Short,
                            min_length: 115, // 118
                        },
                    },
                ],
            }
            return c.json({
                type: InteractionResponseType.Modal,
                data: modal,
            })
        }
    }
}
