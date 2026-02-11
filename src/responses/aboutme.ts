import { ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from 'discord-api-types/v10'
import { Context } from 'hono'
import { BOT_GITHUB_URL, BOT_INSTALL_URL } from '../utils/consts'

export async function aboutmeHandler(c: Context) {
    return c.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content:
                                'Easily bookmark any message from any server right to your DMs or to a specific channel via webhook.',
                        },
                        {
                            type: ComponentType.Separator,
                        },
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Link,
                                    label: 'Add bot',
                                    url: BOT_INSTALL_URL,
                                },
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Link,
                                    label: 'Source',
                                    url: BOT_GITHUB_URL,
                                },
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Secondary,
                                    label: 'Developed by @scruzism',
                                    custom_id: 'null',
                                    disabled: true,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    })
}
