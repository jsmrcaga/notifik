const ACTIVATED = 'activated';
const DENIED = 'denied;'

/**
 * Throw deny error
 */
const deny = () => {
	return new Error('[Notifications] Notifications permission denied');
};

/**
 * Mythic function to transform a base64 string to a Uint8Array
 */
const urlBase64ToUint8Array = (base64String) => {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	return Uint8Array.from(rawData.split('').map(function(char){return char.charCodeAt(0)}));
};

/**
 * Class to handle web push notifications flow
 * In browser
 */
class WebPushNotifications {
	constructor(config, registerToServer = null) {
		this.serviceWorker = config.service_worker || '/js/workers/notifier.js';
		this.permission = null;
		this.subscription = null;
		this.registerToServer = registerToServer;
	}

	/**
	 * Check if notifications are supported
	 */
	verify() {
		if(!('serviceWorker' in navigator) || (!('PushManager' in window)) || (!('Notification' in window))){
			return false;
		}

		return true;
	}

	/**
	 * Request user permission to send notifications
	 */
	requestPermission() {
		console.log('Requesting permission...');
		return new Promise((resolve, reject) => {
			if(Notification.permission === DENIED) {
				console.error('Permission denied beforehand!');
				return reject(deny());
			}

			const result = Notification.requestPermission(res => {
				if(res === DENIED) {
					console.log('Permission denied.');
					return reject(deny());
				}

				resolve();
			});

			if(result && result instanceof Promise) {
				result.then(resolve, reject);
			}
		});
	}

	/**
	 * Register web worker in users browser
	 * to allow it to receive notifications
	 */
	registerWebWorker() {
		console.log('Registering web worker...');
		return navigator.serviceWorker.register(this.serviceWorker).then(registration => {
			if(registration instanceof Error) {
				console.error('Could not register web worker', registration);
				throw registration;
			}

			console.log('Registered web worker successfully');
			return registration;
		});
	}

	/**
	 * Verify if service worker has been installed
	 */
	__verifyServiceWorkerState(sw_registration) {
		console.log('Verifying Service worker registration...');

		let worker = null;
		// order is important
		let states = ['installing', 'waiting', 'active'];
		for(let state of states) {
			if(sw_registration[state]) {
				worker = sw_registration[state];
			}
		}

		if(!worker) {
			return Promise.reject(new Error('[Notifications] ServiceWorker not installed'));
		}

		// if worker was already installed no need to wait
		if(worker.state === ACTIVATED) {
			return Promise.resolve();
		}

		// wait for worker to install
		return new Promise((resolve, reject) => {
			let timeout = setTimeout(() => {
				reject(new Error('[Notifications] Service worker could not be installed'));
			}, 10 * 1000); // 10 seconds
			
			console.log('Waiting for service worker to be ready...');
			worker.addEventListener('statechange', event => {
				console.log('SW STATE', event.target.state);
				if(event.target.state === ACTIVATED) {
					clearTimeout(timeout);
					return resolve();
				}
			});
		});
	}

	/**
	 * Subscribe to push manager once ServiceWorker has been registered
	 */
	subscribeToPushManager(sw_registration) {
		return this.__verifyServiceWorkerState(sw_registration).then(() => {
			let options = {
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array('BA5uewSkjRDnh_oJ31_VlTgtMeIp7TDFLUFsotxh2B1j5-iNJ4gFl5aF7_4_XQ6o4cN2ZxlUpUufzYCh2rXmIFU')
			};

			if(!sw_registration.pushManager) {
				throw new Error('[Notifications] Push manager not supported');
			}

			console.log('Subscribing to push manager...')
			return sw_registration.pushManager.subscribe(options);

		}).then(subscription => {
			if(subscription instanceof Error) {
				console.error('Could not subscribe to pushManager', subscription);
				throw subscription;
			}

			console.log('Subscribed to push manager successfully!', subscription);
			return subscription;
		});
	}

	/**
	 * Register subscription to application server
	 * to be able to send notifications via push service
	 */
	registerToApplicationServer(subscription) {
		console.log('Registering to server...', subscription);
		if(this.registerToServer && this.registerToServer instanceof Function) {
			console.log('\twith custom function');
			return this.registerToServer(subscription);
		}

		if(this.registerToServer && this.registerToServer instanceof Object) {
			let { url, ...options } = this.registerToServer;

			options.body = JSON.stringify({
				subscription,
			});
			console.log('\twith options', url, options);
			return fetch(url, options);
		}

		return Promise.reject(new Error('[Notifications] Could not register subscription to application server'));
	}

	/**
	 * Set a localStorage tag indicating user subscribed successfully
	 */
	tag() {
		localStorage.setItem('notifications', true);
		return Promise.resolve();
	}

	/**
	 * Check if user has already subscribed
	 */
	subscribed() {
		return localStorage.getItem('notifications') || (PushManager.getSubscription ? PushManager.getSubscription() : false);
	}

	/**
	 * Automatically follow registration flow
	 */
	start() {
		if(!this.verify()) {
			return Promise.reject(new Error('[Notifications] Notifications are not supported by this browser, sorry'));
		}

		if(this.subscribed()) {
			return Promise.reject(new Error('[Notifications] User already subscribed'));
		}

		// Begin flow by requesting user permission
		return this.requestPermission().then(() => {
			// Register web worker to browser
			return this.registerWebWorker();

		}).then(sw_registration => {
			// Subscribe to Push Manager
			return this.subscribeToPushManager(sw_registration);

		}).then(subscription => {
			// Register subscription to app server
			return this.registerToApplicationServer(subscription);
		}).then(() => {
			return this.tag();
		});
	}

	/**
	 * @alias to start
	 */
	flow() {
		return this.start();
	}
}
