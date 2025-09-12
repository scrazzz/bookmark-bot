import { ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'

class GlobalCommands {
    commands: RESTPostAPIApplicationCommandsJSONBody[] = []

    add(command: RESTPostAPIApplicationCommandsJSONBody) {
        this.commands.push(command)
    }
}

const app = new GlobalCommands()

app.add({
    name: 'hello',
    description: 'hello vro <3',
    type: ApplicationCommandType.ChatInput,
})

app.add({
    name: 'Bookmark to DMs',
    type: ApplicationCommandType.Message,
})

app.add({
    name: 'config',
    description: 'Config where you want to save your bookmarks to',
    type: ApplicationCommandType.ChatInput,
})

app.add({
    name: 'Bookmark to Webhook',
    type: ApplicationCommandType.Message,
})

export const APPLICATION_COMMANDS = app.commands
