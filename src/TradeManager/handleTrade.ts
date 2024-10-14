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
import updateTrade from "./updateTrade";

//Get Firestore
const app = initFirebase();
const fireStore = getFirestore(app);
const trades = collection(fireStore, "Trades");

//Default
export default async function (
	client: Client,
	interaction: ButtonInteraction | ModalSubmitInteraction
) {
	try {
		//Vote Button
		if (interaction.isButton()) {
			if (
				interaction.customId != "JekTradeAccept" &&
				interaction.customId != "JekTradeDecline"
			)
				return;
			await interaction.deferReply({ ephemeral: true });

			//Read Firestore doc
			const docRef = doc(trades, interaction.message.id);
			const tradeData = (await getDoc(docRef)).data();

			// User Detection
			if (interaction.user.id == tradeData.Trader1.ID) {
				if (tradeData.Trader1.Accepted == 0) {
					const traderAccepted = {};
					traderAccepted["Trader1.Accepted"] =
						interaction.customId == "JekTradeAccept" ? 1 : -1;
					await updateDoc(docRef, traderAccepted);
				} else {
					const errorEmbed = new EmbedBuilder()
						.setColor(0xff0000)
						.setTitle("Already Voted User")
						.setTimestamp();

					interaction.followUp({
						embeds: [errorEmbed],
						ephemeral: true,
					});
					return;
				}
			} else if (interaction.user.id == tradeData.Trader2.ID) {
				if (tradeData.Trader2.Accepted == 0) {
					const traderAccepted = {};
					traderAccepted["Trader2.Accepted"] =
						interaction.customId == "JekTradeAccept" ? 1 : -1;
					await updateDoc(docRef, traderAccepted);
				} else {
					const errorEmbed = new EmbedBuilder()
						.setColor(0xff0000)
						.setTitle("Already Voted User")
						.setTimestamp();

					interaction.followUp({
						embeds: [errorEmbed],
						ephemeral: true,
					});
					return;
				}
			} else {
				const errorEmbed = new EmbedBuilder()
					.setColor(0xff0000)
					.setTitle("Invalid User")
					.setTimestamp();

				interaction.followUp({
					embeds: [errorEmbed],
					ephemeral: true,
				});
				return;
			}

			const successEmbed = new EmbedBuilder()
				.setColor(0x00ff00)
				.setTitle(
					interaction.customId == "JekTradeAccept"
						? "Accepted Trade"
						: "Trade Declined"
				)
				.setTimestamp();

			interaction.followUp({
				embeds: [successEmbed],
				ephemeral: true,
			});

			updateTrade(client, interaction.message.id);
		}
	} catch (err) {
		interaction.editReply("error");
		console.log(`Error running vote Commands:${err}`);
	}
}
