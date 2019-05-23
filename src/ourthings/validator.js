/** @module Validate */


/**
 * @classdesc
 *
 * Our validate class
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * // validate = new Validate();
 *
 */
class Validate {
	valid(item,args) {
		return true;
	}

}

class ValidateEmail extends Validate {
	valid(item,args) {
		let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(String(item).toLowerCase());
	}
}

class ValidateText extends Validate {
	valid(item,args) {
		return item.length>3;
	}
}

export {Validate,ValidateEmail,ValidateText};
