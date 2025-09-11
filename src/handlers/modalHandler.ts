import {
    APILabelComponent,
    APIModalSubmitInteraction,
    APITextInputComponent,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { ModalCustomId } from '../utils/consts'

function isValidWebhookURL(webhookURL: string): boolean {
    const re = /^(https?:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\/\d{17,20}\/[\w-]{68,})$/
    return re.test(webhookURL.trim())
}

export async function modalHandler(c: Context, interaction: APIModalSubmitInteraction) {
    console.log('modal', interaction)
    const modalId = interaction.data.custom_id

    if (modalId === ModalCustomId.configAdd) {
        const name = ((interaction.data.components[1] as APILabelComponent).component as APITextInputComponent).value
        const hook = ((interaction.data.components[2] as APILabelComponent).component as APITextInputComponent).value

        // check if webhook url is valid
        if (!isValidWebhookURL(hook as string)) {
            return c.json({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `❌ Invalid Webhook URL provided!`,
                    flags: MessageFlags.Ephemeral,
                },
            })
        }
        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `name: ${name}\nwebhook: ${hook}`,
                // content: toCodeblock(JSON.stringify(interaction.data, null, 2)),
                flags: MessageFlags.Ephemeral,
            },
        })
    }
}
