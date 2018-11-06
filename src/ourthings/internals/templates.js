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

	/**
	 * Render a template into the dom using the queues templateProcessor
	 * @param pid
	 * @param json
	 */
	render(pid,json) {
		let self=this;
		if(!self.queue.templateProcessor(json.template,json.targetId))
			self.finished(pid,self.queue.DEFINE.FIN_ERROR,'Could not render template');
		else
			self.finished(pid,self.queue.DEFINE.FIN_OK);
	}
}
