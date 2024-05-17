import { error } from "console";
import { Client, CommandInteraction } from "discord.js";
import { getCommands } from "./setupCommands";

export default async function (
	client: Client,
	interaction: CommandInteraction
) {
	const commands = getCommands();

	try {
		const command = commands.find(
			(cmd) => cmd.name === interaction.commandName
		);
		if (!command) return;

		await command.callback(client, interaction);
	} catch (err) {
		interaction.editReply("error");
		console.log(`Error running command ${interaction.commandName}:${err}`);
	}
}
