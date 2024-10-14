import {
	Client,
	CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { initFirebase } from "../firebase/firebaseapp";
import updateTrade from "../TradeManager/updateTrade";

const DEFAULT_OPTIONS = ["Banned", "Limited", "Semi-Limited", "Unlimited"];

const app = initFirebase();
const fireStore = getFirestore(app);
const trades = collection(fireStore, "Trades");

function convertOptions(options: string) {
	return options.split(",").map((item) => item.trim());
}

module.exports = {
	name: "trade",
	description: "This is for record keeping. This is the official way to trade",
	options: [
		{
			name: "trader1",
			description: "Trader 1",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "trader1-copies-owned",
			description:
				"Trader1's number of copies in your collection of the card you want to trade (e.g. 1 Pot of Greed)",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "trader2",
			description: "Trader 2",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "traders2-copies-owned",
			description:
				"Trader2's number of copies in your collection of the card you want to trade (e.g. 1 Pot of Greed)",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "trade-description",
			description: "A short description of who is trading what for what",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],

	callback: async (client: Client, interaction: CommandInteraction) => {
		await interaction.deferReply();

		const trader1 = interaction.options.get("trader1")?.user;
		const copies1 = String(
			interaction.options.get("trader1-copies-owned")?.value
		);
		const trader2 = interaction.options.get("trader2")?.user;
		const copies2 = String(
			interaction.options.get("traders2-copies-owned")?.value
		);
		const tradeDesc = String(
			interaction.options.get("trade-description")?.value
		);

		//Update Message
		const message = await interaction.editReply({
			content: "Creating Trade",
		});

		//Firebase Datastore Save Data
		const docRef = doc(trades, message.id);
		await setDoc(docRef, {
			ChannelID: message.channel.id,
			TradeDesc: tradeDesc,
			Trader1: {
				ID: trader1.id,
				Name: trader1.displayName,
				TradeContent: copies1,
				Accepted: 0,
			},
			Trader2: {
				ID: trader2.id,
				Name: trader2.displayName,
				TradeContent: copies2,
				Accepted: 0,
			},
		});

		updateTrade(client, message.id);
	},
};
