/** @module ourthings/Queueable/Files */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * File upload functions
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */
export default class Files extends Queueable {


	/**
	 * Redirect browser to a new page
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.location - Dom location to direct to
	 */
	clientLoad(pid,json) {
		let self=this;
		let element=self.queue.getElement(json.targetId);
		let files=element.files;
		if(files&&files[0]) {
			let reader = new FileReader();
			reader.readAsBinaryString(files[0], "UTF-8");
			reader.onload = function (evt) {
				self.set(pid,window.btoa(evt.target.result));
				self.finished(pid,self.queue.DEFINE.FIN_OK);

			};
			reader.onerror = function (evt) {
				// TODO Write me!
				console.log('error');
				debugger;
				self.finished(pid,self.queue.DEFINE.FIN_ERROR);

			};
		}


	}
}
