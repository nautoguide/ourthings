/** @module ourthings/Queueable/Templates */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Template manipulations
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * templates.render({"targetId":"content","template":"basic"});
 *
 */
class Templates extends Queueable {

	/**
	 * Render a template into the dom using the queues templateProcessor
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.template - dom id of template to use
	 * @param {string} [json.target] - dom id of render target
	 * @param {string} [json.mode] - "insert|append"
	 * @param {boolean} [json.quiet] - true|false
	 * @example
	 * templates.render({"targetId":"content","template":"basic"});
	 */
	render(pid,json) {
		let self=this;
		let options = Object.assign({
			"mode": "insert",
			"scrollTarget":".scroll",
			"scroll":true

		}, json);
		self.set(pid,json);
		if(!self.queue.templateProcessor(options.template,options.targetId,options.mode)&&options.quiet!==true) {

			self.finished(pid, self.queue.DEFINE.FIN_ERROR, 'Could not render template');
		} else {
			if(options.scroll===true) {
				let scrollElement = self.queue.getElement(options.targetId).closest(options.scrollTarget);
				if(scrollElement)
					scrollElement.scrollTop = 0;
				else
					window.scrollTo(0,0);
			}
			self.finished(pid, self.queue.DEFINE.FIN_OK);
		}
	}
}

export default Templates;