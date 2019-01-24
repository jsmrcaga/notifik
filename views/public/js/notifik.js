let { location: { protocol, host, pathname } } = window;

fetch(`${protocol}//${host}/api/config`).then(res => res.json()).then(config => {
	const webPushNotifications = new WebPushNotifications(config, (subscription) => {
		return fetch(`${protocol}//${host}/api/subscribe`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': config.api_key
			},
			body: JSON.stringify({
				subscription,
				id: document.querySelector('#mail').value
			})
		}).then(res => res.json()).then(res => {
			if(!res.success) {
				throw new Error(`[App Server] ${res.message}`);
			}
		});
	});

	// You can set your options here, or even set your own
	// register-subscription-to-server function as f(subs)
	document.querySelector('button').addEventListener('click', () => {
		webPushNotifications.start().then(() => {
			alert('Subscribed!');
			window.close();

		}).catch(e => {
			console.error(e);
			let text = document.createTextNode(e.message);
			document.body.appendChild(text);
			alert('An error occurred! Check below!');
		});
	});
});
