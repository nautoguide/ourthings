/** @module ourthings/Queueable/Language */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Language
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * language.setLanguage({"langId":0});
 *
 */
class Language extends Queueable {

	/**
	 * Set the currernt language
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.langId - id of the language
	 * @example
	 * language.setLanguage({"langId":0});
	 */

	setLanguage(pid,json) {
		this.queue.language.setLanguage(json.langId);
		this.finished(pid,this.queue.DEFINE.FIN_OK);

	}
}

export default Language;