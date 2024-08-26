import {
	Client,
	CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { initFirebase } from "../firebase/firebaseapp";
import updateVote from "../RankedVote/updateVote";

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

		//Update Message
		const message = await interaction.editReply({
			content: "Creating Poll",
		});

		//Firebase Datastore Save Data
		const docRef = doc(polls, message.id);
		await setDoc(docRef, {
			ChannelID: message.channel.id,
			Question: question,
			Author: {
				ID: interaction.user.id,
				Name: interaction.user.displayName,
				AvatarURL: interaction.user.displayAvatarURL(),
			},
			Votes: {},
			Options: options,
		});

		//Create Embed and stuff
		updateVote(client, message.id);
	},
};
