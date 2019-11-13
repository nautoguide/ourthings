/** @module ourthings/Queueable/Markdown */
import Queueable from "../Queueable";
import showdown from "Showdown"

/**
 * @classdesc
 *
 * Markdown Functions
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */
export default class Markdown extends Queueable {


	/**
	 * Convert MD to HTML to display
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.md - Markdown string
	 * @param {string} json.name - memory name to set with the html
	 * @param {string} json.options - Options to pass to showdown see: https://github.com/showdownjs/showdown/wiki/Showdown-options
	 * @example markdown.makeHtml({"md":"{{!memory.select.value.properties.description}}","options":{"openLinksInNewWindow":true}});

	 */
	makeHtml(pid,json) {
		let options=Object.assign({
			"name":"html",
			"options":{}
		},json);

		const converter = new showdown.Converter(options.options);
		let html=converter.makeHtml(json.md);
		this.queue.setMemory(options.name,html,"Session");
		this.finished(pid,this.queue.DEFINE.FIN_OK);
	}


}
