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
	redirect(pid, json) {
		window.top.location = json.location;
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * reload browser
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 */
	reload(pid, json) {
		window.location.reload();
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}
	/**
	 * Set a brower cookie using ourthing setCookie function
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.name - cookie name
	 * @param {string} json.value - cookie value
	 * @param {number} json.time - cookie TTL
	 */
	setCookie(pid,json) {
		let options = Object.assign({
			"name":"foo",
			"value":"bar",
			"time":300
		}, json);
		this.queue.setCookie(options.name,options.value,options.time);
		this.finished(pid, this.queue.DEFINE.FIN_OK);
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
	initHistory(pid, json) {
		let self = this;
		self.lastURL=false;

		function urlChange(e) {
			let baseURL = location.href;

			/*
			 * Do a check to see we are not trying to go to the same url
			 * In some browsers we will get two events (onpopstate & onhashchange)
			 */

			if(self.lastURL===false||baseURL!==self.lastURL) {
				if(memory.historyClose&&memory.historyClose.value==='on') {
					self.queue.setMemory('historyBlockedUrl', baseURL, "Session");
					location.href = self.lastURL;
					self.queue.execute('historyBlocked');
					return;
				}
				self.lastURL=baseURL;
				let match = baseURL.match(/\#([a-zA-Z]+)\/{0,1}(.*)$/);
				if (match && match[1]) {
					if (match[2])
						self.queue.setMemory('history', match[2].split('/'), "Session");
					self.queue.execute('history' + match[1]);
				} else {
					self.queue.execute('historyRoot');
				}
			}
		}

		window.onpopstate = urlChange;
		/*
		 * IE's *sigh*
		 */
		window.onhashchange = urlChange;

		if (json.checkURL) {
			let baseURL = location.href;
			let match = baseURL.match(/\#([a-zA-Z]+)\/{0,1}(.*)$/);
			if (match && match[1]) {
				if (match[2])
					self.queue.setMemory('history', match[2].split('/'), "Session");
				self.queue.execute('history' + match[1]);
				this.finished(pid, this.queue.DEFINE.FIN_OK);
				return;
			}
		}

		if(json.default) {
			self.addHistory(-1,{"history":json.default});
		}

		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}

	/**
	 * Add a history entry
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.history - history name to add
	 * @param {string} json.force - force history on same url
	 */
	addHistory(pid, json) {
		let options = Object.assign({
			"history": "Root",
		}, json);
		let baseURL = location.href;

		if (baseURL.match(/#/))
			baseURL = baseURL.slice(0, location.href.indexOf('#'));
		/*
		 * Some browsers 'Looking at you chrome' register a change event even if the URL is the same
		 * so we filter any matches out
		 */
		const newURL=baseURL + '#' + options.history;
		if (newURL !== location.href||options.force==true) {
			location.href = newURL;
		}
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	backHistory(pid, json) {
		window.history.back();
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	forwardHistory(pid, json) {
		window.history.forward();
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * Add a resize monitor that runs a queue on resize
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.name - queue to run on resize
	 */
	resizeMonitor(pid, json) {
		let self = this;
		window.onresize = function (event) {
			self.queue.execute(json.name);
		};
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * Toggle a close page trap on and off
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.mode - on|off
	 */
	closeEvent(pid,json) {
		this.queue.setMemory('historyClose', json.mode? json.mode:'on', "Session");
		if(json.mode==='off') {
			window.onbeforeunload = function(e) {};
		} else {
			window.onbeforeunload = blockClose;
		}

		function blockClose(e) {
			e = e || window.event;
			// For IE and Firefox prior to version 4
			if (e) {
				e.returnValue = 'Sure?';
			}
			// For Safari
			return 'Sure?';
		}
		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}

	/**
	 * Set page title
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.title - new page title
	 */
	setTitle(pid,json) {
		document.title = json.title;
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}
}
