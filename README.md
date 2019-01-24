# Notifik
> Browser notifications service made simple.

Notifik is a simple web server that can run on any system running Node.js.
It exposes a **very** simple subscribe page and an API to send push notifications.

The inner workings are quite simple as well, it uses the web push protocol to communicate with the web push service provider (usually FCM (ex-GCM) or Mozilla) and send push notifications to users via Web Service Workers.

It works out of the box but provides some simple configuration options.

Note: This package can handle multiple users

## Installation & Usage

### Install
`npm install -g notifik`

### Launch
`$ notifik`

### Usage (commands)

#### `notifik version` (or `-v`)
Prints the current version

#### 'notifik path'
Prints the path where you can modify the front-end JS

#### 'notifik keys'
Generate needed keypair

### Options

#### `-c ./myconfig.json`

Lauches the server using configuration on the provided path. Path must be relative to where the command is launched from.

## Subscriptions
Once launched go to `/subscribe` on any recent browser to subscribe. You should get a confirmation alert. In any case, helpful logs are displayed on the console.

## Config
Example configuration file:
```
{
	"port": 6789,
	"api_key": "this_is_my_super_secure_ley",
	"keys": {
		"public": "public key",
		"private": "private key",
		"gcm": "gcm/fcm key"
	},
	"defaults": {
		"icon": "http://icons.iconarchive.com/icons/papirus-team/papirus-apps/512/preferences-system-notifications-icon.png",
		"badge": "http://icons-for-free.com/free-icons/png/512/2246841.png"
	},
	"service_worker": "/js/workers/notifier.js"
}

```

> Note: `api_key` can be set to `null` if you don't want to use one. (WHY?)

In order to generate a key pair you can use `notifik keys`.
To get a gcm key please go to [Firebase](https://firebase.com), and create a new project. Once in your project go to the "Project Settings" (upper left, gear icon) and click on the `Cloud Messaging` tab, you can find your `Server Key` which is your gcm key.

## API

The API can be protected by an `api_key` (set in the config file, see Config) and, if set, MUST be included in all (except two) request to `/api` whether as a query param (`/api/notify?api_key=<your key>`) or a header (`X-Api-Key: <your key>`).

### GET `/config`
Is not protected by API key.

Returns simple config info for the front end:

```
{
	service_worker: 'path/to/sw.js'
}

```

### POST `/subscribe`
Is not protected by API key.

Subscribes a user to the notifications system

##### Params
```
{
	id: 'some unique id',
	subscription: {
		// subscription info from push manager
	}
}
```

### GET `/subscriptions`
Returns all active subscription ids.

```
['id1', 'id2', 'id3']
```

### POST `/notify`
Send a push notification to a subscriber

#### Params
```
{
	id: 'some_unique_id',
	...params 
}
```

Notification parameters can be [found here](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification#Parameters)

### POST `/notify/bulk`
Send a push notification to a subscriber

#### Params (same notification for everyone)
```
{
	users: ['id1', 'id2'],
	notification: {
		...params
	}
}
```


#### Params (different notifications)
```
{
	users: [{
		id: 'unique_id',
		...params
	}, {
		id: 'unique_id2',
		...params
	}]
}
```

### POST `/update`

Send an `update` notification to all subscribers to update service worker. This is useful when you add actions or modify the behaviour of your web worker.

Please note that once your web worker is installed, changing the path will not trigger an update, the browser remembers the same path: **never change your web worker path**, or a new subscription must be made.

