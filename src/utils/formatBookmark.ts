import {
    APIApplicationCommandInteraction,
    APIChannel,
    APIContainerComponent,
    APIMessageApplicationCommandInteractionData,
    APIMessageTopLevelComponent,
    ComponentType,
    MessageReferenceType,
} from 'discord-api-types/v10'
import { createJumpUrl, formatUsername, toCode, toUnixTimestamp } from './helpers'
import { SUPPORTED_MIMES } from './consts'

function isNsfwChannelType(channel: Partial<APIChannel>) {
    return 'nsfw' in channel && channel.nsfw
}

export function formatBookmarkMessage(interaction: APIApplicationCommandInteraction) {
    const data = interaction.data as APIMessageApplicationCommandInteractionData
    const messageId = data.target_id
    const guildId = interaction.guild?.id ?? '@me' // will be in DMs if this cmd is not used in a guild
    const message = data.resolved.messages[messageId]
    const jumpUrl = createJumpUrl(guildId, interaction.channel.id, messageId)
    const isNsfwChannel = isNsfwChannelType(interaction.channel)

    const bookmarkComponent: [APIContainerComponent, APIMessageTopLevelComponent?] = [
        {
            type: ComponentType.Container,
            components: [
                {
                    type: ComponentType.TextDisplay,
                    content: `From **${toCode(formatUsername(message.author))}** (${toCode(message.author.id)}) in **${
                        interaction.channel.name ? toCode('#' + interaction.channel.name) : 'Your DMs'
                    }**`,
                },
                {
                    type: ComponentType.TextDisplay,
                    content: `${jumpUrl}`,
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
                spoiler: isNsfwChannel,
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

    // Check if this is a FORWARDED message
    // If it is then only the things mentioned inside this if scope will be shown
    if (message.message_reference?.type === MessageReferenceType.Forward) {
        const messgeSnapshot = message.message_snapshots![0].message
        container.push({
            type: ComponentType.TextDisplay,
            content: `-# ***➦ Forwarded Message***`,
        })
        if (messgeSnapshot.content.trim().length > 0) {
            container.push({
                type: ComponentType.TextDisplay,
                content: `>>> ${messgeSnapshot.content}`,
            })
        }
        // Add attachments too
        if (messgeSnapshot.attachments.length > 0) {
            const totalAttachments = messgeSnapshot.attachments.length
            container.push({
                type: ComponentType.TextDisplay,
                content: `> **Attachments** ${
                    totalAttachments >= 10 ? `\nShowing 10 (${totalAttachments} present)` : `(${totalAttachments})`
                }`,
            })
            const mediaAttachments = messgeSnapshot.attachments
                .slice(0, 9)
                .filter((a) => a.content_type && SUPPORTED_MIMES.includes(a.content_type))
                .map((a) => ({
                    media: { url: a.proxy_url },
                    spoiler: isNsfwChannel,
                }))
            if (mediaAttachments.length) {
                container.push({
                    type: ComponentType.MediaGallery,
                    items: mediaAttachments,
                })
            }
            const otherAttachments = messgeSnapshot.attachments
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
    }

    // message timestamp
    container.push({
        type: ComponentType.Separator,
    })
    container.push({
        type: ComponentType.TextDisplay,
        content: toUnixTimestamp(message.timestamp, 'R'),
    })
    // If message has any embeds mention that
    if (message.embeds.length > 0) {
        container.push({
            type: ComponentType.TextDisplay,
            content: `-# Original message contains ${message.embeds.length} embed(s)`,
        })
    }
    // If message is from an NSFW channel display a warning
    if (isNsfwChannel) {
        container.push({
            type: ComponentType.TextDisplay,
            content: '-# ⚠️ Bookmarked from an NSFW channel',
        })
    }

    return bookmarkComponent
}
