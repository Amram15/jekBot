import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { initFirebase } from "../firebase/firebaseapp";
import axios from "axios";
import { ApplicationCommandOptionType, Client, CommandInteraction, EmbedBuilder, PermissionsBitField } from "discord.js";
import { warn } from "console";

const app = initFirebase();
const fireStore = getFirestore(app);
const cube = collection(fireStore, "Cube");

const main_deck = doc(cube, "Main deck");
const extra_deck = doc(cube, "Extra deck");

const extra_deck_types = new Set([
	"Fusion Monster",
	"Synchro Monster",
	"Synchro Tuner Monster",
	"XYZ Monster",
	"Link Monster",
	"Pendulum Effect Fusion Monster",
	"Synchro Pendulum Effect Monster",
	"XYZ Pendulum Effect Monster"
])

async function add_card(user_string: string) {
    // console.log(user_string);
    let valid_url;

    if (Number.isNaN(Number(user_string))){
        valid_url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${user_string}`
    } else {
        valid_url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${user_string}`
    }

    let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: valid_url,
        headers: {},
    };

    let card_data;
    let api_error;

    await axios
        .request(config)
        .then((response) => {
            card_data = response.data.data[0];
        })
        .catch((error) => {
            api_error = error.response.data.error;
            // console.log(api_error);
        });

    if (card_data == null) {
        return { success: false, error: api_error };
    }

    // console.log(card_data);

    const stored_data = {
        name: card_data.name,
    };

    // console.log(stored_data)
    
    if (extra_deck_types.has(card_data.type)){
        await updateDoc(extra_deck, {
            [card_data.id]: stored_data,
        });
    } else{
        await updateDoc(main_deck, {
            [card_data.id]: stored_data,
        });
    }

    return { success: true, stored_data: stored_data };
}

module.exports = {
    name: "add_card",
    description: "Adds a card to the cube",
    options: [
        {
            name: "name_or_id",
            description: "Card ID",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],

    callback: async (client: Client, interaction: CommandInteraction) => {
        await interaction.deferReply();

        if (interaction.user.id != "264066370348646400") {
            const embed = new EmbedBuilder().setTitle("Invalid User");

            interaction.editReply({ embeds: [embed] });
            return;
        }

        const api_response = await add_card(String(interaction.options.get("name_or_id")?.value));

        const embed = new EmbedBuilder()
            .setTitle(api_response.success ? "Card added!" : "Error")
            .setDescription(api_response.success ? `Added card ${api_response.stored_data.name}` : api_response.error)
            .setColor(api_response.success ? 0x00ff00 : 0xff0000);

        interaction.editReply({ embeds: [embed] });
    },
};
