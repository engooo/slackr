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