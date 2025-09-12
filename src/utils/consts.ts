export const DISCORD_BASE_API = 'https://discord.com/api/v10'
export const DISCORD_WEBHOOK_BASE = 'https://discord.com/api/webhooks'
export const MESSAGE_CONTENT_LIMIT = 2000
export const TOTAL_EMBED_LIMIT = 6000
export const BOT_WEBHOOK_AVATAR =
    'https://cdn.discordapp.com/attachments/927944825016311858/1415945657113645086/bookmark_bot_webhook.png'

export const SUPPORTED_MIMES: string[] = [
    // Images
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime', // .mov
]

export enum ButtonCustomId {
    bookmarkDelete = 'bookmark:dismiss',
    bookmarkDeleteConfirm = 'bookmark:dismiss:confirm',

    configAdd = 'btn:config:add',
    configRemove = 'btn:config:remove',
}

export enum ModalCustomId {
    configAdd = 'modal:config',
}

export enum TextInputCustomId {
    configAddName = 'textinput:config_add:name',
    configAddWebhook = 'textinput:config_add:hook',
}
