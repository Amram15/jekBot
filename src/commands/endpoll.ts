import {
	Client,
	CommandInteraction,
	PollData,
	ApplicationCommandOptionType,
	TextChannel,
} from "discord.js";
import {
	getFirestore,
	collection,
	doc,
	getDoc,
	deleteDoc,
} from "firebase/firestore";
import { initFirebase } from "../firebase/firebaseapp";

const app = initFirebase();
const fireStore = getFirestore(app);
const polls = collection(fireStore, "Polls");

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

		const messageId = String(interaction.options.get("message-id")?.value);
		const textChannel = client.channels.cache.get(
			interaction.channelId
		) as TextChannel;

		const docRef = doc(polls, messageId);
		const voteData = await getDoc(docRef);

		if (voteData.exists()) {
			//Rank poll
			await deleteDoc(docRef);
		} else {
			//Normal Poll
			textChannel.messages.endPoll(messageId);
		}

		interaction.deleteReply();
	},
};
