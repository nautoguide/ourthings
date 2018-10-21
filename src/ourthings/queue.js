/**
 * @classdesc
 *
 * The main queue class
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * // queue = new Queue();
 *
 */
export default class Queue {

	/**
	 * Class constructor
	 */
	constructor() {

		self = this;
		/**
		 * Our Queue array
		 *
		 * @type {Array}
		 */
		self.queue = [];

		self.templates = [];

		fetch('templates.json', {
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(response => response.json())
			.then(function (json) {
				self.templates = json;
				self.templateLoader();
			}).catch(error => console.error('Error:', error));
	}

	templateLoader() {
		let template=this.templates.pop();
		console.log('loading:'+template);
	}

	/**
	 * Template processor
	 * Takes a template, process it and places into the dom
	 * @param templateId {string} - ID of the template
	 * @param targetId {string} - Place in the dom the put the result
	 */
	templateProcessor(templateId, targetId) {

		let templateDom = document.getElementById(templateId);
		let targetDom = document.getElementById(targetId);

		let templateHTML = templateDom.innerHTML;
		console.log(templateHTML);
	}
}