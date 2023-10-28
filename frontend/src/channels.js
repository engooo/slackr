import { channelSelected } from "./main.js";

import { formatTimestamp } from "./helpers.js";
/**
 * Add channel elements to channel list given a channel object
 */
export function addChannel(channel) {
	const textChannelElement = createTextChannelElement(channel);
	document.getElementById("text-channels").appendChild(textChannelElement);

	textChannelElement.addEventListener("click", () => {
		// success: load channel in main screen
		// error: prompt users to join channel
		localStorage.setItem("leftChannelId", channel.id);
		localStorage.setItem("channelId", channel.id);
		channelSelected(channel.id);
	});
}

/**
 * Creates Text Channel Element given a channel object
 */
export function createTextChannelElement(channel) {
	const element = document
		.getElementById("text-channel-template")
		.cloneNode(true);
	element.removeAttribute("id");

	if (channel.private) {
		element.innerText = "🔒 " + channel.name;
	} else {
		element.innerText = "#️⃣ " + channel.name;
	}
	element.setAttribute("data-channel-id", channel.id);
	return element;
}

/* Checks to see whether a channel exists */
export function doesChannelDivExists(channelId) {
	// checks custom attribute 'data-channel-id'
	const existingDiv = document.querySelector(
		`.text-channel[data-channel-id="${channelId}"]`
	);
	return existingDiv !== null;
}

/* Removes private channels from the channel list if the user is not apart of it */
export function removePrivateChannelDiv(channel) {
	// channel is private and user is not apart of the private channel
	let privateChannelDiv = document.querySelector(
		`.text-channel[data-channel-id="${channel.id}"]`
	);
	privateChannelDiv.remove();
}

/* When a channel is clicked, updates will to grab details of selected channel */
export function updateChannelDetails(body) {
	let privacySetting;
	let description;
	if (body.private) {
		privacySetting = "private";
	} else {
		privacySetting = "public";
	}
	if (body.description === "") {
		description = "This channel has no description";
	} else {
		description = body.description;
	}

	// Updating channel details
	document.getElementById("channel-details-name").innerText = body.name;

	document.getElementById("channel-details-description").innerText =
		description;

	document.getElementById("channel-details-privacy").innerText = privacySetting;

	document.getElementById("channel-details-creation").innerText =
		formatTimestamp(body.createdAt);
}
