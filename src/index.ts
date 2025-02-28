import "dotenv/config";
import {
	Client,
	CommandInteraction,
	IntentsBitField,
	InteractionResponse,
} from "discord.js";
import setupCommands from "./setupCommands";
import handleCommands from "./handleCommands";
import handleMentions from "./handleMentions";
import { Console } from "console";
import handleVotes from "./RankedVote/handleVotes";
import handleTrade from "./TradeManager/handleTrade";

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
		if (interaction.guildId != process.env.GUILD) {
			console.log("Invalid Server!" + process.env.GUILD);
			await interaction.reply("Invalid Server");
			return;
		}

		handleCommands(client, interaction);
	} else if (interaction.isModalSubmit() || interaction.isButton()) {
		if (interaction.guildId != process.env.GUILD) {
			console.log("Invalid Server!" + process.env.GUILD);
			await interaction.reply("Invalid Server");
			return;
		}

		handleVotes(client, interaction);
		handleTrade(client, interaction);
	}
});

client.on("messageCreate", async (message) => {
	if (!message.mentions.users.first()) return;
	if (message.mentions.users.first().id == client.user.id) {
		if (message.guildId != process.env.GUILD) {
			console.log("Invalid Server!" + process.env.GUILD);
			await message.reply("Invalid Server");
			return;
		}

		handleMentions(client, message);
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
