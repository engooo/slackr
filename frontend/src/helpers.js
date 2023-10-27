
// Given an iso String, function will format to 'Day Month Year at HH:MM'
export function formatTimestamp(isoString) {
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
export function updateResponsiveScreen() {
	let viewportWidth = window.innerWidth;
	const channelList = document.getElementById('clist');
	if (viewportWidth < 768) {
		channelList.style.display = "none"
	} else {
		channelList.style.display = "block"
	}
}

export function clearMessages() {
	const messages = document.querySelectorAll('.message-element:not(#message-template)');
	console.log('clearMessages' ,messages)
	messages.forEach(msg => {
		msg.remove();
	})
}