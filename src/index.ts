import "dotenv/config";
import { Client, CommandInteraction, IntentsBitField } from "discord.js";
import setupCommands from "./setupCommands";
import handleCommands from "./handleCommands";

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	],
});

client.on("ready", (c) => {
	setupCommands(c);
	console.log(`${c.user.username} is online!`);
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand()) {
		if (interaction.guildId != process.env.Guild) {
			console.log(`Invalid Server!`);
			await interaction.reply("Invalid Server");
			return;
		}

		handleCommands(client, interaction);
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);