/** @module Api */
import Queueable from "../Queueable";
import wspClient from '@nautoguide/aws-wsp/wsp-client';

/**
 * @classdesc
 *
 * API connection methods
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */


export default class Api extends Queueable {

	/**
	 * Make a GET request
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.url - URL to make GET request to
	 * @param {string} json.contentType=application/json - Content type to request
	 * @param {string} json.header - header object to send (note Content-Type is overwritten by above setting)
	 * @param {string} json.errorName - name of error queue to use
	 * @param {string} json.name - name of memoryto use
	 * @param {string} json.qyeue - name of success queue to
	 */
	get(pid, json) {
		let self = this;
		json.contentType = json.contentType || 'application/json';
		json.errorName = json.errorName || 'apiError';
		let headers = json.headers || {};
		headers['Content-Type'] = json.contentType || 'application/json';
		fetch(json.url, {
			headers: headers,
		})
			.then(function (response) {
				if (!response.ok) {
					self.queue.setMemory('apiErrorDetail', {
						"json": json,
						"error": response
					}, self.queue.DEFINE.MEMORY_SESSION);
					self.queue.execute(json.errorName);
					self.finished(pid, self.queue.DEFINE.FIN_OK);

					return Promise.reject("Response was not ok");
				}
				return response;
			})
			.then(function (response) {
				switch (json.contentType) {
					case 'application/json':
						return response.json();
					default:
						return response.text();
				}
			})
			.then(function (response) {
				/*
				 * Convert the response to json and start the loader
				 */
				self.set(pid, response);
				if(json.name) {
					self.queue.setMemory(json.name, {
						"json": response,
					}, self.queue.DEFINE.MEMORY_SESSION);
				}
				if(json.queue) {
					self.queue.execute(json.queue);
				}
				self.finished(pid, self.queue.DEFINE.FIN_OK);

			})
			.catch(function (error) {
				self.queue.setMemory('apiErrorDetail', {
					"json": json,
					"error": error
				}, self.queue.DEFINE.MEMORY_SESSION);
				self.queue.execute(json.errorName);
				console.info(self.queue.DEFINE.CONSOLE_LINE);
				console.error('Error:', error);
				console.info("api.get Warning this error is probably fatal");
			});

	}

	/**
	 * Make a POST request
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.url - URL to make GET request to
	 * @param {string} json.contentType=application/json - Content type to request
	 * @param {string} json.header - header object to send (note Content-Type is overwritten by above setting)
	 * @param {string} json.body - object to send JSON.stringify is applies to this
	 * @param {string} json.name - name of error queue to use
	 * @param {string} json.errorName - name of error queue to use
	 */
	post(pid, json) {
		let self = this;
		json.contentType = json.contentType || 'application/json';
		json.errorName = json.errorName || 'apiError';
		let headers = json.headers || {};
		headers['Content-Type'] = json.contentType || 'application/json';
		fetch(json.url, {
			headers: headers,
			method: 'POST',
			body: JSON.stringify(json.body)
		})
			.then(function (response) {
				if (!response.ok) {
					self.queue.setMemory('apiErrorDetail', {
						"json": json,
						"error": response
					}, self.queue.DEFINE.MEMORY_SESSION);
					self.queue.execute(json.errorName);
					self.finished(pid, self.queue.DEFINE.FIN_OK);

					return Promise.reject("Response was not ok");
				}
				self.queue.handleFetchErrors(response);
				return response;
			})
			.then(function (response) {
				switch (json.contentType) {
					case 'application/json':
						return response.json();
					default:
						return response.text();
				}
			})
			.then(function (response) {
				/*
				 * Convert the response to json and start the loader
				 */
				self.set(pid, response);
				if(json.queue) {
					self.queue.execute(json.queue);
				}
				self.finished(pid, self.queue.DEFINE.FIN_OK);

			})
			.catch(function (error) {
				self.queue.setMemory('apiErrorDetail', {
					"json": json,
					"error": error
				}, self.queue.DEFINE.MEMORY_SESSION);
				self.queue.execute(json.errorName);
				console.info(self.queue.DEFINE.CONSOLE_LINE);
				console.error('Error:', error);
				console.info("api.post Warning this error is probably fatal");
			});

	}

	/**
	 * Make a PUT request
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.url - URL to make PUT request to
	 * @param {string} json.contentType=application/json - Content type to request
	 * @param {string} json.header - header object to send (note Content-Type is overwritten by above setting)
	 * @param {string} json.body - object to send JSON.stringify is applies to this
	 * @param {string} json.name - name of error queue to use
	 */
	put(pid, json) {
		let self = this;
		json.contentType = json.contentType || 'image/png';
		json.name = json.name || 'apiError';
		let headers = json.headers || {};
		headers['Content-Type'] = json.contentType;
		fetch(json.url, {
			headers: headers,
			method: 'PUT',
			body: window.atob(json.body)
		})
			.then(function (response) {
				if (!response.ok) {
					self.queue.setMemory('apiErrorDetail', {
						"json": json,
						"error": response
					}, self.queue.DEFINE.MEMORY_SESSION);
					self.queue.execute(json.name);
				}
				self.queue.handleFetchErrors(response);
				return response;
			})
			.then(function (response) {
				switch (json.contentType) {
					case 'application/json':
						return response.json();
					default:
						return response.text();
				}
			})
			.then(function (response) {
				/*
				 * Convert the response to json and start the loader
				 */
				self.set(pid, response);
				self.finished(pid, self.queue.DEFINE.FIN_OK);

			})
			.catch(function (error) {
				self.queue.setMemory('apiErrorDetail', {
					"json": json,
					"error": error
				}, self.queue.DEFINE.MEMORY_SESSION);
				self.queue.execute(json.name);
				console.info(self.queue.DEFINE.CONSOLE_LINE);
				console.error('Error:', error);
				console.info("api.put Warning this error is probably fatal");
			});

	}

	/**
	 * Create a new websocket
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.url - URL to connect websocket too
	 * @param {string} json.action - What json param will contain the 'action' router
	 * @param {string} json.queues - Array of {action:"action", queue:"queue" }

	 */
	websocketInit(pid, json) {
		let self = this;
		let options = Object.assign({
			"url": "ws://localhost",
			"queue": "queue",
			"queues": {},
			"recvQeue": false
		}, json);


		self.bulk = self.bulk || [];
		self.bulkQueue = 'bulkQueue';


		self.ws=new wspClient();

		self.ws.onOpen = function() {
			self.finished(pid, self.queue.DEFINE.FIN_OK);
		}

		self.ws.onMessage = function (jsonData) {
			let stack = [];
			/*
			 * We push data to the stack for anyone using stack mode
			 */
			if (memory[`wsStack_${jsonData[options.queue]}`])
				stack = memory[`wsStack_${jsonData[options.queue]}`].value;
			stack.push(jsonData);
			self.queue.setMemory(`wsStack_${jsonData[options.queue]}`, stack, self.queue.DEFINE.MEMORY_SESSION);
			/*
			 * Set our normal memory (not multiple thread safe)
			 */
			self.queue.setMemory(jsonData[options.queue], jsonData, self.queue.DEFINE.MEMORY_SESSION);
			self.queue.setMemory('wsLastRecv', jsonData, self.queue.DEFINE.MEMORY_SESSION);


			/*
			 * Do we need to trigger event? If we have bulk calls coming in then only if its the last
			 */
			let wasBulk = false;
			for (let i in self.bulk) {
				if (self.bulk[i][options.queue] === jsonData[options.queue]) {
					self.bulk.splice(i, 1);
					wasBulk = true;
				}
			}

			if (wasBulk === false) {
				self.queue.execute(jsonData[options.queue]);
				if (options.recvQeue)
					self.queue.execute(options.recvQeue);
			} else {
				if (wasBulk === true && self.bulk.length === 0) {
					self.queue.execute(self.bulkQueue);
					if (options.recvQeue)
						self.queue.execute(options.recvQeue);
				}
			}
		}

		self.ws.onClose =function(event) {
			self.queue.setMemory('wsCloseDetails', event, self.queue.DEFINE.MEMORY_SESSION);
			self.queue.execute("wsClose");
		}


		self.ws.onError =function(event) {
			self.queue.setMemory('wsErrorDetails', event, self.queue.DEFINE.MEMORY_SESSION);
			self.queue.execute("wsError");
		}

		self.ws.open({url:options.url});

	}

	websocketClose(pid,json) {
		this.ws.close();
		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}

	websocketPop(pid, json) {
		let options = Object.assign({
			"prefix": "ws://localhost",
			"queue": "queue",
			"queues": {}
		}, json);
		this.queue.setStack(pid, options.queue, memory[`wsStack_${json.queue}`].value.pop());
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Send a json message down the websocket
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.message - JSON message to send
	 * @param {string} json.bulk - Bulk messages
	 * @param {string} json.bulk - Bulk bulkQueue
	 * @param {string} json.debug - Debug to console
	 * @param {string} json.sendQueue - Queue to always call on send
	 *
	 */
	websocketSend(pid, json) {
		let self = this;
		let options = Object.assign({
			"debug": false,
			"sendQueue": false
		}, json);
		if (options.debug === true)
			console.log(json);
		self.queue.setMemory('wsLastSent', json, self.queue.DEFINE.MEMORY_SESSION);
		if (options.sendQueue)
			self.queue.execute(options.sendQueue);
		if (json.bulk) {
			/*
			 * Bulk mode, we are sending lots of requests and return triggers only work when we get it all back
			 */
			self.bulk = json.bulk;
			self.bulkQueue = json.bulkQueue;
			for (let i in self.bulk) {
				self.ws.send(self.bulk[i]);
			}
		} else {
			//self.socket.send(JSON.stringify(json.message));
			self.ws.send(json.message);
		}
		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}


}
