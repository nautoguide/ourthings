/** @module ourthings/Queueable/Internals */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Internal queue functions exposed to queueables
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */
export default class Internals extends Queueable {

	/**
	 * Render a template into the dom using the queues templateProcessor
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.name - prepared queue to call
	 */
	execute(pid,json) {
		let self=this;
		self.queue.execute(json.name);
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}
}
