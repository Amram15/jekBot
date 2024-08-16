import {
	Client,
	CommandInteraction,
	ApplicationCommandOptionType,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from "discord.js";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { initFirebase } from "../firebase/firebaseapp";

const DEFAULT_OPTIONS = ["Banned", "Limited", "Semi-Limited", "Unlimited"];

const app = initFirebase();
const fireStore = getFirestore(app);
const polls = collection(fireStore, "Polls");

function convertOptions(options: string) {
	return options.split(",").map((item) => item.trim());
}

module.exports = {
	name: "rankpoll",
	description: "Creates a ranked poll",
	options: [
		{
			name: "question",
			description: "What are you polling about?",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "options",
			description:
				'List of options separated by a comma. Ex. "option1, option2"',
			type: ApplicationCommandOptionType.String,
			required: false,
		},
		{
			name: "time",
			description: "How long the poll lasts in hours",
			type: ApplicationCommandOptionType.Integer,
			required: false,
		},
	],

	callback: async (client: Client, interaction: CommandInteraction) => {
		await interaction.deferReply();

		const question = String(interaction.options.get("question")?.value);
		const options = interaction.options.get("options")
			? convertOptions(String(interaction.options.get("options").value))
			: DEFAULT_OPTIONS;

		//Vote button
		const vote = new ButtonBuilder()
			.setCustomId("JekRankVote")
			.setLabel("Vote")
			.setStyle(ButtonStyle.Primary);
		vote.setEmoji("🗳️");
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(vote);

		//Poll Embed
		const pollEmbed = new EmbedBuilder()
			.setColor(0x0099ff)
			.setTitle(question)
			.addFields({ name: "\u200B", value: "Results:" })
			.setFooter({
				text: interaction.user.displayName,
				iconURL: interaction.user.displayAvatarURL(),
			})
			// .setImage(
			// 	"https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/1015f/MainBefore.jpg"
			// )
			.setTimestamp();
		//Update Message
		const message = await interaction.editReply({
			embeds: [pollEmbed],
			components: [row],
		});

		//Firebase Datastore Save Data
		const docRef = doc(polls, message.id);
		await setDoc(docRef, { Question: question, Votes: {}, Options: options });
		console.log("Poll Document written with custom ID: ", docRef.id);
	},
};
