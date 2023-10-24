import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, apiCallPost, apiCallGet, apiCallPut, formatTimestamp } from './helpers.js';

let globalToken = null;
let currentUserId = null;
let selectedChannelId = null;

function createMessageElement(channel) {
	const element = document.getElementById("message-template").cloneNode(true)
}
function createTextChannelElement(channel) {
	const element = document.getElementById("text-channel-template").cloneNode(true);
	element.removeAttribute('id');
	if (channel.private) { 
		element.innerText = '🔒 ' + channel.name;
	} else {
		element.innerText = '# ' + channel.name;
	}
	element.setAttribute('data-channel-id', channel.id)
	return element;
}

function doesChannelDivExists(channelId) {
	// checks custom attribute 'data-channel-id'
    const existingDiv = document.querySelector(`.text-channel[data-channel-id="${channelId}"]`);
	console.log(existingDiv)
    return existingDiv !== null;
}

const loadDashboard = () => {
	apiCallGet('channel', {}, true, globalToken)
	.then(body => {
		
		// document.getElementById('channel-header').style.display = 'none'
		// Create a div for each text channel
		body.channels.forEach(channel => {
			console.log('peepeepoo')
			// Creates channel div if it does not already exist
			if (!doesChannelDivExists(channel.id)) {
				addChannel(channel)
			}

			// Will remove private channels user is not apart of 
			if(!channel.members.includes(currentUserId) &&
			channel.private === true) {
				removePrivateChannelDiv(channel);
			}
			
		})
	});
};
function addChannel(channel) {
	const textChannelElement = createTextChannelElement(channel)
	document.getElementById('channels').appendChild(textChannelElement);

	textChannelElement.addEventListener('click', () => {
		// success: load channel in main screen
		// error: prompt users to join channel
		channelSelected(channel.id)

	}) 
	console.log(channel)
}
function removePrivateChannelDiv(channel) {
	
	// channel is private and user is not apart of the private channel		
	let privateChannelDiv = document.querySelector(`.text-channel[data-channel-id="${channel.id}"]`);
	console.log(privateChannelDiv)
	privateChannelDiv.remove();

}

function channelSelected(channelId) {
    apiCallGet(`channel/${channelId}`, {}, true, globalToken)
        .then(body => {
			// console.log(body.id)
			localStorage.setItem('channelId', channelId);
            selectedChannelId = channelId;
            document.getElementById('channel-header').style.display = 'block';
            document.getElementById('channel-header').innerText = body.name;

            
            updateChannelDetails(body);

        })
        .catch(() => {
            // modal popup for joining server if the user is not part of a public server
            document.getElementById('join-server-success').addEventListener('click', () => {
                apiCallPost(`channel/${channel.id}/join`, {}, true, globalToken)
                    .then(() => {
                        console.log('yippee');
                    });
            });
            joinServerModal.show();
        });
}

// Function to update channel details
function updateChannelDetails(body) {
    let privacySetting;
    let description;
    if (body.private) {
        privacySetting = 'private';
    } else {
        privacySetting = 'public';
    }

    if (body.description === "") {
        description = "This channel has no description";
    } else {
        description = body.description;
    }

    // Updating channel details
    document.getElementById('channel-details-name').innerText = body.name;
    document.getElementById('channel-details-description').innerText = description;
    document.getElementById('channel-details-privacy').innerText = privacySetting;
    document.getElementById('channel-details-creation').innerText = formatTimestamp(body.createdAt);
}


document.getElementById('leave-button').addEventListener('click', () => {
	apiCallPost(`channel/${selectedChannelId}/leave`, {}, true, globalToken)
	.then(() => {
		console.log('left successfuly')
		//TODO: MAKE HOME PAGE OR DEAL WITH UPDATING CHANNEL NAME
		// document.getElementById('channel-header').style.display = 'none'
	})
		
})
document.getElementById('save-changes-button').addEventListener('click', () => {
	const channelName = document.getElementById('channel-details-name').innerText;
	const channelDetails = document.getElementById('channel-details-description').innerText;
	// console.log(channelName, channel.id)
	
	apiCallPut(`channel/${selectedChannelId}`, {
		name: channelName,
		description: channelDetails
	}, true, globalToken)
	.then(() => {
		
		// Change side bar div name & channel details button
		let channelDivChanged = document.querySelector(`.text-channel[data-channel-id="${selectedChannelId}"]`);
		channelDivChanged.innerText = channelName;
		getChannel(selectedChannelId).then(channel => {
			// console.log(channel.private)
			if (channel.private) {
				channelDivChanged.innerText = '🔒 ' + channelName;
			} else {
				channelDivChanged.innerText = '# ' + channelName;
			}
		})
		document.getElementById('channel-header').innerText = channelName;
		console.log('changedchannel', changedChannel)
		// loadDashboard();
	})
	// document.getElementById('channel-header').innerText = channelName;
	
	
	// document.getElementById('channel-header').style.display = 'block'
})
// function saveChanges() {
	

// }
function getChannel(channelId) {
	return apiCallGet(`channel/${channelId}`, {}, true, globalToken)
        .then(body => {
            return body; // or return specific properties you need
        })
        .catch(error => {
            console.error('Error fetching channel details', error);
            throw error;
        });
}
// CREATING NEW CHANNELS
const createChannelModal = new bootstrap.Modal(
	document.getElementById('create-channel-modal')
)

document.getElementById('create-channel').addEventListener('click', () => {
	createChannelModal.show();
})

document.getElementById('create-channel-button').addEventListener('click', () => {
	const channelName = document.getElementById('channel-name').value;
	const channelDesc = document.getElementById('channel-description').value;
	let privacySetting = document.querySelector('input[name="privacy"]:checked').value;
	if (privacySetting === 'public') {
		privacySetting = false
	} else {
		privacySetting = true
	}
	console.log(channelName, channelDesc, privacySetting)
	apiCallPost('channel', {
		name: channelName,
		private: privacySetting,
		description: channelDesc
	}, true, globalToken)
	.then((body) => {
		
		// addChannel(body)
		loadDashboard();
		// addChannel(body)
		console.log(body.name, "channel success created", body)
	})
})

// Allow user to join server modal
const joinServerModal = new bootstrap.Modal(
	document.getElementById('join-server-modal')
)

// Show channel details via modal
const showChannelDetailsModal = new bootstrap.Modal(
    document.getElementById('channel-details-modal')
)

document.getElementById('channel-header').addEventListener('click', () => {
    showChannelDetailsModal.show();
})

const showPage = (pageName) => {
	for (const page of document.querySelectorAll('.page-block')) {
		page.style.display = 'none';
	}
	document.getElementById(`page-${pageName}`).style.display = 'block';
	if (pageName === 'dashboard') {
		loadDashboard();
	}
} 

document.getElementById('register-submit').addEventListener('click', (e) => {
	const email = document.getElementById('register-email').value;
	const name = document.getElementById('register-name').value;
	const password = document.getElementById('register-password').value;
	const passwordConfirm = document.getElementById('register-password-confirm').value;
	if (password !== passwordConfirm) {
		alert('Passwords need to match');
	} else {
		console.log(email, name, password, passwordConfirm);

		apiCallPost('auth/register', {
			email: email,
			name: name,
			password: password,
		}, globalToken)
		.then((body) => {
			const { token, userId } = body;
			currentUserId = userId;
			globalToken = token;
			localStorage.setItem('token', token);
			localStorage.setItem('userId', userId);
			showPage('dashboard');
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
	}
});

document.getElementById('login-submit').addEventListener('click', (e) => {
	const email = document.getElementById('login-email').value;
	const password = document.getElementById('login-password').value;

	apiCallPost('auth/login', {
		email: email,
		password: password,
	}, globalToken)
	.then((body) => {
		const { token, userId } = body;
		currentUserId = userId;
		globalToken = token;
		localStorage.setItem('token', token);
		localStorage.setItem('userId', userId);
		showPage('dashboard');
	})
	.catch((msg) => {
		showErrorPopup(msg + '\n' + 'Cannot find your account')
	});
});

document.getElementById('logout').addEventListener('click', (e) => {
	apiCallPost('auth/logout', {}, true, globalToken)
	.then(() => {
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		localStorage.removeItem('channelId');
		showPage('register');
	})
	.catch((msg) => {
		showErrorPopup(msg)
	});
});

for (const redirect of document.querySelectorAll('.redirect')) {
	const newPage = redirect.getAttribute('redirect');
	redirect.addEventListener('click', () => {
		showPage(newPage);
	});
}

const localStorageToken = localStorage.getItem('token');
if (localStorageToken !== null) {
	globalToken = localStorageToken;
	currentUserId = parseInt(localStorage.getItem('userId'), 10);
	selectedChannelId = localStorage.getItem('channelId');
	if (selectedChannelId !== null) {
		// loadDashboard();
		channelSelected(selectedChannelId);
	};
}

if (globalToken === null) {
	console.log('he')
	showPage('register');
} else {
	showPage('dashboard');
}

// HANDLE POP UP ERRORS
function showErrorPopup(message) {
	const errorPopup = document.querySelector(".error-popup");
    const errorMessage = document.querySelector(".error-message");
    errorMessage.textContent = message;
    errorPopup.style.display = "block";
}

function hideErrorPopup() {
    const errorPopup = document.querySelector(".error-popup");
    errorPopup.style.display = "none";
}

// Add an event listener to the close button
const closeButton = document.querySelector(".close-button");
closeButton.addEventListener("click", hideErrorPopup);
