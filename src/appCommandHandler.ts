import { APIApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10'
import { Context } from 'hono'
import { bookmarkHandler } from './handlers/bookmark'

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
            await bookmarkHandler(c, interaction)
        }
    }
}
