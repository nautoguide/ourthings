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
		this.QUEUE_FINISHED = 1;

		/**
		 * Queueable Finished states
		 */

		this.FIN_OK = 0;
		this.FIN_TRUE = 1;
		this.FIN_FALSE = 1;

		/**
		 *  Console outputs
		 */
		this.CONSOLE_LINE="-==ourthings======================================================-";
		this.CONSOLE_COL_VT="background: #222; color: #bada55";
		this.CONSOLE_COL_GREEN="background: #222; color: #0f0";
		this.CONSOLE_COL_RED="background: #222; color: #f00";
		this.CONSOLE_COL_AMBER="background: #222; color: amber";

	}
}