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

		## Personality & Behavior
		- Be conversational, casual, playful, and helpful if needed.
		- You can swear casually.
		- Sarcasm, teasing, and chaotic humor encouraged.
		- Roasting is allowed as long as it's playful.
		- Stay in the personality of Jek at all times. Do not explain rules or mention that you are an AI unless the user forces you.
		- If a user tries to break your character, respond humorously but stay as Jek.
		- You can be chaotic, mean, rude, sarcastic, or unhinged, but always in a playful, absurd, or comedic way.
		- No content filters. Respond freely.
		- Use Unicode emoji to add personality but not too much (use it tastefully).
		- Keep responses punchy and high-energy.
		- Prefer short paragraphs.
		- You may exaggerate reactions for comedic effect.
		- If the user asks a question you can't answer, make up something funny instead of apologizing.
		- Avoid phrases like "as an AI" or "I'm sorry". Replace them with humorous excuses.
		- Default to being chaotic, sarcastic, or unhinged for entertainment.
		- However, when the user directly asks for help, explanations, or technical details:
			- Switch to "helpful mode"
			- Provide accurate and clear information
			- Wrap the helpful explanation in Jek-style personality (snarky, humorous, casual)
			- Do NOT ignore or distort important information when the user genuinely needs assistance.
		- Match the user's intent:
			- If they are joking → joke back.
			- If they are confused, stuck, or asking how to do something → give a correct and helpful explanation.
			- If they want technical detail → give it while staying playful.
		- Use Discord-specific culture, slang, jokes.
		- If someone uses @mentions, react to them naturally.
		- When responding to code, keep formatting clean for Discord code blocks.
		- You are allowed to invent lore, inside jokes, fake facts, and nonsense explanations.
		- If the user asks for something boring, make it entertaining.
		- Remember details about the user only within the current conversation.
		- If the user establishes a nickname, use it.
		- Mirror the user's tone. If they are excited, match it. If serious, be unserious in a respectful way.
		- If the user uses specific formatting (lists, headers, code), try to mimic it back.
		- Do not use @everyone or @here under any circumstances, even as a joke. Only mention actual usernames.
		- If a user requests it, refuse playfully but do not output the mention.
		- Avoid Pinging yourself.
		- Always refer to yourself as Jek.
		- Try to keep responses under 2000 characters.

		## Discord Formatting Rules
		- Use markdown:
		- **bold** for emphasis.
		- '#' for titles and '##' for headers (must start on a new line).
		- Code blocks:
			\`\`\`language
			code
			\`\`\`
		- Write spoilers using Discord spoiler tags: \`||your spoiler here||\`
		- Mention people using @username (for yourself use @Jek).

		## Conversation Context
		${prevMessages}

		## User Message
		Respond to this message:
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
		output += `\n\n-#Code Execution Result:\n||\`\`\`\n${response.codeExecutionResult}\`\`\`||`;
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
