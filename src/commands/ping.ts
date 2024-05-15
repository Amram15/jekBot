import { Client, CommandInteraction, EmbedBuilder } from "discord.js";

module.exports = {
	name: "ping",
	description: "Checks the connection of the bot",

	callback: async (client: Client, interaction: CommandInteraction) => {
		await interaction.deferReply();

		const reply = await interaction.fetchReply();

		const ping = reply.createdTimestamp - interaction.createdTimestamp;

		const embed = new EmbedBuilder()
			.setTitle("Pong!")
			.setDescription("YGO Ban Polls is currently running and connected")
			.setColor(0x00ff00)
			.addFields(
				{
					name: "Client",
					value: `${ping}ms`,
					inline: true,
				},
				{
					name: "Websocket",
					value: `${client.ws.ping}ms`,
					inline: true,
				}
			);

		interaction.editReply({ embeds: [embed] });
	},
};
