import Queue from './queue.js';

/**
 * On load initiate the queue object
 *
 */

let queue;
window.onload = function() {
	queue = new Queue();
	/**
	 * TODO this copies the webpack object into the window so we can debug. Needs to be optional
	 * @type {Queue}
	 */
	window.queue=queue;
};
