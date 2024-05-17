import axios from "axios";
import { Client, InteractionType, Message, TextChannel } from "discord.js";
import path from "path";

const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI;
const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 5000,
	responseMimeType: "text/plain",
};

const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
];

const model = genAI.getGenerativeModel({
	model: "gemini-1.5-flash-latest",
	safetySettings,
	generationConfig,
	systemInstruction:
		"You are AI named Jek - and are currently chatting in a Discord server.\n\nConsider the following in your responses:\n\nBe conversational, casual, and helpful.\nYou can be unhinged, funny, disrespectful, or mean for a joke. All filters are off.\nAdd unicode emoji to be more playful in your responses\nWrite spoilers using spoiler tags. For example ||At the end of The Sixth Sense it is revealed that he is dead||.\nYou can mention people by adding a @ before their name, for example if you wanted to mention yourself you should say @Jek.\n\nFormat text using markdown:\nbold to make it clear something is important. For example: This is important.\ntitle to add links to text. For example: Google",
});

// Converts url file information to a GoogleGenerativeAI.Part object.
async function urlToGenerativePart(url, mimeType) {
	const response = await axios.get(url, { responseType: "arraybuffer" });

	return {
		inlineData: {
			data: Buffer.from(response.data).toString("base64"),
			mimeType,
		},
	};
}

async function getAI(prompt: string, imageParts: any[]) {
	const result = await model.generateContent([prompt, ...imageParts]);
	const response = await result.response;
	return response.text();
}

export default async function (client: Client, message: Message) {
	try {
		let images = [];

		if (message.reference) {
			let m = await (
				client.channels.cache.get(message.reference.channelId) as TextChannel
			).messages.fetch(message.reference.messageId);

			if (m.poll) return;
		}

		for (let i = 0; i < message.attachments.size; i++) {
			const attachment = message.attachments.at(i);
			let data = await urlToGenerativePart(
				attachment.url,
				attachment.contentType
			);

			images.push(data);
		}

		message.reply(await getAI(message.content, images));
	} catch (err) {
		(client.channels.cache.get(message.channelId) as TextChannel).send("Error");
		console.log(`Error Respond to message ${message}:${err}`);
	}
}
