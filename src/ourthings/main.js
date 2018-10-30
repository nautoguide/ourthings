import Queue from './queue.js';

/**
 *  Import all the queueables we want to use here. Make sure to add an entry to window.queueables bellow to
 *  construct the object
 *
 *  TODO Figure a way to get list of imported queuaables from webpack (plugin?)
 */
import Templates from './internals/templates.js';

/**
 * On load initiate the queue object
 *
 * And setup our queueables
 *
 */

let queue;
window.onload = function() {
	window.queueables={};

	/**
	 * Setup our imported queueables here
	 */
	window.queueables['templates']=new Templates();

	queue = new Queue();

	/**
	 * Copy the queue into the global to make debug easier
	 * @type {Queue}
	 */
	window.queue=queue;
};
