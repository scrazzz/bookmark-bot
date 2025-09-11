import {
    APILabelComponent,
    APIModalSubmitInteraction,
    APITextInputComponent,
    InteractionResponseType,
    MessageFlags,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { ModalCustomId } from '../utils/consts'
import { BookmarkConfig, getWebhook, setWebhook } from '../utils/kv/workersKV'
import { toCode } from '../utils/helpers'

function isValidWebhookURL(webhookURL: string): boolean {
    // https://discord.com/api/webhooks/20/68
    const re = /^(https?:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\/\d{17,20}\/[\w-]{68,})$/
    return re.test(webhookURL.trim())
}

export async function modalHandler(c: Context, interaction: APIModalSubmitInteraction) {
    console.log('modal', interaction)
    const modalId = interaction.data.custom_id

    if (modalId === ModalCustomId.configAdd) {
        // name, hook, and interactionAuthor can never be undefined or null
        // name and hook are required fields in the modal
        const name = ((interaction.data.components[1] as APILabelComponent).component as APITextInputComponent).value!
        const hook = ((interaction.data.components[2] as APILabelComponent).component as APITextInputComponent).value!
        const interactionAuthor = interaction.member ? interaction.member.user : interaction.user!

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
        // Check if the user has already set one webhook before.
        // TODO: Ability for users to add more than one webhook will be implemented soon
        const config = await getWebhook(c, interactionAuthor.id)
        if (config) {
            return c.json({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `❌ You already have set a webhook: "${config.hooks[0].name}"`,
                    flags: MessageFlags.Ephemeral,
                },
            })
        } else {
            // new user
            // TODO: accomodate more hooks in the future
            const config: BookmarkConfig = {
                hooks: [{ name, url: hook }],
            }
            await setWebhook(c, interactionAuthor.id, config)
        }

        return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                // content: `name: ${name}\nwebhook: ${hook}`,
                content: `✅ Added new bookmark config (**${name}**).\nUse the message command "**${toCode(
                    'Bookmark to ...'
                )}**" to bookmark a message to your desired webhook channel!`,
                flags: MessageFlags.Ephemeral,
            },
        })
    }
}
