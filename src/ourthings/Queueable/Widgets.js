/** @module ourthings/Queueable/Widgets */
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
class Widgets extends Queueable {

	/**
	 * Init the page control
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} [json.startPage] - start page
	 * @param {string} [json.totalPages] - Total number of pages
	 * @param {string} [json.maxClass] - class to use for max
	 * @param {string} [json.prevTarget] - class to use for prev
	 * @param {string} [json.nextTarget] - class to use for next
	 * @param {string} [json.queuePrefix] - prefix to use for queue runner
	 * @param {array} [json.disabledPages] - list of disabled pages
	 * @example
	 * widgets.initPage();
	 */
	initPage(pid, json) {
		let options = Object.assign({
			"startPage": 1,
			"maxClass": "max",
			"prevTarget": ".page-left",
			"nextTarget": ".page-right",
			"totalPages": 100,
			"disabledPages":[],
			"queuePrefix":undefined
		}, json);
		this.queue.setMemory("currentPage", parseInt(options.startPage), "Session");
		this.pageMaxClass = options.maxClass;
		this.pagePrevTarget = options.prevTarget;
		this.pageNextTarget = options.nextTarget;
		this.pageTotal = options.totalPages;
		this.disabledPages = options.disabledPages;
		this.queuePrefix = options.queuePrefix;
/*

		if (parseInt(options.startPage) <= 1)
			queue.getElement(this.pagePrevTarget).classList.add(this.pageMaxClass);

		if (parseInt(options.startPage) >= this.pageTotal)
			queue.getElement(this.pageNextTarget).classList.add(this.pageMaxClass);
*/
		this._resetPageStates();
		if(this.queuePrefix)
			queue.execute(`${this.queuePrefix}Page${memory.currentPage.value}`);

		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	_resetPageStates() {
		const prev=this.queue.getElement(this.pagePrevTarget);
		const next=this.queue.getElement(this.pageNextTarget);

		next.classList.remove(this.pageMaxClass);
		prev.classList.remove(this.pageMaxClass);
		if (memory.currentPage.value <= 1)
			prev.classList.add(this.pageMaxClass);

		if (memory.currentPage.value >= this.pageTotal)
			next.classList.add(this.pageMaxClass);
	}

	/**
	 * Disable pages
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {array} [json.disabledPages] - list of disabled pages
	 * @example
	 * widgets.disablePages({"disabledPages":[4,5,6]});
	 */
	disablePages(pid,json) {
		this.disabledPages = json.disabledPages;
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * set pages
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {int} [json.totalPages] - Total pages
	 * @example
	 * widgets.setPages({"totalPages":5});
	 */
	setPages(pid,json) {
		this.pageTotal = parseInt(json.totalPages);
		this._resetPageStates();
		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}

	/**
	 * Set the current page
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.incr - Increment to use
	 * @param {string} json.page - Page to use
	 * @example
	 * widgets.setPage({"targetId":"content","template":"basic"});
	 */
	setPage(pid, json) {
		let newPage = memory.currentPage.value + parseInt(json.incr);
		if(this.disabledPages.length>0&&this.disabledPages.indexOf(newPage)!==-1) {
			for(;newPage<this.pageTotal&&newPage>1;newPage+=parseInt(json.incr)) {
				if(this.disabledPages.indexOf(newPage)==-1)
					break;
			}
		}
		if (json.page !== undefined)
			newPage = parseInt(json.page);
		if (newPage >= 1 && newPage <= this.pageTotal)
			memory.currentPage.value = newPage;
		if (newPage <= 1) {
			queue.getElement(this.pagePrevTarget).classList.add(this.pageMaxClass);
		} else {
			queue.getElement(this.pagePrevTarget).classList.remove(this.pageMaxClass);
		}

		if (newPage >= this.pageTotal) {
			queue.getElement(this.pageNextTarget).classList.add(this.pageMaxClass);
		} else {
			queue.getElement(this.pageNextTarget).classList.remove(this.pageMaxClass);
		}
		if(this.queuePrefix)
			queue.execute(`${this.queuePrefix}Page${memory.currentPage.value}`);
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}
}

export default Widgets;