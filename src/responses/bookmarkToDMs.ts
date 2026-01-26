import {
    APIApplicationCommandInteraction,
    APIDMChannel,
    APIMessage,
    APIMessageApplicationCommandInteractionData,
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { createJumpUrl, toCodeblock } from '../utils/helpers'
import { ButtonCustomId, DISCORD_BASE_API } from '../utils/consts'
import { formatBookmarkMessage } from '../utils/formatBookmark'

const CREATE_DM_ENDPOINT = `${DISCORD_BASE_API}/users/@me/channels`

export async function bookmarkToDMsHandler(c: Context, interaction: APIApplicationCommandInteraction) {
    const data = interaction.data as APIMessageApplicationCommandInteractionData
    const interactionAuthorId = interaction.member ? interaction.member.user.id : interaction.user?.id!

    const guildId = interaction.guild?.id ?? '@me' // message to bookmark will be in DMs if this cmd is not used inside a server
    const channel = interaction.channel
    const messageId = data.target_id
    const jumpUrl = createJumpUrl(guildId, channel.id, messageId)

    // To "Bookmark" this message to DMs, the app needs to create a DM channel with the interaction author first.
    const DMChannelResp = await fetch(CREATE_DM_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recipient_id: interactionAuthorId,
        }),
    })
    if (!DMChannelResp.ok) {
        // Failed to create a DM Channel for some reason?
        const err = await DMChannelResp.json()
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `❌ Failed to create a DM Channel with you (this is required for bookmark functionality): ${toCodeblock(
                    JSON.stringify(err, null, 2),
                )}`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }

    const DMChannel = (await DMChannelResp.json()) as APIDMChannel
    // Format the bookmark message to send in DMs using Components V2
    const bookmarkComponent = formatBookmarkMessage(interaction)
    // Add "Dismiss" and "Go to original message" buttons
    bookmarkComponent.push({
        type: ComponentType.ActionRow,
        components: [
            {
                type: ComponentType.Button,
                custom_id: ButtonCustomId.bookmarkDelete,
                label: 'Delete',
                style: ButtonStyle.Danger,
            },
            {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: jumpUrl,
                label: 'Go to original message',
            },
        ],
    })

    const bookmarkedMsgResp = await fetch(`https://discord.com/api/v10/channels/${DMChannel.id}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            flags: MessageFlags.IsComponentsV2,
            components: bookmarkComponent,
        }),
    })
    if (!bookmarkedMsgResp.ok) {
        // Failed to send the bookmark message to DMs for any reason
        const err = await bookmarkedMsgResp.json()
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `❌ Failed to bookmark message to your DM: ${toCodeblock(JSON.stringify(err, null, 2))}`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }
    const bookmarkedMessage = (await bookmarkedMsgResp.json()) as APIMessage
    const bookmarkedJumpUrl = createJumpUrl('@me', bookmarkedMessage.channel_id, bookmarkedMessage.id)

    return c.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: `✅ Bookmarked message (${jumpUrl}) to [DMs](${bookmarkedJumpUrl})`,
            flags: MessageFlags.Ephemeral,
        },
    })
}
