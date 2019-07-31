/** @module Api */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Dom Elements manipulations
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
}
