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
    name: 'Bookmark Message to DMs',
    type: ApplicationCommandType.Message,
})

export const APPLICATION_COMMANDS = app.commands
