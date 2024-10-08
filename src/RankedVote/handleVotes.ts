import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Client,
	EmbedBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { initFirebase } from "../firebase/firebaseapp";
import {
	collection,
	doc,
	getDoc,
	getFirestore,
	updateDoc,
} from "firebase/firestore";
import updateVote from "./updateVote";

//Get Firestore
const app = initFirebase();
const fireStore = getFirestore(app);
const polls = collection(fireStore, "Polls");

//Check Valid Answer numbers
function validateAnswers(answers) {
	const seen = {};

	for (const answer of answers) {
		const val = Number(answer.value);

		//Is Number
		if (isNaN(val) || !Number.isInteger(val)) {
			return { Success: false, Response: "Rank choice was not a number!" };
		}

		//Number In range
		// if (val <= 0 || val > answers.length) {
		// 	return {
		// 		Success: false,
		// 		Response: "Rank choice number was not in range!",
		// 	};
		// }

		//Anti Repeat
		if (seen[val]) {
			return { Success: false, Response: "Rank choice number was repeated!" };
		}
		seen[val] = true;
	}

	return { Success: true, Response: "" };
}

//Default
export default async function (
	client: Client,
	interaction: ModalSubmitInteraction | ButtonInteraction
) {
	try {
		//Vote Button
		if (interaction.isButton()) {
			if (interaction.customId != "JekRankVote") return;

			//Read Firestore doc
			const docRef = doc(polls, interaction.message.id);
			const voteData = (await getDoc(docRef)).data();

			const prevData = voteData.Votes[interaction.user.id];

			//Create Modal
			const modal = new ModalBuilder()
				.setCustomId("JekVoteModal")
				.setTitle((prevData ? "(Edit) " : "") + voteData.Question);

			for (let i = 0; i < voteData.Options.length; i++) {
				const textInput = new TextInputBuilder()
					.setCustomId(String(i))
					.setLabel(voteData.Options[i])
					.setStyle(TextInputStyle.Short)
					.setMaxLength(String(voteData.Options.length).length)
					.setMinLength(String(voteData.Options.length).length)
					.setPlaceholder(String(prevData ? prevData.indexOf(i) + 1 : ""));
				const actionRow =
					new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
				modal.addComponents(actionRow);
			}

			// Show the modal to the user
			await interaction.showModal(modal);
		}

		//Submit Button
		if (interaction.isModalSubmit()) {
			if (interaction.customId != "JekVoteModal") return;
			await interaction.deferUpdate();

			let answers = [...interaction.fields.fields.values()];

			//Error Check Answers
			const validation = validateAnswers(answers);
			if (!validation.Success) {
				//Error Embed
				const errorEmbed = new EmbedBuilder()
					.setColor(0xff0000)
					.setTitle("Error with voting request")
					.setDescription(validation.Response)
					.setTimestamp();

				//Send Response
				interaction.followUp({
					embeds: [errorEmbed],
					ephemeral: true,
				});
				return;
			}

			//Get Vote Answers
			answers.sort((a, b) => Number(a.value) - Number(b.value));

			const userVote = {};
			userVote["Votes." + String(interaction.user.id)] = answers.map((answer) =>
				Number(answer.customId)
			);

			//Update Firestore doc
			const docRef = doc(polls, interaction.message.id);
			const optionsData = (await getDoc(docRef)).get("Options");

			await updateDoc(docRef, userVote);

			const successEmbed = new EmbedBuilder()
				.setColor(0x00ff00)
				.setTitle("Saved vote answers")
				.setDescription("Ranked vote data:\n\u200B")
				.setTimestamp();

			for (let i = 0; i < answers.length; i++) {
				successEmbed.addFields({
					name: String(i + 1) + ":",
					value: optionsData[Number(answers[i].customId)],
				});
			}

			updateVote(client, interaction.message.id);
			interaction.followUp({ embeds: [successEmbed], ephemeral: true });
		}
	} catch (err) {
		interaction.editReply("error");
		console.log(`Error running vote Commands:${err}`);
	}
}
