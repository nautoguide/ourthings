/** @module Templates */
import Queueable from "../queueable";

/**
 * @classdesc
 *
 * Template manipulations
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * // @templates.render({"targetId":"content","template":"basic"},{"queueRun":"Instant"});
 *
 */
export default class Templates extends Queueable {

	render(pid,json) {
		let self=this;
		self.queue.templateProcessor(json.template,json.targetId);
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}
}
