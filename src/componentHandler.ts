import {
    APIMessageComponentInteraction,
    APIModalInteractionResponseCallbackData,
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
    TextInputStyle,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import {
    ButtonCustomId,
    DISCORD_BASE_API,
    DISCORD_WEBHOOK_BASE,
    ModalCustomId,
    TextInputCustomId,
} from './utils/consts'
import { getInteractionAuthor, toCode } from './utils/helpers'
import { deleteWebhook, getWebhook } from './utils/kv'

/**
 * This function handles message components (buttons etc).
 *
 * The `custom_id` (defined as "const interactionId") is used to check what component the user interacted with.
 * Every component has a `custom_id`
 *
 */
export async function messageComponentHandler(c: Context, interaction: APIMessageComponentInteraction) {
    const interactionId = interaction.data.custom_id

    if (interactionId === ButtonCustomId.bookmarkDelete) {
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: '⚠️ Are you sure you want to delete this bookmark?\n- **This action cannot be undone**',
                flags: MessageFlags.Ephemeral,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: ButtonStyle.Danger,
                                label: 'Yes, DELETE the bookmark',
                                custom_id: ButtonCustomId.bookmarkDeleteConfirm + '-' + interaction.message.id,
                            },
                        ],
                    },
                ],
            },
        })
    }

    if (interactionId.startsWith(ButtonCustomId.bookmarkDeleteConfirm)) {
        const bookmarkMessageId = interaction.data.custom_id.split('-')[1]
        // Delete the bookmarked message
        // interaction.channel.id will be the DMChannel with the bot/app
        await deleteMessage(c.env.DISCORD_BOT_TOKEN, interaction.channel.id, bookmarkMessageId)
        return c.json({
            type: InteractionResponseType.UpdateMessage,
            data: {
                content: 'Deleted!',
                flags: MessageFlags.Ephemeral,
                components: [],
            },
        })
    }

    if (interactionId === ButtonCustomId.configAdd) {
        const modal: APIModalInteractionResponseCallbackData = {
            title: 'Bookmark Config',
            custom_id: ModalCustomId.configAdd,
            components: [
                {
                    type: ComponentType.TextDisplay,
                    content: `⚠️ Add an easy to remember ${toCode(
                        'Name',
                    )} (ex: server name or channel name) for this webhook so you don't forget.`,
                },
                {
                    type: ComponentType.Label,
                    label: 'Name',
                    description: 'Name this webhook so you know what it is',
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
                    description: 'Enter a valid Discord Webhook URL',
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

    if (interactionId === ButtonCustomId.configRemove) {
        const interactionAuthor = getInteractionAuthor(interaction)
        const config = await getWebhook(c, interactionAuthor.id)
        if (config === null) {
            return c.json({
                type: InteractionResponseType.UpdateMessage,
                data: {
                    content:
                        '❌ No existing config found. Add new config below where you can set a webhook to bookmark messages to',
                    flags: MessageFlags.Ephemeral,
                },
            })
        }

        // Delete the configured webhook
        await deleteWebhook(c, interactionAuthor.id)
        return c.json({
            type: InteractionResponseType.UpdateMessage,
            data: {
                content: `✅ Deleted configured webhook (${config.name})`,
                flags: MessageFlags.Ephemeral,
                components: [],
            },
        })
    }

    if (interactionId === ButtonCustomId.configView) {
        const interactionAuthor = getInteractionAuthor(interaction)
        const config = await getWebhook(c, interactionAuthor.id)
        if (config === null) {
            return c.json({
                type: InteractionResponseType.UpdateMessage,
                data: {
                    content:
                        '❌ No existing config found. Add new config where you can set a webhook to bookmark messages to',
                    flags: MessageFlags.Ephemeral,
                },
            })
        } else {
            return c.json({
                type: InteractionResponseType.UpdateMessage,
                data: {
                    content: `- ${toCode(config.name)}: ||${DISCORD_WEBHOOK_BASE}/${config.url}||`,
                    flags: MessageFlags.Ephemeral,
                },
            })
        }
    }
}

export async function deleteMessage(botToken: string, channelId: string, messageId: string) {
    const resp = await fetch(`${DISCORD_BASE_API}/channels/${channelId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
            'User-Agent': `BookmarkBot (https://github.com/scrazzz/bookmark-bot)`,
            Authorization: `Bot ${botToken}`,
        },
    })
    return resp.ok
}
