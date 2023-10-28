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


/**
 * Given an iso String, function will format to 'Day Month Year at HH:MM'
 */
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

/**
 * Fixes display of side bar during transitions
 */
export const updateResponsiveScreen = () => {
	let viewportWidth = window.innerWidth;
	const channelList = document.getElementById('clist');
	if (viewportWidth < 768) {
		channelList.style.display = "none"
	} else {
		channelList.style.display = "block"
	}
}

/**
 * Clears message from chat log
 */
export const clearMessages = () => {
	const messages = document.querySelectorAll('.message-element:not(#message-template)');
	messages.forEach(msg => {
		msg.remove();
	})
}

/**
 * Shows an error popup displaying a message
 */
export const showErrorPopup = (message) => {
	const errorPopup = document.querySelector(".error-popup");
	const errorMessage = document.querySelector(".error-message");
	errorMessage.textContent = message;
	errorPopup.style.display = "block";
}
