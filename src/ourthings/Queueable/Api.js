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
	 * Render a template into the dom using the queues templateProcessor
	 * @param pid
	 * @param json
	 */
	get(pid,json) {
		let self=this;

		fetch(json.url, {
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(response => self.queue.handleFetchErrors(response))
			.then(response => response.json() )
			.then(function (response) {
				/**
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
