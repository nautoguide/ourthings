import Queue from './Queue';

/**
 *  Import all the queueables we want to use here. Make sure to add an entry to to new queue to map the commands
 *
 */
import Internals from './Queueable/Internals';
import Templates from './Queueable/Templates';
import Elements from './Queueable/Elements';
import Api from './Queueable/Api';
import Openlayers from './Queueable/Openlayers';
import Browser from './Queueable/Browser';
import W3Menu from './Queueable/W3Menu';
import Mapbox from "./Queueable/Mapbox";
import Markdown from "./Queueable/Markdown";

/*
 * Start the queue engine
 */
let queue;
/*
 * Wait until the dom is loaded (IE11 will not have the dom in place before it starts running scripts
 */
document.addEventListener("DOMContentLoaded", function(event) {
	queue = new Queue({
		"internals": Internals,
		"templates": Templates,
		"elements": Elements,
		"api": Api,
		"openlayers": Openlayers,
		"browser": Browser,
		"w3menu": W3Menu,
		"mapbox" : Mapbox,
		"markdown": Markdown
	});
	window.queue = queue;
});
