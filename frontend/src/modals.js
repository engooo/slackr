export const editMessageModal = new bootstrap.Modal(
	document.getElementById('edit-modal')
)

export const messageActionsModal = new bootstrap.Modal(
	document.getElementById('message-actions-modal')
)
export const createChannelModal = new bootstrap.Modal(
	document.getElementById('create-channel-modal')
)
export const joinServerModal = new bootstrap.Modal(
	document.getElementById('join-server-modal')
)
export const showChannelDetailsModal = new bootstrap.Modal(
    document.getElementById('channel-details-modal')
)

document.getElementById('create-channel').addEventListener('click', () => {
	createChannelModal.show();
})