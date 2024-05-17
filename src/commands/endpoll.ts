import {
	Client,
	CommandInteraction,
	PollData,
	ApplicationCommandOptionType,
	TextChannel,
} from "discord.js";

module.exports = {
	name: "endpoll",
	description: "Ends a poll",
	options: [
		{
			name: "message-id",
			description: "What is the message ID of the poll you want to end",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],

	callback: async (client: Client, interaction: CommandInteraction) => {
		await interaction.deferReply();

		(
			client.channels.cache.get(interaction.channelId) as TextChannel
		).messages.endPoll(String(interaction.options.get("message-id")?.value));

		interaction.deleteReply();
	},
};
