import { Context } from 'hono'

export interface BookmarkConfig {
    // The user-inputted name for the webhook
    name: string
    // The webhook URL
    url: string
    // Guild ID of the webhook to construct the message URL
    guildId?: string
}

export async function getWebhook(c: Context, userId: string) {
    const value = ((await c.env.KV_BOOKMARK_CONFIG) as KVNamespace).get<BookmarkConfig>(userId, {
        type: 'json',
        // TODO: cacheTtl: 60 * 60,
    })
    return value
}

export async function setWebhook(c: Context, userId: string, config: BookmarkConfig) {
    const resp = ((await c.env.KV_BOOKMARK_CONFIG) as KVNamespace).put(userId, JSON.stringify(config))
    return resp
}

export async function deleteWebhook(c: Context, userId: string) {
    const kv = c.env.KV_BOOKMARK_CONFIG as KVNamespace
    await kv.delete(userId)
}
