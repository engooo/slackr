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
let leftChannel = null;
let leftChannelId = null;
let profilePicture = null;
let mobile = false;
let viewingPin = false;
let pageIndex = 1;
let pinnedPageIndexStart = 1;
let pinnedPageIndex = 1;
let numMessages = 0;
let skullNum = 0;
let heartNum = 0;
let thumbsNum = 0;

/**
 * Loads messages given the channelId
 */
function loadMessages(channelId, index) {
	clearMessages();
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

			body.messages.forEach((message) => {
				addMessage(message);
			});
		})
		.catch((error) => {
			throw error;
		});
}

/**
 * Hide error popup
 */
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
	const channelList = document.getElementById("clist");
	channelList.style.display = "block";
	mobile = true;
});

window.addEventListener("resize", updateResponsiveScreen);

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
				document.getElementById("send-message").value = "";
				apiCallGet(
					`message/${selectedChannelId}?start=0`,
					{},
					true,
					globalToken
				)
					.then((body) => {
						// pageIndex++;

						const message = body.messages[0];
						addMessage(message, false);
					})
					.catch((error) => {
						console.log("failed to load msgs from send");
					});
			})
			.catch((error) => {
				console.log("sendMessageButton failed");
				throw error;
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
			messageToDelete.remove();
		})
		.catch(() => {
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

/**
 * Given the messages object, will return specific message property
 */
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
		if (emojiText.includes("💀")) {
			emojiText = "💀";
		} else if (emojiText.includes("❤️")) {
			emojiText = "❤️";
		} else if (emojiText.includes("👍")) {
			emojiText = "👍";
		}
		updateNumReactions(emojiText);
	});
});

function updateNumReactions(emojiText) {
	// find that messages reacts
	let thisPageIndex = (pageIndex - 1) * 25;
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

			// CHECK IF USER HAS REACTED
			let reacted = false;
			// No reactions from any users on message
			if (reactMessages.length === 0) {
				reactApi("react", emojiText);
				incrementReaction(emojiText);
			} else {
				// Check if user has reacted to this message
				resetEmojiNum();
				for (const reactElement of reactMessages) {
					// Iterate through reactions to check if user has reacted to msg
					let reactValue = reactElement.react;

					incrementReaction(reactElement.react);
					if (reactValue === emojiText && reactElement.user === currentUserId) {
						reacted = true;
					}
				}

				if (reacted === true) {
					reactApi("unreact", emojiText);

					decrementReaction(emojiText);
				} else {
					reactApi("react", emojiText);
					// Count number of reactions

					incrementReaction(emojiText);
				}
			}

			const messageToEdit = document.querySelector(
				`.message-element[data-message-id="${selectedMessageId}"]`
			);
			updateReactionUI(messageToEdit);
		})
		.catch(() => {
			console.log("updateNumreactions failed");
		});
}

function updateReactionUI(messageToEdit) {
	console.log(messageToEdit, "mesagetoedit");
	messageToEdit.querySelector("#text-skull").innerText =
		skullNum > 0 ? skullNum + "💀" : "💀";

	messageToEdit.querySelector("#text-heart").innerText =
		heartNum > 0 ? heartNum + "❤️" : "❤️";

	messageToEdit.querySelector("#text-thumbs-up").innerText =
		thumbsNum > 0 ? thumbsNum + "👍" : "👍";
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
	apiPinMsg("pin");
});

const unpinMessageButton = document.getElementById("unpin-button");
unpinMessageButton.addEventListener("click", () => {
	apiPinMsg("unpin");
});

const viewPinnedMessages = document.getElementById("view-pinned-messages");
viewPinnedMessages.addEventListener("click", () => {
	viewingPin = !viewingPin;
	pinnedPageIndexStart = 1;
	if (viewingPin) {
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

			const pinnedMessages = body.messages.filter((message) => message.pinned);
			pinnedMessages.forEach((message) => {
				addMessage(message);
			});
			if (numMessages === 0) {
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
		const userId = checkbox.parentElement.getAttribute("data-user-id");

		apiInviteUser(selectedChannelId, parseInt(userId, 10), globalToken);
	});
});
document.getElementById("invite-users-button").addEventListener("click", () => {
	clearInviteList();
	populateInviteList();

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
			createUserItems(filteredUsers);
		});
};
const createUserItems = (inviteList) => {
	// clearInviteList()

	const userItemTemplate = document.getElementById("user-item-template");
	const userItemList = document.querySelector(".user-list");

	inviteList.forEach((user) => {
		const userItem = userItemTemplate.cloneNode(true);

		userItem.removeAttribute("id");
		userItem.setAttribute("data-user-id", user.userId);

		userItem.querySelector(".user-checkbox").value = user.name;
		userItem.querySelector('label[for="user1"]').innerText = user.name;

		userItem.style.display = "block";
		userItemList.append(userItem);
	});
};
// TODO: make is user member of channel
const isUserMember = (userId) => {
	return apiCallChannel(selectedChannelId, globalToken).then((channel) => {
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
		document.getElementById("user-profile-name").innerText = userDetails.name;
		document.getElementById("user-profile-bio").innerText = userDetails.bio;
		document.getElementById("user-profile-email").innerText = userDetails.email;

		if (userDetails.image !== null) {
			document.getElementById("user-profile-photo").src = userDetails.image;
		} else {
			document.getElementById("user-profile-photo").src = "default.png";
		}

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
		fileToDataUrl(selectedFile).then((dataUrl) => {
			body.image = dataUrl;

			apiCallPut("user", body, true, globalToken);
		});
	}
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

	// Access and process message properties here
	const messageId = message.id;
	const messageText = message.message;
	let messageImage = message.image;
	const edited = message.edited;
	const reacts = message.reacts; // This is an array of reacts

	resetEmojiNum();
	if (reacts.length > 0) {
		for (const emoji of reacts) {
			incrementReaction(emoji.react);
		}

		updateReactionUI(element);
		resetEmojiNum();
	}

	if (
		messageImage === undefined ||
		messageImage === null ||
		messageImage === ""
	) {
		messageImage = "default.png";
	}

	element.querySelector("#message-text").innerText = messageText;
	if (edited) {
		element.querySelector("#message-time").innerText =
			"✎" + formatTimestamp(message.editedAt);
	} else {
		element.querySelector("#message-time").innerText = formatTimestamp(
			message.sentAt
		);
	}

	apiUserDetails(message.sender, globalToken)
		.then((userDetails) => {
			element.querySelector("#message-username").innerText = userDetails.name;
			if (userDetails.image === null) {
				element.querySelector("#message-profile-picture").src = "default.png";
			} else {
				element.querySelector("#message-profile-picture").src =
					userDetails.image;
			}
		})
		.catch(() => {
			console.log("apiUserDetails(userID) failed");
		});

	return element;
}
/**
 * Adds message element to UI
 */
function addMessage(message, prepend = true) {
	const messageElement = createMessageElement(message);
	const messageList = document.getElementById("message-list");
	const messageText = messageElement.querySelector("#message-text");

	// prepend if message is being sent, append if message is added to backend
	if (prepend) {
		messageList.prepend(messageElement);
	} else {
		messageList.appendChild(messageElement);
	}
	// Handles viewing profiles when username is clicked
	messageProfileEvent(messageElement);

	// Handles viewing message actions and viewing profiles
	messageText.addEventListener("click", () => {
		selectedMessageId = message.id;

		// Handle count of reactions of a message
		resetEmojiNum();
		if (message.reacts.length > 0) {
			message.reacts.forEach((emoji) => incrementReaction(emoji.react));
		}

		// Disables edit and delete button if message clicked is not from user
		if (message.sender !== currentUserId) {
			editButton.style.display = "none";
			deleteMessageButton.style.display = "none";
		} else {
			editButton.style.display = "block";
			deleteMessageButton.style.display = "block";
		}

		selectedMessageId = message.id;
		selectedMessageText = message.message;
		selectedMessageEdited = message.edited;
		messageActionsModal.show();
	});
}

/**
 * Reset reaction counts
 */
const resetEmojiNum = () => {
	skullNum = 0;
	heartNum = 0;
	thumbsNum = 0;
};

/**
 * Handles actions for when channel is clicked
 */
export function channelSelected(channelId) {
	if (channelId !== null) {
		apiCallChannel(channelId, globalToken)
			.then((channel) => {
				localStorage.setItem("channelId", channelId);
				selectedChannelId = channelId;

				// change heading to channel name
				document.getElementById("channel-header").style.display = "block";
				document.getElementById("channel-header").innerText = channel.name;

				// reveal action buttons
				for (const btn of document.querySelectorAll(".hide-btn")) {
					btn.style.display = "block";
				}

				updateChannelDetails(channel);
				// fixes screen responsiveness in mobile
				updateResponsiveScreen();

				clearMessages();
				loadMessages(selectedChannelId, 0);
				localStorage.setItem("leftChannelId", selectedChannelId);
			})
			.catch(() => {
				// User is not a member of the channel

				// Prompt for user to join channel
				joinServerModal.show();

				// Handles user joining the server
				document
					.getElementById("join-server-success")
					.addEventListener("click", () => {
						apiJoinServer(channelId, globalToken);
						selectedChannelId = channelId;
					});

				// Handles refresh when leaving server
				let leftChannelId = localStorage.getItem("leftChannelId");
				if (leftChannelId === "null" || leftChannelId === null) {
					joinServerModal.hide();
					localStorage.setItem("leftChannelId", leftChannelId);
				}
			});
	}
}

// Handles when user leaves channel
document.getElementById("leave-button").addEventListener("click", () => {
	leftChannelId = selectedChannelId;
	const leavePromise = apiLeaveServer(selectedChannelId, globalToken);
	leavePromise.then(() => {
		localStorage.setItem("leftChannelId", null);
	});
});

// Updates channel description details
document.getElementById("save-changes-button").addEventListener("click", () => {
	const channelName = document.getElementById("channel-details-name").innerText;
	const channelDetails = document.getElementById(
		"channel-details-description"
	).innerText;
	apiSaveChanges(selectedChannelId, channelName, channelDetails, globalToken);
});

// Shows modal to create a channel
document.getElementById("create-channel").addEventListener("click", () => {
	createChannelModal.show();
});

// Handles the creation of a channel
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

// Display channel details
document.getElementById("channel-cog").addEventListener("click", () => {
	showChannelDetailsModal.show();
});

/**
 * Display certain pages given pagename
 */
const showPage = (pageName) => {
	for (const page of document.querySelectorAll(".page-block")) {
		page.style.display = "none";
	}
	document.getElementById(`page-${pageName}`).style.display = "block";
	if (pageName === "dashboard") {
		loadDashboard();
	}
};

// Handles registeration of user
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

// Handles login of user
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

// Handles logout of user
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

// Redirects user to certain page
for (const redirect of document.querySelectorAll(".redirect")) {
	const newPage = redirect.getAttribute("redirect");
	redirect.addEventListener("click", () => {
		showPage(newPage);
	});
}

/**
 * Loads Dashboard after login
 */
const loadDashboard = () => {
	apiCallGet("channel", {}, true, globalToken).then((body) => {
		// Create a div for each text channel
		body.channels.forEach((channel) => {
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

// Handling of tokens
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
