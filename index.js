const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer);

const { Events } = require('./enums.js');

// CONSTANTS
const PORT = process.env.PORT ?? 3000;

// VARIABLES
const services = new Map();

// FUNCTIONS
function subscribe(socket, sub) {
	socket.join(sub);
}

// MAIN
io.on('connection', socket => {
	socket.on(Events.Socket.REGISTER, (service, cb) => {
		if (services.has(service)) {
			console.log(`Service [${service}] has already been registered`);
			return cb?.({
				success: false,
				err: 'Service already registered',
			});
		}

		services.set(service, socket);
		socket.service = service;
		cb?.({
			success: true,
		});

		console.log(`Service [${socket.service}] has been registered`);
	});

	socket.on(Events.Socket.SUBSCRIBE, (subscriptions, cb) => {
		if (!Array.isArray(subscriptions)) {
			subscriptions = [subscriptions];
		}

		for (let sub of subscriptions) {
			subscribe(socket, sub);
		}

		cb?.({
			success: true,
		});
	});

	socket.on(Events.Socket.OPEN, _ => {});

	socket.on('disconnecting', _ => {
		// const rooms = Object.keys(socket.rooms);
		// cleanup
		services.delete(socket.service);
	});

	socket.on('disconnect', _ => {
		// disconnected
		if (!socket.service) return;
		console.log(`Service [${socket.service}] has been disconnected`);
	});

	socket.on(Events.BROADCAST, ({ event, data }) => {
		console.log(`Broadcasting [${event}] from [${socket.service}]: `, data);
		socket.broadcast.emit(event, data);
	});

	socket.on(Events.MESSAGE, (msg, cb) => {
		if (msg == null) {
			console.log(
				`Rejecting null message from socket [${socket.id}], service [${socket.service}]`
			);
			return cb?.({
				success: false,
				err: 'Message should not be null',
			});
		}
		const { to, event, data } = msg;
		if (!to) {
			console.log(
				`Rejecting message from socket [${socket.id}], service [${socket.service}]`
			);
			return cb?.({
				success: false,
				err: 'Message should contain at least the destination',
			});
		}
		services.get(to)?.emit(event, data, res => cb?.(res));
		console.log(`MSG [${socket.service}] -> [${to}]: [${event}] `, data);
	});

	console.log(`New socket: ${socket.id}`);
});

httpServer.listen(PORT, _ => console.log(`Server listening on port ${PORT}`));
