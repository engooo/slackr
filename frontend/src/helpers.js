/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
	const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
	const valid = validFileTypes.find(type => type === file.type);
	// Bad data, let's walk away.
	if (!valid) {
			throw Error('provided file is not a png, jpg or jpeg image.');
	}
	
	const reader = new FileReader();
	const dataUrlPromise = new Promise((resolve,reject) => {
			reader.onerror = reject;
			reader.onload = () => resolve(reader.result);
	});
	reader.readAsDataURL(file);
	return dataUrlPromise;
}

// Given an iso String, function will format to 'Day Month Year at HH:MM'
export const formatTimestamp = (isoString) => {
    const date = new Date(isoString);

    // Format the date as "Month Day, Year" (e.g., "October 23, 2023")
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);

    // Format the time as "HH:MM AM/PM" (e.g., "04:37 AM")
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

    return `${formattedDate} at ${formattedTime}`;
}

/* Fixes display of side bar during transitions */
export const updateResponsiveScreen = () => {
	let viewportWidth = window.innerWidth;
	const channelList = document.getElementById('clist');
	if (viewportWidth < 768) {
		channelList.style.display = "none"
	} else {
		channelList.style.display = "block"
	}
}

export const clearMessages = () => {
	const messages = document.querySelectorAll('.message-element:not(#message-template)');
	console.log('clearMessages' ,messages)
	messages.forEach(msg => {
		msg.remove();
	})
}

export const showErrorPopup = (message) => {
	const errorPopup = document.querySelector(".error-popup");
	const errorMessage = document.querySelector(".error-message");
	errorMessage.textContent = message;
	errorPopup.style.display = "block";
}




// function addChannel(channel) {
// 	const textChannelElement = createTextChannelElement(channel)
// 	document.getElementById('text-channels').appendChild(textChannelElement);

// 	textChannelElement.addEventListener('click', () => {
// 		// success: load channel in main screen
// 		// error: prompt users to join channel
// 		channelSelected(channel.id)

// 	}) 
// 	console.log('added chan', channel)
// }

// function createTextChannelElement(channel) {
// 	const element = document.getElementById("text-channel-template").cloneNode(true);
// 	element.removeAttribute('id');
	
// 	if (channel.private) { 
// 		element.innerText = '🔒 ' + channel.name;
// 	} else {
// 		element.innerText = '#️⃣ ' + channel.name;
// 	}
// 	element.setAttribute('data-channel-id', channel.id)
// 	return element;
// }



// function doesChannelDivExists(channelId) {
// 	// checks custom attribute 'data-channel-id'
//     const existingDiv = document.querySelector(`.text-channel[data-channel-id="${channelId}"]`);
// 	console.log(existingDiv)
//     return existingDiv !== null;
// }


// function removePrivateChannelDiv(channel) {
	
// 	// channel is private and user is not apart of the private channel		
// 	let privateChannelDiv = document.querySelector(`.text-channel[data-channel-id="${channel.id}"]`);
// 	console.log('removing priv chan', privateChannelDiv)
// 	privateChannelDiv.remove();

// }


// // Function to update channel details
// function updateChannelDetails(body) {
//     let privacySetting;
//     let description;
//     if (body.private) {
//         privacySetting = 'private';
//     } else {
//         privacySetting = 'public';
//     }

//     if (body.description === "") {
//         description = "This channel has no description";
//     } else {
//         description = body.description;
//     }

//     // Updating channel details
//     document.getElementById('channel-details-name').innerText = body.name;
//     document.getElementById('channel-details-description').innerText = description;
//     document.getElementById('channel-details-privacy').innerText = privacySetting;
//     document.getElementById('channel-details-creation').innerText = formatTimestamp(body.createdAt);
// }