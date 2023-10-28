import {clearMessages, showErrorPopup} from './helpers.js'

// ***** MY FUNCTIONS ******

// POST request function
export const apiCallPost = (path, body, authed = false, globalToken) => {
    return new Promise((resolve, reject) => {
      fetch(`http://localhost:5005/${path}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-type': 'application/json',
          'Authorization': authed ? `Bearer ${globalToken}` : undefined
        }
      })
      .then((response) => {
        if (!response.ok) {
          // Check if the response status is not in the 200 range (e.g., 400, 500, etc.)
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((body) => {
        console.log(body);
        if (body.error) {
          reject('Error!');
        } else {
          resolve(body);
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        reject(error);
      });
    });
  };


// GET request function
export const apiCallGet = (path, body, authed=false, globalToken) => {
	return new Promise((resolve, reject) => {
		fetch(`http://localhost:5005/${path}`, {
			method: 'GET',
			headers: {
				'Content-type': 'application/json',
				'Authorization': authed ? `Bearer ${globalToken}` : undefined
			}
		})
		.then((response) => response.json())
		.then((body) => {
			console.log(body);
			if (body.error) {
				reject('Error!');
			} else {
				resolve(body);
			}
		});
	});
}

// POST request function
export const apiCallPut = (path, body, authed = true, globalToken) => {
  return new Promise((resolve, reject) => {
    fetch(`http://localhost:5005/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-type': 'application/json',
        'Authorization': authed ? `Bearer ${globalToken}` : undefined
      }
    })
    .then((response) => {
      if (!response.ok) {
        // Check if the response status is not in the 200 range (e.g., 400, 500, etc.)
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((body) => {
      console.log(body);
      if (body.error) {
        reject('Error!');
      } else {
        resolve(body);
      }
    })
    .catch((error) => {
      console.error('Fetch error:', error);
      reject(error);
    });
  });
};

// DELETE request function
export const apiCallDelete = (path, body, authed=false, globalToken) => {
	return new Promise((resolve, reject) => {
		fetch(`http://localhost:5005/${path}`, {
			method: 'DELETE',
			headers: {
				'Content-type': 'application/json',
				'Authorization': authed ? `Bearer ${globalToken}` : undefined
			}
		})
		.then((response) => response.json())
		.then((body) => {
			console.log(body);
			if (body.error) {
				reject('Error!');
			} else {
				resolve(body);
			}
		});
	});
}

// Returns details about a channel
export const apiCallChannel = (channelId, globalToken) => {
	return apiCallGet(`channel/${channelId}`, {}, true, globalToken)
        .then(body => {
            return body; // or return specific properties you need
        })
        .catch(error => {
            console.error('Error fetching channel details', error);
            throw error;
        });
}

// Allows user to join server
export const apiJoinServer = (channelId, globalToken) => {
  return apiCallPost(`channel/${channelId}/join`, {}, true, globalToken)
		.then((body) => {
					// localStorage.setItem('channelId', channelId)
          console.log(body)
					console.log('successfulyl joined the channel');
        })
        .catch(error => {
          console.log('apiJoin server failed', error);
          throw error
        })
}

// Allows user to leave server
export const apiLeaveServer = (selectedChannelId, globalToken) => {
  return apiCallPost(`channel/${selectedChannelId}/leave`, {}, true, globalToken)
      .then(() => {
          console.log('left successfuly')
          /* Stores channel last left in case of a refresh after leaving*/
          document.getElementById('channel-header').innerText = 'Welcome! Select a channel!'
          for (const btn of document.querySelectorAll('.hide-btn')) {
            btn.style.display = 'none'
          }
          clearMessages()
        })
        .catch((error) => {
          throw error
        })
}

// Allows user to save changes to channel
export const apiSaveChanges = (selectedChannelId, channelName, channelDetails, globalToken) => {
    return apiCallPut(`channel/${selectedChannelId}`, {
      name: channelName,
      description: channelDetails
    }, true, globalToken)
    .then(() => {
      
      // Change side bar div name & channel details button
      let channelDivChanged = document.querySelector(`.text-channel[data-channel-id="${selectedChannelId}"]`);
      channelDivChanged.innerText = channelName;
      apiCallChannel(selectedChannelId, globalToken).then(channel => {
        // console.log(channel.private)
        if (channel.private) {
          channelDivChanged.innerText = '🔒 ' + channelName;
        } else {
          channelDivChanged.innerText = '#️⃣ ' + channelName;
        }
      })
      document.getElementById('channel-header').innerText = channelName;
      console.log('changedchannel details', changedChannel)
      // loadDashboard();
    })
    .catch((error) => {
      throw error
    })
}

// Creates a channel
export const apiCreateChannel = (channelName, privacySetting, channelDesc, globalToken) => {
	return apiCallPost('channel', {
		name: channelName,
		private: privacySetting,
		description: channelDesc
	}, true, globalToken)
	
}

// Logs user in
export const apiLogin = (email, password, globalToken) => {
	return apiCallPost('auth/login', {
		email: email,
		password: password,
	}, globalToken)
}

// Contains user details
export const apiUserDetails = (userId, globalToken) => {
	return apiCallGet(`user/${userId}`, {}, true, globalToken)
	.then(userDetails => {
		console.log(userDetails)
		return userDetails;
		
	})
	.catch(() => {
		console.log('getUserDetails failed');

	})
}

// Invite user to channel
export const apiInviteUser = (channelId, userId, globalToken) => {
	return apiCallPost(`channel/${channelId}/invite`, {
		userId: userId
	}, true, globalToken)
	.then(body => {
		console.log('apiIncviteUser inviteduser to server', body)
	})
	.catch(error => {
		console.log('apiInviteUser failed')
		throw error
	})
}

// List total users registered
export const apiListUsers = (globalToken) => {
	return apiCallGet('user', {}, true, globalToken)
			.then((listUsers) => {
				return listUsers
				
			})
			.catch(error => {
				console.log('apiListUsers failed')
				throw error
			})
}

// Updates user profile
export const apiUpdateProfile = (email, password, name, bio, image, globalToken) => {
	return apiCallPut('user', {
		email: email,
		password: password,
		name: name,
		bio: bio,
		image: image,
	}, true, globalToken)
	.then(body => {
		console.log('yippeee profile updated', body)
	})
	.catch((error) => {
		console.log('apiUpdateProfile failed', error)
		throw error
	})

}
