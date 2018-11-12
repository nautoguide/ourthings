/** @module ourthings/Queueable */

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
class Queueable {

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
		if(self[command]&&typeof self[command] === 'function') {

			/*
			 * Pass the json through the var processor
			 */

			json=JSON.parse(self.queue.templateVars(JSON.stringify(json)));
			/*
			 * Execute
			 */
			self[command](pid, json);
		} else {
			self.queue.finished(pid,self.queue.DEFINE.FIN_ERROR,'No such command ['+command+']');
		}
	}

	/**
	 * Call this method after you command has finished. Failure to do so will result is
	 * a stalled queue
	 * @param pid
	 * @param mode
	 */
	finished(pid,mode,error='') {
		let self=this;
		self.queue.finished(pid,mode,error);
	}

	set(pid,value,name) {
		let self=this;
		self.queue.memory(pid,value,name);
	}
}

export default Queueable;