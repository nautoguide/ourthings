/** @module Language */


/**
 * @classdesc
 *
 * Memory manager class
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * // memory = new Language();
 *
 */
export default class Language {
	/**
	 * Add new lang def
	 * @param defs
	 * @param langId
	 */
	constructor(defs,langId) {
		this.langId=langId||0;
		this.defs=defs;
	}

	/**
	 * Get the tag in the current language#
	 * @param tag
	 * @return {*}
	 */
	get(tag) {
		return this.defs.tags[tag][this.langId];
	}

	/**
	 * Set the current language
	 * @param langId
	 * @return {*}
	 */
	setLanguage(langId) {
		this.langId=langId||0;
	}
};