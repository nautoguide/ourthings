import Define from './define.js';

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
		 * Create our DEFINE object for
		 * @type {Define}
		 */
		self.DEFINE = new Define();
		/**
		 * Our Queue array
		 *
		 * @type {Array}
		 */
		self.queue = [];

		/**
		 * Templates to be loaded
		 * @type {Array}
		 */
		self.templates = [];


		/**
		 * Create a fragment for big dom inserts
		 * @type {DocumentFragment}
		 */
		self.fragment = document.createDocumentFragment();

		/**
		 * Se our status
		 * @type {number}
		 */
		self.status = self.DEFINE.STATUS_LOADING;

		/**
		 * Load the templates.json
		 */
		fetch('templates.json', {
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(response => self.handleFetchErrors(response))
			.then(response => response.json() )
			.then(function (response) {
				/**
				 * Conver the response to json and start the loader
				 */
				self.templates = response;
				self.templateLoader();
			})
			.catch(function (error) {
				console.error('Error:', error);
				console.info("Warning this error is probably fatal as I have no templates to load")
			});
	}

	/**
	 * Error Handler for fetch calls
	 * @param response
	 * @returns {{ok}|Object}
	 */
	handleFetchErrors(response) {
		if (!response.ok) {
			throw Error(response.statusText);
		}
		return response;
	}

	/**
	 * Loads templates from the template stack. Recursively calls self until stack is empty
	 */
	templateLoader() {
		let self=this;
		/**
		 *  Are there any templates to load?
		 *
		 *  If not then we dump the fragment into the dom
		 */
		if (this.templates.length === 0) {
			console.log('Done Loading');
			document.head.appendChild(self.fragment);
			/**
			 * Set our status and then process the init template
			 * @type {number}
			 */
			self.status=self.DEFINE.STATUS_LOADED;
			self.templateProcessor("init",false)
			return;
		}

		/**
		 * Pop the template off the stack
		 * @type {string}
		 */
		let template = this.templates.pop();

		fetch(template, {
			headers: {
				'Content-Type': 'test/html'
			}
		})
			.then(response => self.handleFetchErrors(response))
			.then(response => response.text())
			.then(function (response) {

				/**
				 * Get the template we were sent and add it to the fragment for insertion into the dom
				 *
				 * We wrap it in meta tag, this helps improve render speed but still stuck with an innerHTML
				 * as we don't know the content
				 *
				 */
				let text = response;
				let meta = document.createElement('meta');
				meta.setAttribute("name", "generator");
				meta.setAttribute("content", template);
				meta.innerHTML=text;
				self.fragment.appendChild(meta);

				/**
				 *  Call our self again to process any more templates
				 */
				self.templateLoader();
			})
			.catch(function (error) {
				console.error('Error:', error);
				console.info("Warning this error is probably fatal as a template specified in templates.json has failed to load");
			});
	};

	/**
	 * Template processor
	 * Takes a template, process it and places into the dom
	 * @param templateId {string} - ID of the template
	 * @param targetId {string|false} - Place in the dom the put the result. In the event of false we process without dom
	 */
	templateProcessor(templateId, targetId) {

		let templateDom = document.getElementById(templateId);
		let targetDom=undefined;
		if(targetId===false)
		 targetDom= document.getElementById(targetId);

		let templateHTML = templateDom.innerHTML;
		console.log(templateHTML);
	}


}