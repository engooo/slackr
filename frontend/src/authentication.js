import {apiCallPost} from './apiCalls'
import {showPage} from './main.js'

document.getElementById('register-submit').addEventListener('click', (e) => {
	const email = document.getElementById('register-email').value;
	const name = document.getElementById('register-name').value;
	const password = document.getElementById('register-password').value;
	const passwordConfirm = document.getElementById('register-password-confirm').value;
	if (password !== passwordConfirm) {
		showErrorPopup('Passwords need to match')
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
	localStorage.setItem('password', password);
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
		localStorage.removeItem('password');
		showPage('register');
	})
	.catch((msg) => {
		showErrorPopup(msg)
	});
});