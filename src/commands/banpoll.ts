import {
	Client,
	CommandInteraction,
	PollData,
	ApplicationCommandOptionType,
	TextChannel,
} from "discord.js";

module.exports = {
	name: "banpoll",
	description: "Creates a ban poll for yugioh",
	options: [
		{
			name: "question",
			description: "What are you polling about?",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "time",
			description: "How long the poll lasts in hours",
			type: ApplicationCommandOptionType.Integer,
			required: false,
		},
		{
			name: "multi-choice",
			description: "If the poll should be multi-choice",
			type: ApplicationCommandOptionType.Boolean,
			required: false,
		},
	],

	callback: async (client: Client, interaction: CommandInteraction) => {
		await interaction.deferReply();

		const reply = await interaction.fetchReply();

		const poll: PollData = {
			question: { text: String(interaction.options.get("question")?.value) },
			duration: Number(
				interaction.options.get("time")
					? interaction.options.get("time").value
					: 168
			),
			allowMultiselect: Boolean(
				interaction.options.get("multi-choice")
					? interaction.options.get("multi-choice").value
					: true
			),
			answers: [
				{ text: "Banned", emoji: "0️⃣" },
				{ text: "Limited", emoji: "1️⃣" },
				{ text: "Semi-Limited", emoji: "2️⃣" },
				{ text: "Unlimited", emoji: "3️⃣" },
			],
		};

		interaction.deleteReply();
		(client.channels.cache.get(interaction.channelId) as TextChannel).send({
			content:
				"Poll to ban " +
				interaction.options.get("question")?.value +
				" by " +
				interaction.user.toString(),
			poll: poll,
		});
	},
};
