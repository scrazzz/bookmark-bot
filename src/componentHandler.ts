import { APIMessageComponentInteraction, ButtonStyle, ComponentType, MessageFlags } from 'discord-api-types/v10'
import { InteractionResponseType } from 'discord-interactions'
import { Context } from 'hono'
import { ButtonCustomId } from './utils/consts'
import { deleteMessage } from './utils/helpers'

/**
 * This function handles message components (buttons etc).
 *
 * The `custom_id` (defined as "const interactionId") is used to check what component the user interacted with.
 * Every component has a `custom_id`
 *
 * Currently we have the following cases:
 *   1. User clicks the "Dismiss" button below the bookmarked message from the bot's DM
 *   2. User clicks the "DELETE" confirmation button that was sent in (step 1.)
 *
 */
export async function messageComponentHandler(c: Context, interaction: APIMessageComponentInteraction) {
    const interactionId = interaction.data.custom_id

    if (interactionId === ButtonCustomId.bookmarkDismiss) {
        return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content:
                    '- Are you sure you want to delete this bookmark?\n:warning: **This action cannot be undone.**',
                flags: MessageFlags.Ephemeral,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: ButtonStyle.Danger,
                                label: 'Yes, DELETE the bookmark',
                                custom_id: ButtonCustomId.bookmarkDismissConfirm + '-' + interaction.message.id,
                            },
                        ],
                    },
                ],
            },
        })
    }

    if (interactionId.startsWith(ButtonCustomId.bookmarkDismissConfirm)) {
        const bookmarkMessageId = interaction.data.custom_id.split('-')[1]
        // Delete the bookmarked message
        // interaction.channel.id will be the DMChannel with the bot/app
        await deleteMessage(c.env.DISCORD_BOT_TOKEN, interaction.channel.id, bookmarkMessageId)
        return c.json({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
                content: 'Deleted!',
                flags: MessageFlags.Ephemeral,
                components: [],
            },
        })
    }
}
