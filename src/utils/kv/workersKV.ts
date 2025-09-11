import { Context } from 'hono'

export interface BookmarkConfig {
    hooks: {
        name: string
        url: string
    }[]
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
