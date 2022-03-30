const client = new tmi.Client({
	connection:{
        secure: true,
        reconnect: true,
    },
	channels: [ 'shivfps' ]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
	// "Alca: Hello, World!"
	console.log(`${tags['display-name']}: ${message}`);
});