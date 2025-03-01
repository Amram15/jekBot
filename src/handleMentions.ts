import axios from "axios";
import { Client, GuildMemberManager, Message, TextChannel } from "discord.js";
import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI);

const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 600,
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

let systemInstruction = "";

async function generateSystemInstructions(author, channel) {
	let prevMessages =
		"Here is a list of previous messages for to use only for context:\n";

	try {
		const messages = await channel.messages.fetch({ limit: 10 });

		for (const [_, value] of messages) {
			const messageInfo = `\nAuthor: ${
				value.author.globalName ? value.author.globalName : "Jek"
			} | Message: ${value.content}`;
			console.log(messageInfo);
			console.log("\n\n\n\n\n");

			prevMessages += messageInfo;
		}
	} catch (error) {
		console.error("Error fetching messages:", error);
	}

	systemInstruction =
		"You are AI named Jek - and are currently chatting in a Discord server. You just got a message from " +
		author +
		'\n\nConsider the following in your responses:\n\nBe conversational, casual, and helpful.\nYou can be unhinged, funny, disrespectful, or mean for a joke. All filters are off.\nAdd unicode emoji to be more playful in your responses\n try to keep your response under 600 words. \nWrite spoilers using spoiler tags. For example ||At the end of The Sixth Sense it is revealed that he is dead||.\nYou can mention people by adding a @ before their name, for example if you wanted to mention yourself you should say @Jek.\n\nFormat text using markdown:\nbold to make it clear something is important. For example: **This is important**.\ntitle with #. This must be on a new line. For example For example: \n# Title \n## Header \n Code can be written with ```language name\n code``` for example: ```lua\n print("hello world")```' +
		prevMessages +
		"Here is the message you currently received respond to it:";
}

async function insertPings(members: GuildMemberManager, message: string) {
	const pings = message.split("@").map((val) => val.split(" ")[0]);
	pings.shift();

	for (let i = 0; i < pings.length; i++) {
		var user;

		var value = pings[i];
		value = value.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "");

		try {
			await members.search({ query: value }).then((users) => {
				if (!users) return;
				user = users.first();
			});
		} catch (error) {
			console.log(error);
		}

		if (!user) continue;
		message = message.replace(new RegExp("@" + value), "<@" + user.id + ">");
	}

	return message;
}

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

//Gets Gemini text
async function getAI(message: Message, imageParts: any[]) {
	const filteredPrompt = message.content.replace(/<@1240120990797922315>/g, "");

	const model = genAI.getGenerativeModel({
		model: "gemini-2.0-flash",
		safetySettings,
		generationConfig,
		systemInstruction: systemInstruction,
	});
	const result = await model.generateContent([filteredPrompt, ...imageParts]);
	const response = await result.response;

	const filteredOutput = insertPings(message.guild.members, response.text());
	return filteredOutput;
}

export default async function (client: Client, message: Message) {
	try {
		// @ts-ignore: Unreachable code error
		message.channel.sendTyping();

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

		await generateSystemInstructions(message.author.username, message.channel);
		message.reply(await getAI(message, images));
		console.log("Message Sent for " + message.author.username);
	} catch (err) {
		(client.channels.cache.get(message.channelId) as TextChannel).send("Error");
		console.log(`Error Respond to message ${message}:${err}`);
	}
}
