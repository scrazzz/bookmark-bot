import {
    APIApplicationCommandInteraction,
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { ButtonCustomId } from '../utils/consts'

export function configHandler(c: Context, interaction: APIApplicationCommandInteraction) {
    return c.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            label: 'Add new config',
                            style: ButtonStyle.Success,
                            custom_id: ButtonCustomId.configAdd,
                        },
                        {
                            type: ComponentType.Button,
                            label: 'Remove current config',
                            style: ButtonStyle.Danger,
                            custom_id: ButtonCustomId.configRemove,
                        },
                    ],
                },
            ],
        },
    })
}
