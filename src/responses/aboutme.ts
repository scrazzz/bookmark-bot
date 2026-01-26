import { ButtonStyle, ComponentType, InteractionResponseType } from 'discord-api-types/v10'
import { Context } from 'hono'
import { BOT_GITHUB_URL, BOT_INSTALL_URL } from '../utils/consts'

export async function aboutmeHandler(c: Context) {
    return c.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            components: [
                {
                    type: ComponentType.Container,
                    components: [
                        {
                            type: ComponentType.TextInput,
                            content:
                                'Easily bookmark any message from any server right to your DMs or to a specific channel via webhook.',
                        },
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Link,
                                    label: 'Add Bot',
                                    url: BOT_INSTALL_URL,
                                },
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Link,
                                    label: 'Source code',
                                    url: BOT_GITHUB_URL,
                                },
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Secondary,
                                    label: 'Developed by @scruzism',
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
