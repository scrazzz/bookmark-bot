import {
    APIApplicationCommandInteraction,
    APIContainerComponent,
    APIDMChannel,
    APIMessage,
    APIMessageApplicationCommandInteractionData,
    APIMessageTopLevelComponent,
    ButtonStyle,
    ChannelType,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { createJumpUrl, formatUsername, toCode, toCodeblock, toUnixTimestamp } from '../utils/helpers'
import { ButtonCustomId, DISCORD_BASE_API, SUPPORTED_MIMES } from '../utils/consts'

const CREATE_DM_ENDPOINT = `${DISCORD_BASE_API}/users/@me/channels`

export async function bookmarkHandler(c: Context, interaction: APIApplicationCommandInteraction) {
    const data = interaction.data as APIMessageApplicationCommandInteractionData
    const interactionAuthorId = interaction.member ? interaction.member.user.id : interaction.user?.id! // user.id should not be undefined here (hopefully)

    const guildId = interaction.guild?.id ?? '@me' // will be in DMs if this cmd is not used in a guild
    const channel = interaction.channel
    const messageId = data.target_id
    const jumpUrl = createJumpUrl(guildId, channel.id, messageId)
    const message = data.resolved.messages[messageId]

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
                    JSON.stringify(err, null, 2)
                )}`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }
    const DMChannel = (await DMChannelResp.json()) as APIDMChannel

    // Now send the message to bookmark to the created DM Channel
    // But first we need to format the Bookmark message to send in DMs using Components
    // TODO: fix this weird typehint?
    const bookmarkComponent: [APIContainerComponent, APIMessageTopLevelComponent?] = [
        {
            type: ComponentType.Container,
            components: [
                {
                    type: ComponentType.TextDisplay,
                    content: `- From **${toCode(formatUsername(message.author))}** (${toCode(
                        message.author.id
                    )}) in **${channel.name ? toCode('#' + channel.name) : 'Your DMs'}**`,
                },
                {
                    type: ComponentType.TextDisplay,
                    content: `- ${jumpUrl}`,
                },
                {
                    type: ComponentType.Separator,
                },
            ],
        },
    ]
    const container = bookmarkComponent[0].components

    // If there's any message content
    if (message.content.trim().length > 0) {
        container.push({
            type: ComponentType.TextDisplay,
            content: `**Content**\n${message.content}`,
        })
    }
    // If message has any attachments
    if (message.attachments.length > 0) {
        const totalAttachments = message.attachments.length
        container.push({
            type: ComponentType.TextDisplay,
            content: `**Attachments** ${
                totalAttachments >= 10 ? `\nShowing 10 (${totalAttachments} present)` : `(${totalAttachments})`
            }`,
        })
        // Push image/video/gif attachments via MediaGallery
        const mediaAttachments = message.attachments
            .slice(0, 9)
            .filter((a) => a.content_type && SUPPORTED_MIMES.includes(a.content_type))
            .map((a) => ({
                media: { url: a.proxy_url },
                spoiler: interaction.channel.type === ChannelType.GuildText ? interaction.channel.nsfw : false,
            }))
        if (mediaAttachments.length) {
            container.push({
                type: ComponentType.MediaGallery,
                items: mediaAttachments,
            })
        }
        // Just mention the url for other attachments
        const otherAttachments = message.attachments
            .filter((a) => a.content_type && !SUPPORTED_MIMES.includes(a.content_type))
            .map((a) => `[${a.filename}](${a.proxy_url})`)
            .join('\n')
        if (otherAttachments.length) {
            container.push({
                type: ComponentType.TextDisplay,
                content: otherAttachments,
            })
        }
    }

    // message timestamp
    container.push({
        type: ComponentType.Separator,
    })
    container.push({
        type: ComponentType.TextDisplay,
        content: toUnixTimestamp(message.timestamp, 'R'),
    })
    // If message has embeds mention that (bots can send embeds)
    if (message.embeds.length > 0) {
        container.push({
            type: ComponentType.TextDisplay,
            content: `-# Original message contains ${message.embeds.length} embeds(s)`,
        })
    }
    // If the message is from an NSFW channel add a small warning
    if (interaction.channel.type == ChannelType.GuildText && interaction.channel.nsfw) {
        container.push({
            type: ComponentType.TextDisplay,
            content: '-# ⚠️ Bookmarked from an NSFW channel',
        })
    }
    // Add the Dismiss button
    bookmarkComponent.push({
        type: ComponentType.ActionRow,
        components: [
            {
                type: ComponentType.Button,
                custom_id: ButtonCustomId.bookmarkDismiss,
                label: 'Dismiss',
                style: ButtonStyle.Danger,
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
        // Failed to bookmark the message to DMs for any reason
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
