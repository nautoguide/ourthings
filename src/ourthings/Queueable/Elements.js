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
 * elements.removeClass({"targetId":".leftPanel","class":"hidden"});
 *
 */
export default class Elements extends Queueable {

	/**
	 * Add a class to a dom element
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.class - Name of class to add
	 *
	 * @example
	 * elements.addClass({"targetId":".leftPanel","class":"hidden"});
	 */
	addClass(pid,json) {
		let self=this;
		let elements=self.queue.getElements(json.targetId);
		self.set(pid,json);

		if(elements!==false) {
			elements.forEach(function(element) {
				element.classList.add(json.class);
			});
			self.finished(pid,self.queue.DEFINE.FIN_OK);
		} else {
			self.finished(pid,self.queue.DEFINE.FIN_WARNING,'Could not add class ['+json.class+'] to ['+json.targetId+']');
		}
	}

	/**
	 * Remove a class to a dom element
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.class - Name of class to remove
	 *
	 * @example
	 * elements.removeClass({"targetId":".leftPanel","class":"hidden"});
	 */
	removeClass(pid,json) {
		let self=this;
		let elements=self.queue.getElements(json.targetId);
		self.set(pid,json);
		if(elements!==false) {
			elements.forEach(function(element) {
				element.classList.remove(json.class);
			});
			self.finished(pid,self.queue.DEFINE.FIN_OK);
		} else {
			self.finished(pid,self.queue.DEFINE.FIN_WARNING,'Could not remove class ['+json.class+'] to ['+json.targetId+']');
		}
	}

	/**
	 * toggle a class on a dom element
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.class - Name of class to toggle
	 *
	 * @example
	 * elements.toggleClass({"targetId":".leftPanel","class":"hidden"});
	 */
	toggleClass(pid,json) {
		let self=this;
		let element=self.queue.getElement(json.targetId);
		self.set(pid,json);

		if(element!==false) {
			if(element.classList.contains(json.class))
				element.classList.remove(json.class);
			else
				element.classList.add(json.class);
			self.finished(pid,self.queue.DEFINE.FIN_OK);
		} else {
			self.finished(pid,self.queue.DEFINE.FIN_WARNING,'Could not remove class ['+json.class+'] to ['+json.targetId+']');
		}
	}

    /**
     * Set the HTML of an element
     * @param {number} pid - Process ID
     * @param {object} json - queue arguments
     * @param {string} json.targetId - Dom target
     * @param {string} json.html - HTML to add
     *
     * @example
     * elements.innerHTML({"targetId":".leftPanel","html":"Hello World"});

     */
	innerHTML(pid,json) {
		let self=this;
		let element=self.queue.getElement(json.targetId);
		element.innerHTML=json.html;
		self.finished(pid,self.queue.DEFINE.FIN_OK);

	}
}
