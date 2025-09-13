import { APIApplicationCommandInteraction, APIMessageComponentInteraction, APIUser } from 'discord-api-types/v10'
import { DISCORD_BASE_API } from './consts'

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

export function createJumpUrl(guildId: string, channelId: string, messageId: string) {
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`
}

export function formatUsername(user: APIUser, mention: boolean = false) {
    if (mention) {
        return `<@${user.id}>`
    }
    if (user.bot === true) {
        // Bot's don't have @username
        return `${user.username}#${user.discriminator}`
    }
    return `@${user.username}`
}

export function toCode<T>(content: T) {
    return '`' + content + '`'
}

export function toCodeblock(content: string, lang: string = 'json') {
    return `\`\`\`${lang}
${content}
\`\`\``
}

export function toUnixTimestamp(isoTimestamp: string, format: string = 'f') {
    const date = new Date(isoTimestamp)
    const ts = Math.floor(date.getTime() / 1000)
    return `<t:${ts}:${format}>`
}

export function getInteractionAuthor(interaction: APIApplicationCommandInteraction | APIMessageComponentInteraction) {
    return interaction.member ? interaction.member.user : interaction.user!
}
