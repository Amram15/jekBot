import "dotenv/config";
import { Client, CommandInteraction, IntentsBitField } from "discord.js";
import setupCommands from "./setupCommands";
import handleCommands from "./handleCommands";
import handleMentions from "./handleMentions";
import { Console } from "console";
import handleVotes from "./RankedVote/handleVotes";

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
	} else if (interaction.isModalSubmit() || interaction.isButton()) {
		if (interaction.guildId != process.env.Guild) {
			console.log(`Invalid Server!`);
			await interaction.reply("Invalid Server");
			return;
		}

		handleVotes(client, interaction);
	}
});

client.on("messageCreate", async (message) => {
	if (!message.mentions.users.first()) return;
	if (message.mentions.users.first().id == client.user.id) {
		if (message.guildId != process.env.Guild) {
			console.log(`Invalid Server!`);
			await message.reply("Invalid Server");
			return;
		}

		handleMentions(client, message);
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
