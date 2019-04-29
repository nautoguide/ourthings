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
	 * @param {string} json.iframeId - iframe target
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.class - Name of class to add
	 *
	 * @example
	 * elements.addClass({"targetId":".leftPanel","class":"hidden"});
	 */
	addClass(pid,json) {
		let self=this;
		let elements=self.queue.getIframeElements(json.iframeId,json.targetId);
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
	 * @param {string} json.iframeId - iframe target
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.class - Name of class to remove
	 *
	 * @example
	 * elements.removeClass({"targetId":".leftPanel","class":"hidden"});
	 */
	removeClass(pid,json) {
		let self=this;
		let elements=self.queue.getIframeElements(json.iframeId,json.targetId);
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
		let elements=self.queue.getIframeElements(json.iframeId,json.targetId);
		self.set(pid,json);
		if(elements!==false) {
			elements.forEach(function(element) {
				if (element.classList.contains(json.class))
					element.classList.remove(json.class);
				else
					element.classList.add(json.class);
			});
			self.finished(pid,self.queue.DEFINE.FIN_OK);
		} else {
			self.finished(pid,self.queue.DEFINE.FIN_WARNING,'Could not remove class ['+json.class+'] to ['+json.targetId+']');
		}
	}

	/**
	 * Cut a dom element out and paste it somewhere
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.sourceId - Source dom element
	 *
	 * @example
	 * elements.domCutPaste({"targetId":".leftPanel","sourceId":".thing"});
	 */
	domCutPaste(pid, json) {
		let source=self.queue.getElement(json.sourceId);
		let target=self.queue.getElement(json.targetId);
		target.appendChild(source);
		this.finished(pid,self.queue.DEFINE.FIN_OK);
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

	/**
	 * Set the value of an input field
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target
	 * @param {string} json.value - value to set
	 *
	 * @example
	 * elements.setInputValue({"targetId":"#username","value":"Hello World"});

	 */
	setInputValue(pid,json) {
		let self=this;
		let element=self.queue.getElement(json.targetId);
		element.value=json.value;
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Scroll to a dom target
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target
	 *
	 * @example
	 * elements.scrollIntoView({"targetId":"#ps_1"});

	 */
	scrollIntoView(pid,json) {
		let self=this;
		let element=self.queue.getElement(json.targetId);
		element.scrollIntoView();
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Scroll a dom container target to a dom target
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target to scroll to
	 * @param {string} json.containerId - Dom target container to scroll
	 *
	 * @example
	 * elements.scrollIntoView({"containerId":".map-elements-list","targetId":"#ps_1"});
	 */
	scrollContainerToElement(pid,json) {
		let self=this;
		let container = self.queue.getElement(json.containerId);
		let	element = self.queue.getElement(json.targetId);
		container.scrollTop = element.offsetTop;
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Monitor element(s) in a form and add classes on change
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - elements(s) to monitor for change and add modifiedClass to
	 * @param {string} json.buttonId - Element to add modifiedClass to
	 * @param {string} json.modifiedClass - Class to add to modified elements
	 * @param {string} json.modifiedQueue - Prepared queue to run when element modified
	 *
	 * @example
	 * elements.formActivityMonitor({"targetId":".functionMonitor","buttonId":".form-save","modifiedClass":"modified"});

	 */
	formActivityMonitor(pid,json) {
		let self=this;
		let elements=this.queue.getElements(json.targetId);
		let button;
		if(json.buttonId)
			button=this.queue.getElement(json.buttonId);
		elements.forEach(function(element) {
			element.addEventListener("change", function () {
				if(json.modifiedQueue)
					self.queue.execute(json.modifiedQueue,{});
				if(json.modifiedClass) {
					this.classList.add(json.modifiedClass);
					if(button)
						button.classList.add(json.modifiedClass);
				}
			});
			element.addEventListener("keypress", function () {
				if(json.modifiedQueue)
					self.queue.execute(json.modifiedQueue,{});
				if(json.modifiedClass) {
					this.classList.add(json.modifiedClass);
					if(button)
						button.classList.add(json.modifiedClass);
				}
			});

		});
		this.finished(pid,this.queue.DEFINE.FIN_OK);
	}
}
