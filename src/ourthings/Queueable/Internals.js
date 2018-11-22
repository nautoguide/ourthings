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
	 * Execute a prepared queue
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.name - prepared queue to call
	 * @param {object} [json.json] - New arguments to send to queue
	 */
	execute(pid,json) {
		let self=this;
		self.queue.execute(json.name,json.json);
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Check a statement and run prepared queue if its true
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.statement - statement to check
	 * @param {string} json.name - prepared queue to call
	 * @param {object} [json.json] - New arguments to send to queue
	 */
	ifqueue(pid,json) {
		let self=this;
		if(eval(json.statement)) {
			self.queue.execute(json.name,json.json);

		}
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	setMemory(pid,json) {
		let self=this;
		self.queue.setMemory(json.name,json.value,json.mode);
		self.finished(pid,self.queue.DEFINE.FIN_OK);

	}
}
