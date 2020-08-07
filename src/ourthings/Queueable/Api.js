/** @module Api */
import Queueable from "../Queueable";
import { v4 as uuidv4 } from 'uuid';

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

const MAX_BYTES = 50000;

export default class Api extends Queueable {

	/**
	 * Make a GET request
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.url - URL to make GET request to
	 * @param {string} json.contentType=application/json - Content type to request
	 * @param {string} json.header - header object to send (note Content-Type is overwritten by above setting)
	 * @param {string} json.name - name of error queue to use
	 */
	get(pid,json) {
		let self=this;
		json.contentType=json.contentType||'application/json';
		json.name=json.name||'apiError';
		let headers=json.headers||{};
		headers['Content-Type']=json.contentType||'application/json';
		fetch(json.url, {
			headers: headers,
		})
			.then(function(response) {
				if (!response.ok) {
					self.queue.setMemory('apiErrorDetail',{"json":json,"error":response},self.queue.DEFINE.MEMORY_SESSION);
					self.queue.execute(json.name);
				}
				self.queue.handleFetchErrors(response);
				return response;
			})
			.then(function(response) {
				switch(json.contentType) {
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
				self.set(pid,response);
				self.finished(pid,self.queue.DEFINE.FIN_OK);

			})
			.catch(function (error) {
				self.queue.setMemory('apiErrorDetail',{"json":json,"error":error},self.queue.DEFINE.MEMORY_SESSION);
				self.queue.execute(json.name);
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
	 */
	post(pid,json) {
		let self=this;
		json.contentType=json.contentType||'application/json';
		json.name=json.name||'apiError';
		let headers=json.headers||{};
		headers['Content-Type']=json.contentType||'application/json';
		fetch(json.url, {
			headers: headers,
			method: 'POST',
			body: JSON.stringify(json.body)
		})
			.then(function(response) {
				if (!response.ok) {
					self.queue.setMemory('apiErrorDetail',{"json":json,"error":response},self.queue.DEFINE.MEMORY_SESSION);
					self.queue.execute(json.name);
				}
				self.queue.handleFetchErrors(response);
				return response;
			})
			.then(function(response) {
				switch(json.contentType) {
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
				self.set(pid,response);
				self.finished(pid,self.queue.DEFINE.FIN_OK);

			})
			.catch(function (error) {
				self.queue.setMemory('apiErrorDetail',{"json":json,"error":error},self.queue.DEFINE.MEMORY_SESSION);
				self.queue.execute(json.name);
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
	put(pid,json) {
		let self=this;
		json.contentType=json.contentType||'image/png';
		json.name=json.name||'apiError';
		let headers=json.headers||{};
		headers['Content-Type']=json.contentType;
		fetch(json.url, {
			headers: headers,
			method: 'PUT',
			body: window.atob(json.body)
		})
			.then(function(response) {
				if (!response.ok) {
					self.queue.setMemory('apiErrorDetail',{"json":json,"error":response},self.queue.DEFINE.MEMORY_SESSION);
					self.queue.execute(json.name);
				}
				self.queue.handleFetchErrors(response);
				return response;
			})
			.then(function(response) {
				switch(json.contentType) {
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
				self.set(pid,response);
				self.finished(pid,self.queue.DEFINE.FIN_OK);

			})
			.catch(function (error) {
				self.queue.setMemory('apiErrorDetail',{"json":json,"error":error},self.queue.DEFINE.MEMORY_SESSION);
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
	websocketInit(pid,json) {
		let self=this;
		let options=Object.assign({
			"url":"ws://localhost",
			"queue":"queue",
			"queues":{}
		},json);
		self.frames={};
		self.bulk=[];
		self.bulkQueue='bulkQueue';
		self.socket = new WebSocket(options.url);
		self.socket.onopen = function(event) {
			self.finished(pid,self.queue.DEFINE.FIN_OK);
		};
		self.socket.onmessage = function(event) {
			let stack=[];
			let jsonData=JSON.parse(event.data);

			/*
			 * Is this part of a multi packet?
			 *
			 * For AWS websockets size is limited so we split packets down into frames IE:
			 *
			 * { frame: 1, totalFrames: 10, data: "BASE64" }
			 *
			 * This decodes those frames, you will need to implement the split in your AWS websocket code
			 */
			if(jsonData['frame']) {
				if(self.frames[jsonData['uuid']]===undefined) {
					self.frames[jsonData['uuid']]={"total":0,data:new Array(jsonData['frame']['totalFrames'])};
				}
				self.frames[jsonData['uuid']].data[jsonData['frame']]=atob(jsonData['data']);
				self.frames[jsonData['uuid']].total++;
				if(self.frames[jsonData['uuid']].total===jsonData['totalFrames']) {
					jsonData=JSON.parse(self.frames[jsonData['uuid']].data.join(''));
					deployEvent();
					delete self.frames[jsonData['uuid']];
				}
			} else {
				deployEvent();
			}

			function deployEvent() {
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


				/*
				 * Do we need to trigger event? If we have bulk calls coming in then only if its the last
				 */
				let wasBulk=false;
				for(let i in self.bulk) {
					if(self.bulk[i][options.queue]===jsonData[options.queue]) {
						self.bulk.splice(i, 1);
						wasBulk=true;
					}
				}

				if(wasBulk===false)
					self.queue.execute(jsonData[options.queue]);
				else {
					if(wasBulk===true&&self.bulk.length===0) {
						self.queue.execute(self.bulkQueue);
					}
				}
			}

		};

		self.socket.onclose = function(event) {
			self.queue.setMemory('wsCloseDetails', event, self.queue.DEFINE.MEMORY_SESSION);
			self.queue.execute("wsClose");
		};

		self.socket.onerror = function(event) {
			self.queue.setMemory('wsErrorDetails', event, self.queue.DEFINE.MEMORY_SESSION);
			self.queue.execute("wsError");
		};
	}

	websocketPop(pid,json) {
		let options=Object.assign({
			"prefix":"ws://localhost",
			"queue":"queue",
			"queues":{}
		},json);
		this.queue.setStack(pid,options.queue,memory[`wsStack_${json.queue}`].value.pop());
		this.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Send a json message down the websocket
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.message - JSON message to send
	 * @param {string} json.bulk - Bulk messages
	 * @param {string} json.bulk - Bulk bulkQueue
	 */
	websocketSend(pid,json) {
		let self=this;
		if(json.debug===true)
			console.log(json);
		self.queue.setMemory('wsLastSent', json, self.queue.DEFINE.MEMORY_SESSION);
		if(json.bulk) {
			/*
			 * Bulk mode, we are sending lots of requests and return triggers only work when we get it all back
			 */
			self.bulk=json.bulk;
			self.bulkQueue=json.bulkQueue;
			for(let i in self.bulk) {
				self._websocketSendActual(self.bulk[i])
				//self.socket.send(JSON.stringify(self.bulk[i]));
			}
		} else {
			//self.socket.send(JSON.stringify(json.message));
			self._websocketSendActual(json.message);
		}
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}


	_websocketSendActual(json) {
		let self=this;
		self.currentPacket = 0;
		self.totalPackets = 0;
		self.packetArray = [];
		self.uuid=uuidv4();
		const payload=JSON.stringify(json);
		if (payload.length > MAX_BYTES) {
			self.totalPackets = Math.ceil(payload.length / MAX_BYTES);
			for (let i = 0; i < self.totalPackets; i++) {
				let loc = i * MAX_BYTES;
				let sub = payload.slice(loc, MAX_BYTES + loc);
				self.packetArray.push(sub);
			}
			self._websocketSendPacket();
		} else {
			try {
				self.socket.send(payload);
			} catch(event) {
				self.queue.setMemory('wsErrorDetails', event, self.queue.DEFINE.MEMORY_SESSION);
				self.queue.execute("wsError");

			}
		}
	}

	_websocketSendPacket() {
		let self=this;
		/*
		 * more work?
		 */
		if (self.currentPacket < self.totalPackets) {
			let packet = btoa(self.packetArray.shift());
			self.currentPacket++;
			//console.log(`packet:${self.currentPacket}-${self.totalPackets} Size: ${packet.length}`);

			try {
				self.socket.send(JSON.stringify({
					"frame": self.currentPacket,
					"totalFrames": self.totalPackets,
					"uuid": self.uuid,
					"data": packet
				}));
			} catch(event) {
				self.queue.setMemory('wsErrorDetails', event, self.queue.DEFINE.MEMORY_SESSION);
				self.queue.execute("wsError");
			}
			setTimeout(function() {self._websocketSendPacket();},100);
		}
	}

}
