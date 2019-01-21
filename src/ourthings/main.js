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

/*
 * Start the queue engine
 */
let queue = new Queue({"internals":Internals,"templates":Templates,"elements":Elements,"api":Api,"openlayers":Openlayers,"browser":Browser});

/*
 * If you want debug put the queue into the window
 */
window.queue=queue;
