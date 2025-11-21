import {
	ApplicationCommandOptionType,
	Client,
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionsBitField,
} from "discord.js";
// import * as fs from "fs";
// import { parse } from "csv-parse/sync"; //using the simpler sync API
import { getFirestore, collection, doc, setDoc, getDoc } from "firebase/firestore";
import { initFirebase } from "../firebase/firebaseapp";
import * as ydke from "ydke";

/*installed libraries:
csv-parse //no longer needed
ydke //convert to ydke format and back
*/

const app = initFirebase();
const fireStore = getFirestore(app);
const cube = collection(fireStore, "Cube");

const main_deck_doc = doc(cube, "Main deck");
const extra_deck_doc = doc(cube, "Extra deck");

async function get_random_cardID(deck_reference) {
	const deck_database = (await getDoc(deck_reference)).data();
	const deck_cardIDs = Object.keys(deck_database);

	const random_index = Math.floor(Math.random() * deck_cardIDs.length);
	const random_cardID = deck_cardIDs[random_index];

	// console.log({id: random_id, data: database_data[random_id]})

	return random_cardID;
}

async function generate_random_deck(deck_reference, total_deck_size) {
	const used_cardIDs = new Set();

	let current_deck_array = [];

	let current_deck_size = 0;

	while (current_deck_size < total_deck_size) {
		//add cards to deck until full
		let random_cardID = await get_random_cardID(deck_reference);

		while (used_cardIDs.has(random_cardID)) {
			//get a unique cardID
			random_cardID = await get_random_cardID(deck_reference);
		}

		used_cardIDs.add(random_cardID);

		let quantity = Math.floor(Math.random() * (3 - 1) + 1); //get random number from 1-3

		if (current_deck_array.length + quantity > total_deck_size) {
			//lower quantity so that it doesn't exceed final_deck_size
			quantity = current_deck_array.length + quantity - total_deck_size;
		}

		current_deck_array = current_deck_array.concat(Array(quantity).fill(random_cardID));

		current_deck_size = current_deck_array.length;
	}

	return current_deck_array;
}

async function generate_random_ydke(user_main_deck_size = 40, user_extra_deck_size = 15) {
	user_main_deck_size = user_main_deck_size || 40;
	user_extra_deck_size = user_extra_deck_size || 15;

	const main_deck = await generate_random_deck(main_deck_doc, user_main_deck_size);
	const extra_deck = await generate_random_deck(extra_deck_doc, user_extra_deck_size);

	// console.log("main deck:", main_deck_ids);
	// console.log("extra deck:", extra_deck_ids);
	// console.log(user_main_deck_size);
	// console.log(user_extra_deck_size);

	const deck_code = ydke.toURL({
		main: Uint32Array.from(main_deck),
		extra: Uint32Array.from(extra_deck),
		side: Uint32Array.from([]),
	});

	// console.log(deck_code);

	return deck_code;
}

// generate_random_ydke();

module.exports = {
	name: "random_deck",
	description: "Generates a random deck from cards in the cube",
	options: [
		{
			name: "main_deck_size",
			description: "The size of the main deck (default: 40)",
			type: ApplicationCommandOptionType.Integer,
			required: false,
		},
		{
			name: "extra_deck_size",
			description: "The size of the extra deck (default: 15)",
			type: ApplicationCommandOptionType.Integer,
			required: false,
		},
	],

	callback: async (client: Client, interaction: ChatInputCommandInteraction) => {
		await interaction.deferReply();

		const api_response = await generate_random_ydke(
			Number(interaction.options.get("main_deck_size")?.value),
			Number(interaction.options.get("extra_deck_size")?.value)
		);

		interaction.editReply({ content: `Your randomly generated deck is:\n\`\`\`${api_response}\`\`\`` });
	},
};
