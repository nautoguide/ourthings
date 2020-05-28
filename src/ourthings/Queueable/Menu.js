/** @module ourthings/Queueable/Menu */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Menu
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * menu.init({"targetId":"content"});
 *
 */
class Menu extends Queueable {

	/**
	 * Render a template into the dom using the queues templateProcessor
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.template - dom id of template to use
	 * @param {string} [json.target] - dom id of render target
	 * @param {string} [json.mode] - "insert|append"
	 * @example
	 * templates.render({"targetId":"content","template":"basic"});
	 */
	init(pid,json) {
		let self=this;
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}
}

export default Menu;