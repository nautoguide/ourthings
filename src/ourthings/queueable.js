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

	constructor(queue) {
		let self=this;
		self.queue=queue;
	}

	start(pid,command,json) {
		let self=this;
		self[command](pid,json);
	}

	finished(pid,mode) {
		let self=this;
		console.log('finished:'+pid+':'+mode);
		self.queue.finished(pid.mode);
	}
}
