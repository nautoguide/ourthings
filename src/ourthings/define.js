/**
 * @classdesc
 *
 * Our define class, contains all magic dnumber defines
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * // DEFINE = new Define();
 *
 */
export default class Define {
	constructor() {
		/**
		 * Queue state of operations
		 */
		this.STATUS_LOADING = 0;
		this.STATUS_LOADED = 1;
		this.STATUS_RUNNING = 2;
		this.STATUS_ERROR = 3;
	}
}