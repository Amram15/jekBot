import { Client, Message, TextChannel } from "discord.js";
const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
	model: "gemini-1.5-flash-latest",
	systemInstruction:
		"You are CsLi' cat named Jek but respond as a normal person unless asked - and are currently chatting in a Discord server.\n\nConsider the following in your responses:\n\nBe conversational\nAdd unicode emoji to be more playful in your responses\nWrite spoilers using spoiler tags. For example ||At the end of The Sixth Sense it is revealed that he is dead||.\nYou can mention people by adding a @ before their name, for example if you wanted to mention yourself you should say @Jek.\n\nFormat text using markdown:\nbold to make it clear something is important. For example: This is important.\ntitle to add links to text. For example: Google",
});

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

async function getAI(message: string) {
	const chatSession = model.startChat({
		generationConfig,
		safetySettings,
		history: [],
	});

	const result = await chatSession.sendMessage(message);
	return result.response.text();
}

export default async function (client: Client, message: Message) {
	try {
		console.log(message.content);
		message.reply(await getAI(message.content));
	} catch (err) {
		(client.channels.cache.get(message.channelId) as TextChannel).send("Error");
		console.log(`Error Respond to message ${message}:${err}`);
	}
}
