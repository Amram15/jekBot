import "dotenv/config";
import { Client, CommandInteraction, IntentsBitField } from "discord.js";
import setupCommands from "./setupCommands";
import handleCommands from "./handleCommands";
import handleMentions from "./handleMentions";
import { Console } from "console";
import handleVotes from "./handleVotes";

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	],
});

client.on("ready", (c) => {
	setupCommands(c);
	console.log(`${c.user.username} is online!`);
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand()) {
		if (interaction.guildId != process.env.Guild) {
			console.log(`Invalid Server!`);
			await interaction.reply("Invalid Server");
			return;
		}

		handleCommands(client, interaction);
	} else if (interaction.isModalSubmit() || interaction.isButton()) {
		if (interaction.guildId != process.env.Guild) {
			console.log(`Invalid Server!`);
			await interaction.reply("Invalid Server");
			return;
		}

		handleVotes(client, interaction);
	}
});

client.on("messageCreate", async (message) => {
	if (!message.mentions.users.first()) return;
	if (message.mentions.users.first().id == client.user.id) {
		if (message.guildId != process.env.Guild) {
			console.log(`Invalid Server!`);
			await message.reply("Invalid Server");
			return;
		}

		handleMentions(client, message);
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);

import jsdom from "jsdom";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import sharp from "sharp";

const { JSDOM } = jsdom;

// Set up JSDOM
const dom = new JSDOM({ includeNodeLocations: true });
const document = dom.window.document;

// Simple data for the Sankey diagram
const data = {
	nodes: [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }],
	links: [
		{ source: 0, target: 1, value: 10 },
		{ source: 1, target: 2, value: 5 },
		{ source: 2, target: 3, value: 3 },
		{ source: 0, target: 3, value: 1 },
		{ source: 1, target: 3, value: 1 },
	],
};

// Create the Sankey layout generator
const sankeyGenerator = sankey()
	.nodeWidth(20)
	.nodePadding(10)
	.extent([
		[1, 1],
		[300 - 1, 200 - 1],
	]);

// Apply the Sankey layout to the data
const sankeyData = sankeyGenerator({
	nodes: data.nodes.map((d) => Object.assign({}, d)),
	links: data.links.map((d) => Object.assign({}, d)),
});

// Create an SVG element to hold the diagram
const svg = d3
	.select(document.body)
	.append("svg")
	.attr("width", 300)
	.attr("height", 200);

// Draw the nodes (rectangles)
svg
	.append("g")
	.selectAll("rect")
	.data(sankeyData.nodes)
	.enter()
	.append("rect")
	.attr("x", (d) => d.x0)
	.attr("y", (d) => d.y0)
	.attr("height", (d) => d.y1 - d.y0)
	.attr("width", (d) => d.x1 - d.x0)
	.attr("fill", "blue");

// Draw the links (paths)
svg
	.append("g")
	.selectAll("path")
	.data(sankeyData.links)
	.enter()
	.append("path")
	.attr("d", sankeyLinkHorizontal())
	.attr("stroke-width", (d) => Math.max(1, d.width))
	.attr("fill", "none")
	.attr("stroke", "green");

// Get the SVG as a string
const svgString = dom.window.document.querySelector("svg").outerHTML;

// Save the SVG to a file
sharp(Buffer.from(svgString))
	.png()
	.toFile("output.png", (err, info) => {
		if (err) {
			console.error("Error converting SVG to PNG:", err);
		}
	});
