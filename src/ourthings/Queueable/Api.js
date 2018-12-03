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
	 */
	get(pid,json) {
		let self=this;
		json.contentType=json.contentType||'application/json';
		let headers=json.headers||{};
		headers['Content-Type']=json.contentType||'application/json';
		fetch(json.url, {
			headers: headers,
		})
			.then(response => self.queue.handleFetchErrors(response))
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
				console.info(self.queue.DEFINE.CONSOLE_LINE);
				console.error('Error:', error);
				console.info("Warning this error is probably fatal as I have no templates to load")
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
	 */
	post(pid,json) {
		let self=this;
		json.contentType=json.contentType||'application/json';
		let headers=json.headers||{};
		headers['Content-Type']=json.contentType||'application/json';
		fetch(json.url, {
			headers: headers,
			method: 'POST',
			body: JSON.stringify(json.body)
		})
			.then(response => self.queue.handleFetchErrors(response))
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
				console.info(self.queue.DEFINE.CONSOLE_LINE);
				console.error('Error:', error);
				console.info("Warning this error is probably fatal as I have no templates to load")
			});

	}
}
