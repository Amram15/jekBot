import {
	createAudioResource,
	EndBehaviorType,
	entersState,
	getVoiceConnection,
	joinVoiceChannel,
	VoiceConnectionStatus,
	VoiceReceiver,
	StreamType,
	createAudioPlayer,
	VoiceConnection,
} from "@discordjs/voice";
import { GoogleGenAI, Modality } from "@google/genai";
import { ChatInputCommandInteraction, Client, CommandInteraction, EmbedBuilder, GuildMember, User } from "discord.js";
import prism from "prism-media";
import fs from "fs";

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI,
});

module.exports = {
	name: "join_call",
	description: "Checks the connection of the bot",

	callback: async (client: Client, interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply();

		let connection = getVoiceConnection(interaction.guildId);

		if (!connection) {
			if (!(interaction.member as GuildMember)?.voice?.channel) {
				await interaction.followUp("Join a voice channel and then try that again!");

				return;
			}

			connection = joinVoiceChannel({
				adapterCreator: interaction.guild.voiceAdapterCreator,
				channelId: (interaction.member as GuildMember).voice.channel.id,
				guildId: interaction.guild.id,
				selfDeaf: false,
				selfMute: false,
			});
		}

		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
			const receiver = connection.receiver;

			receiver.speaking.on("start", async (userId) => {
				const user = await interaction.client.users.fetch(userId);

				await createListeningStream(connection, receiver, user);
			});
		} catch (error) {
			console.warn(error);

			await interaction.followUp("Failed to join voice channel within 20 seconds, please try again later!");
		}

		await interaction.followUp("Ready!");
	},
};

const responseQueue = [];
async function createListeningStream(connection: VoiceConnection, receiver: VoiceReceiver, user: User) {
	const opusStream = receiver.subscribe(user.id, {
		end: {
			behavior: EndBehaviorType.AfterSilence,
			duration: 1000,
		},
	});


	//Play opusStream back to the channel
	const player = createAudioPlayer();
	player.play(
		createAudioResource(opusStream, {
			inputType: StreamType.Opus,
		})
	);

	connection.subscribe(player);
}
