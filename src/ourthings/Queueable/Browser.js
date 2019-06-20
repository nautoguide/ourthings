/** @module ourthings/Queueable/Browser */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Browser Functions
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */
export default class Browser extends Queueable {


	/**
	 * Redirect browser to a new page
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.location - Dom location to direct to
	 */
	redirect(pid,json) {
		window.top.location = json.location;
		this.finished(pid,this.queue.DEFINE.FIN_OK);
	}

	/**
	 * Start the history monitor.
	 *
	 * Detects when the user navigates via back / forward button and runs queue based on history item
	 * added via addHistory
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 */
	initHistory(pid,json) {
		let self=this;

		function urlChange() {
			let baseURL = location.href;
			let match=baseURL.match(/#(.*)/);
			if(match&&match[1]) {
				self.queue.execute('history'+match[1]);
			} else {
				self.queue.execute('historyRoot');
			}
		}

		window.onpopstate = urlChange;
		/*
		 * IE's *sigh*
		 */
		window.onhashchange = urlChange;
		this.finished(pid,this.queue.DEFINE.FIN_OK);

	}

	/**
	 * Add a history entry
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.history - history name to add
	 */
	addHistory(pid,json) {
		let options=Object.assign({
			"history":"Root",
		},json);
		let baseURL = location.href;
		if(baseURL.match(/#/))
			baseURL = baseURL.slice(0, location.href.indexOf('#'));
		location.href = baseURL + '#' + options.history;
		this.finished(pid,this.queue.DEFINE.FIN_OK);
	}
}
