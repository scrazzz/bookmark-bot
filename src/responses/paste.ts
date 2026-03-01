import {
    APIApplicationCommandInteraction,
    APIChatInputApplicationCommandInteractionData,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'

async function createPaste(content: string) {
    const resp = await fetch('https://api.pastes.dev/post', {
        method: 'POST',
        headers: {
            'User-Agent': 'BookmarkBot (https://github.com/scrazzz/bookmark-bot)',
            'Content-Type': 'text/plain',
        },
        body: content,
    })

    if (!resp.ok) {
        throw new Error(`Error creating paste: ${resp.status} ${resp.statusText}`)
    }

    const js = (await resp.json()) as { key: string }
    return js.key
}

export async function pasteHandler(c: Context, interaction: APIApplicationCommandInteraction) {
    const data = interaction.data as APIChatInputApplicationCommandInteractionData
    const content = (data.options![0] as any).value // TODO: find a better way to do this
    try {
        const pasteKey = await createPaste(content)
        const pasteUrl = `https://pastes.dev/${pasteKey}`
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: pasteUrl,
                flags: MessageFlags.SuppressEmbeds,
            },
        })
    } catch (error) {
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `❌ ${(error as Error).message}`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }
}
