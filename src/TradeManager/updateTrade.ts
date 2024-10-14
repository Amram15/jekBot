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
const trades = collection(fireStore, "Trades");

function acceptedNum(num: number) {
	if (num > 0) {
		return "Accepted";
	} else if (num < 0) {
		return "Declined";
	} else {
		return "Unknown";
	}
}

function acceptColor(num1: number, num2: number) {
	if (num1 > 0 && num2 > 0) {
		return 0x00ff00;
	} else if (num1 < 0 || num2 < 0) {
		return 0xff0000;
	} else {
		return 0xffff00;
	}
}

function accepted(num1: number, num2: number) {
	if (num1 > 0 && num2 > 0) {
		return "ACCEPTED | ";
	} else if (num1 < 0 || num2 < 0) {
		return "DECLINED | ";
	} else {
		return "";
	}
}

function status(num1: number, num2: number) {
	if (num1 > 0 && num2 > 0) {
		return false;
	} else if (num1 < 0 || num2 < 0) {
		return false;
	} else {
		return true;
	}
}

export default async function (client: Client, tradeID: string) {
	const docRef = doc(trades, tradeID);
	const tradeData = (await getDoc(docRef)).data();

	const textChannel = client.channels.cache.get(
		tradeData.ChannelID
	) as TextChannel;

	const acceptButton = new ButtonBuilder()
		.setCustomId("JekTradeAccept")
		.setLabel("Accept")
		.setStyle(ButtonStyle.Success);
	acceptButton.setEmoji("✔️");

	const declineButton = new ButtonBuilder()
		.setCustomId("JekTradeDecline")
		.setLabel("Decline")
		.setStyle(ButtonStyle.Danger);
	declineButton.setEmoji("✖️");

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		acceptButton,
		declineButton
	);

	const pollEmbed = new EmbedBuilder()
		.setColor(
			acceptColor(tradeData.Trader1.Accepted, tradeData.Trader2.Accepted)
		)
		.setTitle(
			accepted(tradeData.Trader1.Accepted, tradeData.Trader2.Accepted) +
				"Trade Between " +
				tradeData.Trader1.Name +
				" & " +
				tradeData.Trader2.Name
		)
		.setDescription(tradeData.TradeDesc + "\n\u200B")
		.addFields({
			name: acceptedNum(tradeData.Trader1.Accepted),
			value: "<@" + tradeData.Trader1.ID + ">",
			inline: true,
		})
		.addFields({
			name: " ",
			value: " ",
			inline: true,
		})
		.addFields({
			name: "Owned Copies",
			value: tradeData.Trader1.TradeContent,
			inline: true,
		})

		.addFields({
			name: acceptedNum(tradeData.Trader2.Accepted),
			value: "<@" + tradeData.Trader2.ID + ">",
			inline: true,
		})
		.addFields({
			name: " ",
			value: " ",
			inline: true,
		})
		.addFields({
			name: "Owned Copies",
			value: tradeData.Trader2.TradeContent,
			inline: true,
		})

		.setTimestamp();

	const component = status(
		tradeData.Trader1.Accepted,
		tradeData.Trader2.Accepted
	)
		? [row]
		: [];

	textChannel.messages
		.fetch(tradeID)
		.then(function (message) {
			message.edit({
				content:
					"<@" + tradeData.Trader1.ID + "> <@" + tradeData.Trader2.ID + ">",
				embeds: [pollEmbed],
				components: component,
			});
		})
		.catch(console.error);
}
