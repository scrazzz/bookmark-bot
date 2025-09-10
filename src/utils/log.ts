import { MESSAGE_CONTENT_LIMIT } from './consts'

export async function logpaste(content: string) {
    const resp = await fetch('https://hst.sh/documents', {
        method: 'POST',
        body: content,
    })
    if (resp.ok) {
        const js = (await resp.json()) as { key: string }
        return `https://hst.sh/${js.key}`
    } else {
        return content.substring(0, MESSAGE_CONTENT_LIMIT)
    }
}
