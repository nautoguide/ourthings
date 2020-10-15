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
	 * @example
	 * widgets.initPage();
	 */
	initPage(pid,json) {
		let options = Object.assign({
			"startPage": 1,
			"maxClass": "max",
			"prevTarget": ".page-left",
			"nextTarget": ".page-right",
			"totalPages":100
		}, json);
		this.queue.setMemory("currentPage", parseInt(options.startPage), "Session");
		this.pageMaxClass=options.maxClass;
		this.pagePrevTarget=options.prevTarget;
		this.pageNextTarget=options.nextTarget;
		this.pageTotal=options.totalPages;
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
	setPage(pid,json) {
		let newPage=memory.currentPage.value+parseInt(json.incr);
		if(json.page!==undefined)
			newPage=parseInt(json.page);
		if(newPage>=1&&newPage<=this.pageTotal)
			memory.currentPage.value=newPage;
		if(newPage===0) {
			queue.getElement(this.pagePrevTarget).classList.add(this.pageMaxClass);
		} else {
			queue.getElement(this.pagePrevTarget).classList.remove(this.pageMaxClass);
		}

		if(newPage===this.pageTotal) {
			queue.getElement(this.pageNextTarget).classList.add(this.pageMaxClass);
		} else {
			queue.getElement(this.pageNextTarget).classList.remove(this.pageMaxClass);
		}
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}
}

export default Widgets;