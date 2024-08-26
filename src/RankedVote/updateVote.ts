import {
	Client,
	ModalSubmitInteraction,
	ButtonInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	TextChannel,
} from "discord.js";
import { collection, doc, getDoc, getFirestore } from "firebase/firestore";
import { initFirebase } from "../firebase/firebaseapp";

//Get Firestore
const app = initFirebase();
const fireStore = getFirestore(app);
const polls = collection(fireStore, "Polls");

export default async function (client: Client, pollID: string) {
	const docRef = doc(polls, pollID);
	const voteData = (await getDoc(docRef)).data();

	const textChannel = client.channels.cache.get(
		voteData.ChannelID
	) as TextChannel;

	const vote = new ButtonBuilder()
		.setCustomId("JekRankVote")
		.setLabel("Vote")
		.setStyle(ButtonStyle.Primary);
	vote.setEmoji("🗳️");
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(vote);

	const pollEmbed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle(voteData.Question + "\n\u200B")
		.addFields({
			name: "Votes",
			value: String(Object.keys(voteData.Votes).length),
			inline: true,
		})
		.addFields({ name: "\u200B", value: "Results:" })
		.setFooter({
			text: voteData.Author.Name,
			iconURL: voteData.Author.AvatarURL,
		})
		.setTimestamp();

	textChannel.messages
		.fetch(pollID)
		.then(function (message) {
			message.edit({
				embeds: [pollEmbed],
				components: [row],
			});
		})
		.catch(console.error);
}
