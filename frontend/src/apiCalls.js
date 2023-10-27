import {clearMessages} from './helpers.js'
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

// GET request function
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
export function apiCallChannel(channelId, globalToken) {
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
export function apiJoinServer(channelId, globalToken) {
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
export function apiLeaveServer(selectedChannelId, globalToken) {
  return apiCallPost(`channel/${selectedChannelId}/leave`, {}, true, globalToken)
      .then(() => {
          console.log('left successfuly')
          /* Stores channel last left in case of a refresh after leaving*/
          
          
          document.getElementById('channel-header').innerText = 'Welcome! Select a channel!'
          for (const btn of document.querySelectorAll('.hide-btn')) {
            btn.style.display = 'none'
          }
          clearMessages()
          localStorage.setItem('channelId', null)

        })
        .catch((error) => {
          throw error
        })
}

// Allows user to save changes to channel
export function apiSaveChanges(selectedChannelId, channelName, channelDetails, globalToken) {
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