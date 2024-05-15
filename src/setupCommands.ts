import { Client } from "discord.js";
import fs from "fs";
import path from "path";

function getCommands(): any[] {
	const commands: any[] = [];
	const directory = path.join(__dirname, ".", "commands");
	const files = fs.readdirSync(directory, { withFileTypes: true });

	for (const file of files) {
		if (!file.isFile()) continue;

		const filePath = path.join(directory, file.name);
		const command = require(filePath);

		if (!command.name) {
			console.log(`${file.name} not setup`);
			continue;
		}

		commands.push(command);
	}
	return commands;
}

export default async function (client: Client) {
	console.log("Setting up commands");

	let applicationCommands;
	const guild = await client.guilds.fetch(process.env.GUILD as string);
	applicationCommands = guild.commands;
	await applicationCommands.fetch();

	for (const command of getCommands()) {
		const { name, description, options } = command;

		const existingCommand = await applicationCommands.cache.find(
			(cmd) => cmd.name === name
		);

		if (existingCommand) {
			if (command.deleted) {
				await applicationCommands.delete(existingCommand.id);
				console.log(`Deleted command ${name}.`);
				continue;
			}
			await applicationCommands.edit(existingCommand.id, {
				description,
				options,
			});
			console.log(`Updated Command: ${name}`);
		} else {
			if (command.deleted) {
				console.log(`Skipping command ${name} as it's set to delete.`);
				continue;
			}

			await applicationCommands.create({
				name,
				description,
				options,
			});

			console.log(`Registered command "${name}."`);
		}
	}
}

export { getCommands };