/** @module Queueable */
import Define from './define.js';

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
	 * Constructor, overide this for any promise based inits setting
	 * the self.ready=true after the promise
	 *
	 * @param queue
	 */
	constructor(queue) {
		let self=this;
		self.ready=true;
		self.queue=queue;
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
		console.log('finished:'+pid+':'+mode);
		self.queue.finished(pid.mode);
	}
}
