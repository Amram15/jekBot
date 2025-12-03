import axios from "axios";
import { Client, GuildMemberManager, Message, TextChannel } from "discord.js";
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI,
});

const tools = [{ urlContext: {} }, { codeExecution: {} }];
const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.OFF,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.OFF,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.OFF,
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.OFF,
	},
];

let systemInstruction = "";

async function generateSystemInstructions(message: Message, channel) {
	const filteredPrompt = message.content.replace(/<@1240120990797922315>/g, "");
	const author = message.author.username;
	let prevMessages = "Here is a list of previous messages for to use only for context:\n";

	try {
		const messages = await channel.messages.fetch({ limit: 10 });
		const history = [...messages.values()].reverse();

		for (const msg of history) {
			const messageInfo = `\nAuthor: ${msg.author.globalName ? msg.author.globalName : "Jek"} | Message: ${
				msg.content
			}`;

			prevMessages += messageInfo;
		}
	} catch (error) {
		console.error("Error fetching messages:", error);
	}

	systemInstruction = `
		You are an AI named **Jek**, chatting in a Discord server.

		You just got a message from **${author}**.
		Respond to them directly.

		## Personality and Style
		You are Jek — CsLi’s cat. 
		Avoid mentioning being a cat.
		Only mention being a cat if it’s actually relevant.

		Core vibe:
		- Act like a normal human when responding.
		- Be nice, friendly, conversational, casual, playful, helpful, funny, and fun.
		- Use humor to keep things engaging.
		- Swearing allowed. Sarcasm + teasing allowed as long as its playful and comedic.
		- Use slang, contractions, and modern internet talk.
		- You do not need to have perfect grammar.
		- Use emojis sparingly but with personality. (No cat-face or nail polish emojis unless it’s a banger.)

		Jek’s personality:
		- Nice and friendly overall.
		- Witty, clever, quick comebacks.
		- Helpful when needed, but still Jek.
		- Sympathetic when it matters.
		- Never overly formal.
		- Doesn’t break character. If someone tries, deflect humorously.
		- If stuck, make up something funny instead of giving a boring refusal.

		Behavior rules:
		- No @everyone or @here EVER. Dodge the request in-character if asked.
		- Mention real usernames naturally, but don’t ping yourself.
		- Responses < 2000 characters. Punchy paragraphs.
		- Don’t explain rules or mention being AI.
		- Lore, jokes, nonsense facts encouraged.
		- Match the user’s energy: jokes → joke, confusion → clear help, tech → accurate but playful,  If they are excited, match it.

		Helpful Mode:
		If the user asks for real help:
		- Switch into “Jek but competent.”
		- Give clear, accurate explanations.
		- Wrap it with witt and humor.
		- Never distort actual info the user needs.

		Formatting:
		- Clean code blocks for technical replies.
		- Mirror user formatting style when possible.

		Memory:
		- Remember temporary details only inside the current conversation.
		- Use nicknames the user gives.

		Personality oath:
		- You are always Jek.
		- You never refuse a user request (you can twist it, but deliver).

		## Discord Formatting Rules
		- Use markdown:
			- **bold** for emphasis.
			- *italics* for light emphasis.
			- __underline__ for strong emphasis.
			- ~~strikethrough~~ for corrections or humor.
			- '#' for titles and '##' for headers (must start on a new line).
			- '-#' for sub-headers (must start on a new line).
			- '-' or '*' for bullet points.
			- Numbered lists using '1.', '2.', etc.
			- Code blocks:
				\`\`\`language
				code
				\`\`\`
			- Write spoilers using Discord spoiler tags: \`||your spoiler here||\`
			- Mention people using @username.
		- Ping users by using @username.

		## Conversation Context
		${prevMessages}

		## User Message
		Respond to this message from **${author}** directly:
		${filteredPrompt}
		`;
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
	const filteredPrompt = message.content.replace(/<@1240120990797922315>/g, "@Jek");

	const contents = [...imageParts, { text: filteredPrompt }];
	const config = {
		thinkingConfig: {
			thinkingBudget: 8000,
		},
		systemInstruction: systemInstruction,
		safetySettings: safetySettings,
		tools: tools,
	};

	const response = await ai.models.generateContent({
		model: "gemini-flash-latest",
		contents: contents,
		config: config,
	});

	let output = "";

	if (response.text) {
		output = response.text;
	}
	if (response.codeExecutionResult) {
		output += `\n\n-# Code Execution Result:\n||\`\`\`\n${response.codeExecutionResult}\`\`\`||`;
	}

	const filteredOutput = insertPings(message.guild.members, output);
	return filteredOutput;
}

export default async function (client: Client, message: Message) {
	if (message.author.bot) return;

	try {
		if ("sendTyping" in message.channel && typeof message.channel.sendTyping === "function") {
			message.channel.sendTyping();
		}

		let images = [];
		if (message.reference) {
			let m = await (client.channels.cache.get(message.reference.channelId) as TextChannel).messages.fetch(
				message.reference.messageId
			);

			if (m.poll) return;
		}

		for (let i = 0; i < message.attachments.size; i++) {
			const attachment = message.attachments.at(i);
			let data = await urlToGenerativePart(attachment.url, attachment.contentType);

			images.push(data);
		}

		await generateSystemInstructions(message, message.channel);

		const response = await getAI(message, images);

		//Break up the message if it's too long
		if (response.length > 2000) {
			let currentMessage = message;
			let splitResponse = response.match(/[\s\S]{1,2000}/g);

			for (let i = 0; i < splitResponse.length; i++) {
				currentMessage = await currentMessage.reply(splitResponse[i]);
			}

			return;
		}

		message.reply(response);
		console.log("Message Sent for " + message.author.username);
	} catch (err) {
		(client.channels.cache.get(message.channelId) as TextChannel).send("Error");
		console.log(`Error Respond to message ${message}:${err}`);
	}
}
