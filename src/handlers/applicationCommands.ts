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
import { createJumpUrl, formatUsername, toCode, toCodeblock } from '../utils/helpers'
import { ButtonCustomId, DISCORD_BASE_API } from '../utils/consts'

const CREATE_DM_ENDPOINT = `${DISCORD_BASE_API}/users/@me/channels`

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
                            // content: `**From**: ${toCode(`@${message.author.username}`)}`,
                            content: `**From**: ${toCode(formatUsername(message.author))}`,
                        },
                        {
                            type: ComponentType.TextDisplay,
                            content: `**Channel**: ${channel.name ? toCode('#' + channel.name) : 'Your DMs'}`,
                        },
                        {
                            type: ComponentType.TextDisplay,
                            content: `**Jump URL**\n${jumpUrl}`,
                        },
                        {
                            type: ComponentType.Separator,
                        },
                    ],
                },
            ]
            // If there's any message content
            if (message.content.trim().length > 0) {
                bookmarkComponent[0]['components'].push({
                    type: ComponentType.TextDisplay,
                    content: `**Content**\n${message.content}`,
                })
            }
            // If message has any attachments
            if (message.attachments.length > 0) {
                const totalAttachments = message.attachments.length
                bookmarkComponent[0]['components'].push({
                    type: ComponentType.TextDisplay,
                    content: `**Attachments** ${
                        totalAttachments > 10 ? `\nShowing 10 (${totalAttachments} present)` : `(${totalAttachments})`
                    }`,
                })
                bookmarkComponent[0]['components'].push({
                    type: ComponentType.MediaGallery,
                    items: message.attachments.slice(0, 9).map((attach) => ({
                        media: {
                            url: attach.proxy_url,
                        },
                        spoiler: interaction.channel.type === ChannelType.GuildText ? interaction.channel.nsfw : false,
                    })),
                })
            }
            // If message has embeds (bots can send embeds)
            if (message.embeds.length > 0) {
                bookmarkComponent[0].components.push({
                    type: ComponentType.TextDisplay,
                    // content: `**Embeds**\n${toCode(`[ Message contains ${message.embeds.length} embed(s) ]`)}`,
                    content: `*-# Original message contains ${message.embeds.length} embeds(s)*`,
                })
            }
            // If the message is inside an NSFW channel
            if (interaction.channel.type == ChannelType.GuildText && interaction.channel.nsfw) {
                bookmarkComponent[0].components.push({
                    type: ComponentType.TextDisplay,
                    content: '*-# ⚠️ Bookmarked from an NSFW channel*',
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
                        content: `❌ Failed to bookmark message to your DM: ${toCodeblock(
                            JSON.stringify(err, null, 2)
                        )}`,
                        flags: MessageFlags.Ephemeral,
                    },
                })
            }
            const bookmarkedMessage = (await bookmarkedMsgResp.json()) as APIMessage
            const jumpUrlToDMs = createJumpUrl('@me', bookmarkedMessage.channel_id, bookmarkedMessage.id)

            return c.json({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `✅ Bookmarked message (${jumpUrl}) to [DMs](${jumpUrlToDMs})`,
                    flags: MessageFlags.Ephemeral,
                },
            })
        }
    }
}
