/** @module ourthings/Queueable/Browser */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Browser Functions
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */
export default class Browser extends Queueable {


	/**
	 * Redirect browser to a new page
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.location - Dom location to direct to
	 */
	redirect(pid,json) {
		let self=this;
		window.top.location = json.location;
		self.finished(pid,self.queue.DEFINE.FIN_OK);

	}
}
