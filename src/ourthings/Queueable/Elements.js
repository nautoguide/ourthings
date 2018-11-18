/** @module ourthings/Queueable/Elements */
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
export default class Elements extends Queueable {

	/**
	 * Render a template into the dom using the queues templateProcessor
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.class - Name of class to add
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

	innerText(pid,json) {
		let self=this;
		debugger;
		let element=self.queue.getElement(json.targetId);
		element.innerHTML(json.text);
		self.finished(pid,self.queue.DEFINE.FIN_OK);

	}
}
