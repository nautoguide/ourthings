/** @module Define */


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

		/**
		 * Render modes
		 */
		this.RENDER_INSERT = 0;
		this.RENDER_APPEND = 1;


		/**
		 *  Command types
		 */

		this.COMMAND_INSTANT = "Instant";
		this.COMMAND_EVENT = "Event";
		this.COMMAND_SUB = "Sub";

		/**
		 *  Queue states
		 */
		this.QUEUE_ADDED = 0;
		this.QUEUE_RUNNING = 1;
	}
}