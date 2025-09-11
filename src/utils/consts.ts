export const DISCORD_BASE_API = 'https://discord.com/api/v10'
export const MESSAGE_CONTENT_LIMIT = 2000
export const TOTAL_EMBED_LIMIT = 6000

export enum ButtonCustomId {
    bookmarkDismiss = 'bookmark:dismiss',
    bookmarkDismissConfirm = 'bookmark:dismiss:confirm',
}

export enum ModalCustomId {
    configAdd = 'config_add',
}

export enum TextInputCustomId {
    configAddName = 'textinput:config_add:name',
    configAddWebhook = 'textinput:config_add:hook',
}
