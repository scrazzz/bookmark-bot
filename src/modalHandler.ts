import {
    APILabelComponent,
    APIModalSubmitInteraction,
    APITextInputComponent,
    InteractionResponseType,
} from 'discord-api-types/v10'
import { Context } from 'hono'
import { ModalCustomId } from './utils/consts'
import { BookmarkConfig, getWebhook, setWebhook } from './utils/kv/workersKV'
import { toCode } from './utils/helpers'

function isValidWebhookURL(webhookURL: string): boolean {
    const re = /^(https?:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\/\d{17,20}\/[\w-]{68,})$/
    return re.test(webhookURL.trim())
}

/**
 * This function handles all the Modals
 */
export async function modalHandler(c: Context, interaction: APIModalSubmitInteraction) {
    const modalId = interaction.data.custom_id

    if (modalId === ModalCustomId.configAdd) {
        // name, hook, and interactionAuthor can never be undefined or null here
        const name = ((interaction.data.components[1] as APILabelComponent).component as APITextInputComponent).value!
        const hook = ((interaction.data.components[2] as APILabelComponent).component as APITextInputComponent).value!
        const interactionAuthor = interaction.member ? interaction.member.user : interaction.user!

        // check if webhook url is valid
        if (!isValidWebhookURL(hook as string)) {
            return c.json({
                type: InteractionResponseType.UpdateMessage,
                data: {
                    content: `❌ Invalid Webhook URL provided!`,
                    components: [],
                },
            })
        }

        const config = await getWebhook(c, interactionAuthor.id)
        if (config) {
            // each user can only set one webhook
            return c.json({
                type: InteractionResponseType.UpdateMessage,
                data: {
                    content: `❌ You already have an existing config ("${config.name}").`,
                    components: [],
                },
            })
        } else {
            // new user
            // stripping webhook url to save char length in KV
            const strippedHook = new URL(hook).pathname.replace(/^\/api\/webhooks\/?/, '')
            const config: BookmarkConfig = { name, url: strippedHook }
            await setWebhook(c, interactionAuthor.id, config)
        }

        return c.json({
            type: InteractionResponseType.UpdateMessage,
            data: {
                content: `✅ Added new bookmark config (**${name}**)\nUse the message command "**${toCode(
                    'Bookmark to Webhook'
                )}**" to bookmark a message to this webhook!`,
                components: [],
            },
        })
    }
}
