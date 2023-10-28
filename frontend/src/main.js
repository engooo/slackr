import { BACKEND_PORT } from "./config.js";
// A helper you may want to use when uploading new images to the server.
import {
	apiCallPost,
	apiCallGet,
	apiCallPut,
	apiCallDelete,
	apiCallChannel,
	apiJoinServer,
	apiLeaveServer,
	apiSaveChanges,
	apiCreateChannel,
	apiLogin,
	apiUserDetails,
	apiListUsers,
	apiInviteUser,
	apiUpdateProfile,
} from "./apiCalls.js";
import {
	formatTimestamp,
	updateResponsiveScreen,
	clearMessages,
	showErrorPopup,
	fileToDataUrl,
} from "./helpers.js";
import {
	editMessageModal,
	messageActionsModal,
	createChannelModal,
	joinServerModal,
	showChannelDetailsModal,
	inviteUsersModal,
	userProfileModal,
} from "./modals.js";
import {
	addChannel,
	createTextChannelElement,
	doesChannelDivExists,
	removePrivateChannelDiv,
	updateChannelDetails,
} from "./channels.js";
let globalToken = null;
let currentUserId = null;
let selectedChannelId = null;
let selectedMessageId = null;
let selectedMessageEdited = null;
let selectedMessageText = null;
let mobile = false;
let pageIndex = 1;
let numMessages = 0;
let leftChannelId = null;
let pinnedPageIndexStart = 1;
let pinnedPageIndex = 1;
let skullNum = 0;
let heartNum = 0;
let thumbsNum = 0;
// let reacted = null;
let leftChannel = null;
let viewingPin = false;
let profilePicture = null;

function loadMessages(channelId, index) {
	console.log("load messages");

	apiCallGet(`message/${channelId}?start=${index}`, {}, true, globalToken)
		.then((body) => {
			numMessages = body.messages.length;
			/* No more messages left so remove next button*/
			if (numMessages === 0) {
				nextPage.style.display = "none";
			}

			/* On first page of messages so remove hide previous button */
			if (pageIndex === 1) {
				previousPage.style.display = "none";
			}
			console.log("numMessages", numMessages);
			body.messages.forEach((message) => {
				console.log("in loadmessages", message);
				addMessage(message);
			});
			console.log(body, "end");
		})
		.catch(() => {
			console.log("failed to load msgs");
		});
}

// 2.3.2 DEALING WITH PAGINATION
const nextPage = document.getElementById("next-page");
const previousPage = document.getElementById("previous-page");
nextPage.addEventListener("click", () => {
	clearMessages();
	pageIndex++;
	loadMessages(selectedChannelId, (pageIndex - 1) * 25);

	previousPage.style.display = "block";
});

previousPage.addEventListener("click", () => {
	clearMessages();
	pageIndex--;
	loadMessages(selectedChannelId, (pageIndex - 1) * 25);
	nextPage.style.display = "block";
});

// 2.3.3 Sending Messages
function isValidMessage(message) {
	return message.length === 0 || message.trim().length === 0;
}

const sendMessageButton = document.getElementById("send-button");
sendMessageButton.addEventListener("click", () => {
	const messageText = document.getElementById("send-message").value;
	console.log("messageText", messageText);
	if (isValidMessage(messageText)) {
		showErrorPopup("Empty Message!");
	} else {
		apiCallPost(
			`message/${selectedChannelId}`,
			{
				message: messageText,
				image: "",
			},
			true,
			globalToken
		)
			.then((body) => {
				console.log("sendMessageButton success", body);
				document.getElementById("send-message").value = "";

				console.log(selectedChannelId);
				apiCallGet(
					`message/${selectedChannelId}?start=0`,
					{},
					true,
					globalToken
				)
					.then((body) => {
						// pageIndex++;
						console.log("messages[0]", body.messages[0]);
						const message = body.messages[0];
						addMessage(message, false);
					})
					.catch(() => {
						console.log("failed to load msgs from send");
					});
			})
			.catch(() => {
				console.log("sendMessageButton failed");
			});
	}
});

// 2.3.4 Remove Messages
const deleteMessageButton = document.getElementById("delete-button");
deleteMessageButton.addEventListener("click", () => {
	apiCallDelete(
		`message/${selectedChannelId}/${selectedMessageId}`,
		{},
		true,
		globalToken
	)
		.then(() => {
			const messageToDelete = document.querySelector(
				`.message-element[data-message-id="${selectedMessageId}"]`
			);
			console.log(messageToDelete);
			messageToDelete.remove();
		})
		.catch(() => {
			console.log("msg didnt");
			errorPopup("User has no permission to delete this message");
		});
	messageActionsModal.hide();
});

// 2.3.5 Editing Messages
const editButton = document.getElementById("edit-button");
editButton.addEventListener("click", () => {
	editMessageModal.show();
	document.getElementById("edit-message").value = selectedMessageText;
});

const saveEditMessage = document.getElementById("save-changes");
saveEditMessage.addEventListener("click", () => {
	// Check if the message has actually been changed
	const newEditedMessage = document.getElementById("edit-message").value;

	if (isValidMessage(newEditedMessage)) {
		showErrorPopup("Empty Message!");
	} else if (selectedMessageText === newEditedMessage) {
		showErrorPopup("Message was not edited");
	} else {
		// Update message details in backend
		apiCallPut(
			`message/${selectedChannelId}/${selectedMessageId}`,
			{
				message: newEditedMessage,
				image: "",
			},
			true,
			globalToken
		)
			.then(() => {
				console.log("message was updated in databse");
			})
			.catch(() => {
				console.log("message failed to update");
			});

		// Update current interface with new message
		const thisPageIndex = (pageIndex - 1) * 25;
		apiCallGet(
			`message/${selectedChannelId}?start=${thisPageIndex}`,
			{},
			true,
			globalToken
		)
			.then((body) => {
				updateEditMessageNow(body.messages);
			})
			.catch(() => {
				console.log("getMessageProperty failed");
			});
	}

	editMessageModal.hide();
	messageActionsModal.hide();
});

// Updates edited message in real time without refresh
function updateEditMessageNow(messagesObject) {
	console.log("in apicallget", messagesObject);
	let message = getMessageProperty(
		messagesObject,
		selectedMessageId,
		"message"
	);
	const editedAt = getMessageProperty(
		messagesObject,
		selectedMessageId,
		"editedAt"
	);
	const messageToEdit = document.querySelector(
		`.message-element[data-message-id="${selectedMessageId}"]`
	);

	messageToEdit.querySelector("#message-time").innerText =
		"✎" + formatTimestamp(editedAt);
	messageToEdit.querySelector("#message-text").innerText = message;
}

function getMessageProperty(messagesObject, messageId, msgProperty) {
	for (const message of messagesObject) {
		console.log("in for loop", message, message.id, messageId);
		if (message.id === messageId) {
			return message[msgProperty]; // Found the message with the matching id
		}
	}

	return null; // Message not found
}

// 2.3.6 Reacting to messages
const reactions = document.querySelectorAll(".react-button");
reactions.forEach((emoji) => {
	emoji.addEventListener("click", (event) => {
		const emojiElementId = event.currentTarget.id;
		let emojiText = document.getElementById(`text-${emojiElementId}`).innerText;
		console.log("wei", emojiElementId, emojiText);
		if (emojiText.includes("💀")) {
			emojiText = "💀";
		} else if (emojiText.includes("❤️")) {
			emojiText = "❤️";
		} else if (emojiText.includes("👍")) {
			emojiText = "👍";
		}
		console.log(emojiText, "emoji to be inputted");
		updateNumReactions(emojiText);
	});
});

function updateNumReactions(emojiText) {
	// find that messages reacts
	let thisPageIndex = (pageIndex - 1) * 25;
	console.log(9.2, skullNum, heartNum, thumbsNum);
	apiCallGet(
		`message/${selectedChannelId}?start=${thisPageIndex}`,
		{},
		true,
		globalToken
	)
		.then((body) => {
			const messagesObject = body.messages;
			const reactMessages = getMessageProperty(
				messagesObject,
				selectedMessageId,
				"reacts"
			);
			console.log(1, messagesObject);
			console.log(
				1.69,
				getMessageProperty(messagesObject, selectedMessageId, "message")
			);
			// CHECK IF USER HAS REACTED
			let reacted = false;
			// No reactions from any users on message
			console.log("emoji nums increment1.69b4", skullNum, heartNum, thumbsNum);
			console.log(2, reactMessages, "reactMessages", selectedMessageId);

			console.log("emoji nums increment1.69", skullNum, heartNum, thumbsNum);
			if (reactMessages.length === 0) {
				reactApi("react", emojiText);

				console.log("emoji nums increment1", skullNum, heartNum, thumbsNum);
				incrementReaction(emojiText);
				console.log(
					"emoji nums after increment1",
					skullNum,
					heartNum,
					thumbsNum
				);
			} else {
				// Check if user has reacted to this message
				resetEmojiNum();
				for (const reactElement of reactMessages) {
					console.log(reactElement, 3.3);
					// Iterate through reactions to check if user has reacted to msg
					let reactValue = reactElement.react;
					console.log(reactValue, reactElement.user);
					incrementReaction(reactElement.react);
					if (reactValue === emojiText && reactElement.user === currentUserId) {
						reacted = true;
						console.log("should be true", reactValue, emojiText);
					}

					console.log("emoji nums increment2", skullNum, heartNum, thumbsNum);
					// incrementReaction(emojiText)
					console.log(
						"emoji nums after increment2",
						skullNum,
						heartNum,
						thumbsNum
					);
				}
				console.log(2, reactMessages, "reactMessages");

				console.log(3, reacted, emojiText);
				if (reacted === true) {
					reactApi("unreact", emojiText);
					console.log(4);

					decrementReaction(emojiText);
					console.log("emoji nums decrement", skullNum, heartNum, thumbsNum);
					console.log(4.5);
					// something in here is wrong
					//TODO: if skullNum === 0, show emoji block
				} else {
					console.log(6, "should react to msg");
					reactApi("react", emojiText);
					// Count number of reactions
					console.log(
						"emoji nums increment3",
						skullNum,
						heartNum,
						thumbsNum,
						emojiText
					);
					incrementReaction(emojiText);
					console.log(
						"emoji nums afrter increment3",
						skullNum,
						heartNum,
						thumbsNum,
						emojiText
					);
				}
			}

			console.log(7);

			console.log(1);
			const messageToEdit = document.querySelector(
				`.message-element[data-message-id="${selectedMessageId}"]`
			);
			updateReactionUI(messageToEdit);

			console.log(5);
		})
		.catch(() => {
			console.log("updateNumreactions failed");
		});
	console.log(9.3, skullNum, heartNum, thumbsNum);
}

function updateReactionUI(messageToEdit) {
	console.log(messageToEdit, "mesagetoedit");
	console.log(4.6);
	messageToEdit.querySelector("#text-skull").innerText =
		skullNum > 0 ? skullNum + "💀" : "💀";
	console.log(4.7);
	messageToEdit.querySelector("#text-heart").innerText =
		heartNum > 0 ? heartNum + "❤️" : "❤️";
	console.log(4.8);
	messageToEdit.querySelector("#text-thumbs-up").innerText =
		thumbsNum > 0 ? thumbsNum + "👍" : "👍";
	console.log(4.9);
}

function incrementReaction(reactValue) {
	if (reactValue === "💀") {
		skullNum++;
	} else if (reactValue === "❤️") {
		heartNum++;
	} else if (reactValue === "👍") {
		thumbsNum++;
	}
}

function decrementReaction(emojiText) {
	if (emojiText === "💀") {
		skullNum--;
	} else if (emojiText === "❤️") {
		heartNum--;
	} else if (emojiText === "👍") {
		thumbsNum--;
	}
}

function reactApi(reactAction, reactEmoji) {
	apiCallPost(
		`message/${reactAction}/${selectedChannelId}/${selectedMessageId}`,
		{
			react: reactEmoji,
		},
		true,
		globalToken
	)
		.then((body) => {
			console.log("reactApi success", reactAction, body, reactEmoji);
		})
		.catch((error) => {
			console.log("reactApi failed", error);
		});
}

// 2.3.7 Pinning messages
const pinMessageButton = document.getElementById("pin-button");
pinMessageButton.addEventListener("click", () => {
	console.log("pin button clicked!");
	apiPinMsg("pin");
});

const unpinMessageButton = document.getElementById("unpin-button");
unpinMessageButton.addEventListener("click", () => {
	console.log("unpin button clicked!");
	apiPinMsg("unpin");
});

const viewPinnedMessages = document.getElementById("view-pinned-messages");
viewPinnedMessages.addEventListener("click", () => {
	viewingPin = !viewingPin;
	pinnedPageIndexStart = 1;
	if (viewingPin) {
		console.log("view pinned msgs yipyip");
		clearMessages();
		numMessages = 0;
		loadPinnedMessages();
	} else {
		loadMessages(selectedChannelId, 0);
	}
});

function loadPinnedMessages() {
	apiCallGet(
		`message/${selectedChannelId}?start=${(pinnedPageIndexStart - 1) * 25}`,
		{},
		true,
		globalToken
	)
		.then((body) => {
			numMessages = body.messages.length;
			/* No more messages left so remove next button*/
			console.log("numMessages", numMessages);
			const pinnedMessages = body.messages.filter((message) => message.pinned);
			pinnedMessages.forEach((message) => {
				addMessage(message);
				console.log(message, "should get pinned");
			});
			if (numMessages === 0) {
				console.log("wghoop");
			} else {
				pinnedPageIndexStart++;
				loadPinnedMessages();
			}
			console.log(body);
		})
		.catch(() => {
			console.log("failed to load msgs");
		});
}

function apiPinMsg(pinAction) {
	apiCallPost(
		`message/${pinAction}/${selectedChannelId}/${selectedMessageId}`,
		{},
		true,
		globalToken
	)
		.then((body) => {
			console.log("pinned messages success!", pinAction, body);
		})
		.catch((error) => {
			showErrorPopup(`You have already ${pinAction}ed the message` + error);
		});
}

// 2.4 Multi-user interactivity
const addUsersButton = document.getElementById("add-users-button");
addUsersButton.addEventListener("click", () => {
	inviteUsersModal.hide();
	const usersSelected = document.querySelectorAll(".user-checkbox:checked");
	usersSelected.forEach((checkbox) => {
		console.log(checkbox.parentElement);
		const userId = checkbox.parentElement.getAttribute("data-user-id");
		console.log(userId, "pls printid");
		apiInviteUser(selectedChannelId, parseInt(userId, 10), globalToken);
	});
});
document.getElementById("invite-users-button").addEventListener("click", () => {
	clearInviteList();
	populateInviteList();
	console.log("called 2.34");
	inviteUsersModal.show();
});

const clearInviteList = () => {
	const inviteList = document.querySelectorAll(
		".user-item:not(#user-item-template)"
	);
	inviteList.forEach((userElement) => userElement.remove());
};

const populateInviteList = () => {
	const users = apiListUsers(globalToken);
	users
		.then((user) => {
			const usersList = user.users;
			// userId contains Id and email
			// user contains name
			const usersMapped = usersList.map((userId) => {
				return apiUserDetails(userId.id, globalToken).then((user) => ({
					userId: userId.id,
					name: user.name,
				}));
			});
			return Promise.all(usersMapped);
		})
		.then((usersMapped) => {
			// sort alphabetically
			// usersMapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
			// console.log(usersMapped, 'b4 filter')
			// usersMapped.filter(user => !isUserMember(user.userId));
			// return Promise.all(usersMapped)

			// Sort alphabetically
			usersMapped.sort((a, b) =>
				a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
			);

			const memberPromises = usersMapped.map((user) =>
				isUserMember(user.userId)
			);
			return Promise.all(memberPromises).then((isMembers) => {
				const filteredUsers = usersMapped.filter(
					(user, index) => !isMembers[index]
				);
				return filteredUsers;
			});
		})
		.then((filteredUsers) => {
			console.log("surely filtered", filteredUsers);
			createUserItems(filteredUsers);
		});
};
const createUserItems = (inviteList) => {
	// clearInviteList()
	console.log("hello r u being called");
	const userItemTemplate = document.getElementById("user-item-template");
	const userItemList = document.querySelector(".user-list");
	console.log(44.4, inviteList);
	inviteList.forEach((user) => {
		console.log(user, 46);
		const userItem = userItemTemplate.cloneNode(true);
		console.log(44.5);
		userItem.removeAttribute("id");
		userItem.setAttribute("data-user-id", user.userId);
		console.log(44.3);
		userItem.querySelector(".user-checkbox").value = user.name;
		userItem.querySelector('label[for="user1"]').innerText = user.name;
		//TODO idk if this works for input and labels
		console.log(44.2);
		userItem.style.display = "block";
		userItemList.append(userItem);

		console.log(userItem, "44.1");
	});
	// console.log(userItem, 'new element??s')
	// userItemList.appendChild(userItem)
};
// TODO: make is user member of channel
const isUserMember = (userId) => {
	return apiCallChannel(selectedChannelId, globalToken).then((channel) => {
		console.log(channel.members.includes(userId), "goteem", userId);
		return channel.members.includes(userId);
	});
};

// 2.4.2 User Profiles
const messageProfileEvent = (messageElement) => {
	const messageUsername = messageElement.querySelector("#message-username");
	messageUsername.addEventListener("click", () => {
		userProfileModal.show();
		document
			.querySelectorAll(".hide-profile")
			.forEach((e) => (e.style.display = "none"));

		const userId = messageElement.getAttribute("data-sender-id");
		populateProfile(userId);
	});
};
let currentEmail;
const populateProfile = (userId) => {
	apiUserDetails(userId, globalToken).then((userDetails) => {
		currentEmail = userDetails.email;
		console.log(
			"userdee",
			userDetails.name,
			userDetails.bio,
			userDetails.email,
			userDetails.image
		);

		document.getElementById("user-profile-name").innerText = userDetails.name;
		document.getElementById("user-profile-bio").innerText = userDetails.bio;
		document.getElementById("user-profile-email").innerText = userDetails.email;

		if (userDetails.image !== null) {
			document.getElementById("user-profile-photo").src = userDetails.image;
		}

		console.log("watdis", userId, currentUserId);
		if (parseInt(userId, 10) === parseInt(currentUserId, 10)) {
			document
				.querySelectorAll(".hide-profile")
				.forEach((e) => (e.style.display = "block"));
			document.getElementById("user-profile-name").contentEditable = "true";
			document.getElementById("user-profile-bio").contentEditable = "true";
			document.getElementById("user-profile-email").contentEditable = "true";
		}
	});
};

// 2.4.3 Viewing and editing user's own Profile
const viewOwnProfile = document.getElementById("view-profile");
viewOwnProfile.addEventListener("click", () => {
	userProfileModal.show();
	populateProfile(currentUserId);
	document
		.querySelectorAll(".hide-profile")
		.forEach((e) => (e.style.display = "block"));
});

const newPassword = document.getElementById("new-password");
const saveProfileChanges = document.getElementById("profile-save-changes");
const togglePassword = document.getElementById("toggle-password-visibility");
let passwordVisble = false;

saveProfileChanges.addEventListener("click", () => {
	userProfileModal.hide();
	console.log(newPassword.value);

	const name = document.getElementById("user-profile-name").innerText;
	const email = document.getElementById("user-profile-email").innerText;
	const password = document.getElementById("profile-save-changes").value;
	const fileInput = document.getElementById("photo-upload");
	const selectedFile = fileInput.files[0];
	let image = document.getElementById("user-profile-photo").src;
	let bio = document.getElementById("user-profile-bio").innerText;

	if (image === null) {
		image = "default.png";
	}

	if (bio === null) {
		bio = "";
	}
	let body = {
		email: email,
		password: password,
		name: name,
		bio: bio,
		image: image,
	};
	if (email === currentEmail) {
		delete body.email;
	}

	if (password.length === 0 || password.trim().length === 0) {
		delete body.password;
	}

	if (selectedFile) {
		console.log("yipee file was uploaded");
		fileToDataUrl(selectedFile).then((dataUrl) => {
			body.image = dataUrl;
			console.log(dataUrl);
			apiCallPut("user", body, true, globalToken);
		});

		console.log(name, bio, email, image, password, "did vals change");
	}

	// fileToDataUrl()

	console.log(body);
});

// Showing/Hiding Password
togglePassword.addEventListener("click", () => {
	passwordVisble = !passwordVisble;
	newPassword.type = passwordVisble ? "text" : "password";
	togglePassword.innerText = passwordVisble ? "Hide" : "Show";
});

function createMessageElement(message) {
	const element = document.getElementById("message-template").cloneNode(true);
	element.removeAttribute("id");
	element.setAttribute("data-message-id", message.id);
	element.setAttribute("data-sender-id", message.sender);
	console.log(5.1);
	// Access and process message properties here
	const messageId = message.id;
	const messageText = message.message;
	let messageImage = message.image;
	const edited = message.edited;
	const reacts = message.reacts; // This is an array of reacts
	console.log("messageImaWTF", messageImage);
	console.log(
		"createMsg",
		reacts.length,
		reacts,
		messageId,
		messageText,
		message
	);
	resetEmojiNum();
	if (reacts.length > 0) {
		for (const emoji of reacts) {
			console.log("emojia", emoji, emoji.react);

			console.log("emoji nums increment4", skullNum, heartNum, thumbsNum);
			incrementReaction(emoji.react);
			console.log("emoji nums after increment4", skullNum, heartNum, thumbsNum);
		}
		console.log("create msg emoji", skullNum, heartNum, thumbsNum);
		// const messageToEdit = document.querySelector(`.message-element[data-message-id="${selectedMessageId}`)
		updateReactionUI(element);
		resetEmojiNum();
	}
	console.log(5.2);
	// console.log('messageimage', messageImage)

	if (
		messageImage === undefined ||
		messageImage === null ||
		messageImage === ""
	) {
		console.log("messageimage", messageImage);
		messageImage = "default.png";
	}
	console.log("messageImage from createmessage ", messageImage);
	// apiUserDetails(message.sender, globalToken).then(user => {

	// })
	// element.querySelector("#message-profile-picture").src = messageImage;
	// element.querySelector("#message-username").innerText = message.sender;
	console.log(5.7);
	element.querySelector("#message-text").innerText = messageText;
	if (edited) {
		element.querySelector("#message-time").innerText =
			"✎" + formatTimestamp(message.editedAt);
	} else {
		element.querySelector("#message-time").innerText = formatTimestamp(
			message.sentAt
		);
	}

	console.log(5.8);
	apiUserDetails(message.sender, globalToken)
		.then((userDetails) => {
			element.querySelector("#message-username").innerText = userDetails.name;
			element.querySelector("#message-profile-picture").src = userDetails.image;
		})
		.catch(() => {
			console.log("apiUserDetails(userID) failed");
		});
	console.log("createMessageElement", element);
	console.log(5.9);
	return element;
}

const loadDashboard = () => {
	apiCallGet("channel", {}, true, globalToken).then((body) => {
		console.log("load dashboard", body);
		// Create a div for each text channel
		body.channels.forEach((channel) => {
			console.log("peepeepoo");
			// Creates channel div if it does not already exist
			if (!doesChannelDivExists(channel.id)) {
				addChannel(channel);
			}
			// Will remove private channels user is not apart of
			if (
				!channel.members.includes(currentUserId) &&
				channel.private === true
			) {
				removePrivateChannelDiv(channel);
			}
		});
	});
};

function addMessage(message, prepend = true) {
	console.log("hey");
	const messageElement = createMessageElement(message);
	const messageList = document.getElementById("message-list");
	const messageText = messageElement.querySelector("#message-text");
	console.log(3.1);
	// prepend if message is being sent, append if message is added to backend
	if (prepend) {
		messageList.prepend(messageElement);
	} else {
		messageList.appendChild(messageElement);
	}
	messageProfileEvent(messageElement);
	console.log(3.2);
	messageText.addEventListener("click", () => {
		selectedMessageId = message.id;

		resetEmojiNum();
		if (message.reacts.length > 0) {
			message.reacts.forEach((emoji) => incrementReaction(emoji.react));
		}

		if (message.sender !== currentUserId) {
			editButton.style.display = "none";
			deleteMessageButton.style.display = "none";
		} else {
			editButton.style.display = "block";
			deleteMessageButton.style.display = "block";
		}

		selectedMessageId = message.id;
		selectedMessageText = message.message;
		console.log(
			"selectedMessageId IS THIS",
			selectedMessageId,
			message,
			message.reacts
		);
		console.log(
			selectedMessageText,
			"emoji nums increment5.1",
			skullNum,
			heartNum,
			thumbsNum
		);
		selectedMessageEdited = message.edited;

		console.log(selectedMessageText);

		messageActionsModal.show();
	});
}

const resetEmojiNum = () => {
	skullNum = 0;
	heartNum = 0;
	thumbsNum = 0;
};

export function channelSelected(channelId) {
	if (channelId !== null) {
		apiCallChannel(channelId, globalToken)
			.then((channel) => {
				console.log("channelSelected body", channel);
				localStorage.setItem("channelId", channelId);
				selectedChannelId = channelId;

				document.getElementById("channel-header").style.display = "block";
				document.getElementById("channel-header").innerText = channel.name;

				for (const btn of document.querySelectorAll(".hide-btn")) {
					btn.style.display = "block";
				}
				console.log(1, "hehe");
				updateChannelDetails(channel);
				console.log(2, "updateChannelDetails lol");
				updateResponsiveScreen();
				console.log(3, "tree");

				clearMessages();
				console.log(4, "cleared4");
				loadMessages(selectedChannelId, 0);
				console.log(5, "loaded5");
				localStorage.setItem("leftChannelId", selectedChannelId);
			})
			.catch(() => {
				// modal popup for joining server if the user is not part of a public server

				document
					.getElementById("join-server-success")
					.addEventListener("click", () => {
						apiJoinServer(channelId, globalToken);
						selectedChannelId = channelId;
					});
				let leftChannelId = localStorage.getItem("leftChannelId");
				console.log(
					"joinServerModal",
					channelId,
					selectedChannelId,
					globalToken
				);
				// Show modal for joining server
				// if user is not apart of channel, show modal
				// if (localStorage.getItem('leftChannelId') !== selectedChannelId) {
				if (leftChannelId === "null" || leftChannelId === null) {
					console.log(selectedChannelId, "servermodal1");
					joinServerModal.hide();
					localStorage.setItem("leftChannelId", leftChannelId);
				} else {
					console.log(selectedChannelId, "sercermodal2");
					joinServerModal.show();
				}

				// }
			});
	}
}

document.getElementById("leave-button").addEventListener("click", () => {
	leftChannelId = selectedChannelId;
	// localStorage.setItem('leftChannelId', leftChannelId)

	const leavePromise = apiLeaveServer(selectedChannelId, globalToken);
	leavePromise.then(() => {
		localStorage.setItem("leftChannelId", null);
		console.log("LEAVEPROMISE");
	});
});

document.getElementById("save-changes-button").addEventListener("click", () => {
	const channelName = document.getElementById("channel-details-name").innerText;
	const channelDetails = document.getElementById(
		"channel-details-description"
	).innerText;
	// console.log(channelName, channel.id)
	apiSaveChanges(selectedChannelId, channelName, channelDetails, globalToken);

});

document.getElementById("create-channel").addEventListener("click", () => {
	createChannelModal.show();
});

document
	.getElementById("create-channel-button")
	.addEventListener("click", () => {
		const channelName = document.getElementById("channel-name").value;
		const channelDesc = document.getElementById("channel-description").value;
		let privacySetting = document.querySelector(
			'input[name="privacy"]:checked'
		).value;

		privacySetting = privacySetting === "public" ? false : true;
		const channelPromise = apiCreateChannel(
			channelName,
			privacySetting,
			channelDesc,
			globalToken
		);
		channelPromise.then(() => {
			loadDashboard();
		});
	});

// Allow user to join server modal

// Show channel details via modal

document.getElementById("channel-cog").addEventListener("click", () => {
	showChannelDetailsModal.show();
});

const showPage = (pageName) => {
	for (const page of document.querySelectorAll(".page-block")) {
		page.style.display = "none";
	}
	document.getElementById(`page-${pageName}`).style.display = "block";
	if (pageName === "dashboard") {
		loadDashboard();
	}
};

document.getElementById("register-submit").addEventListener("click", (e) => {
	const email = document.getElementById("register-email").value;
	const name = document.getElementById("register-name").value;
	const password = document.getElementById("register-password").value;
	const passwordConfirm = document.getElementById(
		"register-password-confirm"
	).value;
	if (password !== passwordConfirm) {
		showErrorPopup("Passwords need to match");
	} else {
		apiCallPost(
			"auth/register",
			{
				email: email,
				name: name,
				password: password,
			},
			globalToken
		)
			.then((body) => {
				const { token, userId } = body;
				currentUserId = userId;
				globalToken = token;
				localStorage.setItem("token", token);
				localStorage.setItem("userId", userId);
				showPage("dashboard");
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	}
});

document.getElementById("login-submit").addEventListener("click", (e) => {
	const email = document.getElementById("login-email").value;
	const password = document.getElementById("login-password").value;
	const loginPromise = apiLogin(email, password, globalToken);
	loginPromise
		.then((body) => {
			const { token, userId } = body;
			currentUserId = userId;
			globalToken = token;
			localStorage.setItem("token", token);
			localStorage.setItem("userId", userId);
			showPage("dashboard");
		})
		.catch((msg) => {
			showErrorPopup(msg + "\n" + "Cannot find your account");
		});
});

document.getElementById("logout").addEventListener("click", (e) => {
	apiCallPost("auth/logout", {}, true, globalToken)
		.then(() => {
			localStorage.removeItem("token");
			localStorage.removeItem("userId");
			localStorage.removeItem("channelId");
			showPage("register");
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});

for (const redirect of document.querySelectorAll(".redirect")) {
	const newPage = redirect.getAttribute("redirect");
	redirect.addEventListener("click", () => {
		showPage(newPage);
	});
}

const localStorageToken = localStorage.getItem("token");
if (localStorageToken !== null) {
	globalToken = localStorageToken;
	currentUserId = parseInt(localStorage.getItem("userId"), 10);
	selectedChannelId = localStorage.getItem("channelId");
	leftChannelId = localStorage.getItem("leftChannelId");
	if (selectedChannelId !== null) {
		// loadDashboard();
		channelSelected(selectedChannelId);
	}
	if (leftChannelId === null) {
		joinServerModal.hide();
	}
}

if (globalToken === null) {
	showPage("register");
} else {
	showPage("dashboard");
}

function hideErrorPopup() {
	const errorPopup = document.querySelector(".error-popup");
	errorPopup.style.display = "none";
}

// Add an event listener to the close button
const closeButton = document.querySelector(".close-button");
closeButton.addEventListener("click", hideErrorPopup);

// For mobile responsiveness, button shows list of channels
const switchChannelButton = document.getElementById("switch-channel-button");
switchChannelButton.addEventListener("click", () => {
	console.log("mobile responsive switch channel");
	const channelList = document.getElementById("clist");
	channelList.style.display = "block";
	mobile = true;
});

window.addEventListener("resize", updateResponsiveScreen);
