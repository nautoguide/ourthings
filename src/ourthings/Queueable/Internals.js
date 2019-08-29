/** @module ourthings/Queueable/Internals */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Internal queue functions exposed to queueables
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 *
 */
export default class Internals extends Queueable {

	/**
	 * Execute a prepared queue
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.name - prepared queue to call
	 * @param {object} [json.json] - New arguments to send to queue
	 * @example
	 * internals.execute({"name":"myQueue"});
	 */
	execute(pid,json) {
		let self=this;
		self.queue.execute(json.name,json.json);
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Check a statement and run prepared queue if its true
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.statement - statement to check
	 * @param {string} json.name - prepared queue to call
	 * @param {object} [json.json] - New arguments to send to queue
	 * @example
	 * internals.ifqueue({"statement":"memory.loginAPI.value.token","name":"loggedIn"});
	 */
	ifqueue(pid,json) {
		let self=this;
		if(eval(json.statement)) {
			self.queue.execute(json.name,json.json);

		}
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Set a memory value
	 *
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.name - name of memory item
	 * @param {*} json.value - value to set (can be any type)
	 * @param {string} [json.mode] - [Garbage|Session|Permanent] Memory mode
	 * @example
	 * internals.setMemory({"name":"test","mode":"Session","value":"Test String"});
	 * internals.setMemory({"name":"test","mode":"Session","value":{"trueFalse":[true,false],"objects":[{"ElementOne":"Result One"},{"ElementTwo":"Result Two"}]}});
	 */
	setMemory(pid,json) {
		let self=this;
		self.queue.setMemory(json.name,json.value,json.mode);
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}

    /**
     * Set a register
     * @param {int} pid - process ID
     * @param {object} json - queue arguments
     * @param {string} json.name - name of memory item
     * @example
     * internals.setRegister({"name":"test"});
     */
	setRegister(pid,json) {
        let self=this;
        self.queue.setRegister(json.name);
        self.finished(pid,self.queue.DEFINE.FIN_OK);
    }

	/**
	 * Delete a memory value
	 *
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.name - name of memory item
	 * @param {*} json.value - value to set (can be any type)
	 * @param {string} [json.mode] - [Garbage|Session|Permanent] Memory mode
	 * @example
	 * internals.setMemory({"name":"test","mode":"Session","value":"Test String"});
	 * internals.setMemory({"name":"test","mode":"Session","value":{"trueFalse":[true,false],"objects":[{"ElementOne":"Result One"},{"ElementTwo":"Result Two"}]}});
	 */
	deleteMemory(pid,json) {
		this.queue.deleteMemory(json.name);
		this.finished(pid,this.queue.DEFINE.FIN_OK);

	}
}
