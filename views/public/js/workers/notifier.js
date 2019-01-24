self.addEventListener('push', function(event){
	if(!event.data){
		console.log('[Notifik][Worker] No data in event');
		return;
	}

	let { title, ...data } = event.data.json();
	console.info('[Notifik][Worker] Push event with data', data);

	if(data.update) {
		let update = self.registration.update();
		return event.waitUntil(update);
	}

	let notif = self.registration.showNotification(title, data);

	event.waitUntil(notif);
});

self.addEventListener('notificationclick', function(event){
	// do something
	console.log('NOTIFICATION CLICKED', event, event.action);
});
