/** @module Elements */
import Queueable from "../queueable";

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
export default class Elements extends Queueable {

	/**
	 * Render a template into the dom using the queues templateProcessor
	 * @param pid
	 * @param json
	 */
	addClass(pid,json) {
		let self=this;
		let element=self.queue.getElement(json.targetId);
		self.set(pid,json);

		if(element!==false) {
			element.classList.add(json.class);
			self.finished(pid,self.queue.DEFINE.FIN_OK);
		} else {
			self.finished(pid,self.queue.DEFINE.FIN_WARNING,'Could not add class ['+json.class+'] to ['+json.targetId+']');
		}
	}
}
