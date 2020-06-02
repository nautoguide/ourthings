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
		this.ready=false;
	}

	/**
	 * init, override this for any promise based inits setting
	 * the self.ready=true after the promise
	 *
	 */
	init(queue) {
		this.queue=queue;
		this.ready=true;
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
			 * Process pointers IE *memory.foo.value
			 */
			const pointerRegex=/^\*([a-zA-Z0-9\.\[\]]*)$/;
			for(let i in json) {
				let match;
				if(match = pointerRegex.exec(json[i])) {
					//json[i]=self.queue.deepCopy(eval(match[1]));
					json[i]=eval(match[1]);
				}
			}
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
		/*
		 * a -1 pid is called via direct run and so not from our queue
		 */
		if(pid!==-1)
			self.queue.finished(pid,mode,error);
	}

	set(pid,value) {
		let self=this;
		self.queue.memory(pid,value);
	}
}

export default Queueable;