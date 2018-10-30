/** @module Queueable */

/**
 * @classdesc
 *
 * The base class for queueable things
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * // queue = new Queue();
 *
 */
export default class Queueable {

	/**
	 * Constructor, Sets our status to be false (flipped on init)
	 *
	 */
	constructor() {
		let self=this;
		self.ready=false;
	}

	/**
	 * init, override this for any promise based inits setting
	 * the self.ready=true after the promise
	 *
	 */
	init(queue) {
		let self=this;
		self.queue=queue;
		self.ready=true;
	}

	/**
	 * Called from queue, starts running the actual command
	 * @param pid
	 * @param command
	 * @param json
	 */
	start(pid,command,json) {
		let self=this;
		self[command](pid,json);
	}

	/**
	 * Call this method after you command has finished. Failure to do so will result is
	 * a stalled queue
	 * @param pid
	 * @param mode
	 */
	finished(pid,mode) {
		let self=this;
		self.queue.finished(pid.mode,mode);
	}
}
