/** @module ourthings/Queueable/W3Menu */
import Queueable from "../Queueable";

/**
 * @classdesc W3C Menu implementation
 **
 * For queue intergration you can add 'data-queue' attribute to cause a menu item to run a prepared queue
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * 	w3menu.initMenu({"targetId":"#menubutton1"});
 *
 */
export default class W3Menu extends Queueable {

	/**
	 * Start the menu on assigned targetId
	 *
	 * @description W3C Menu implementation see: https://www.w3.org/TR/wai-aria-practices/examples/menu-button/menu-button-actions.html
	 *
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom target of the w3c menu html
	 *
	 * @example
	 * w3menu.initMenu({"targetId":"#menubutton1"});
	 */
	initMenu(pid,json) {
		let self=this;
		let element=self.queue.getElement(json.targetId);
		element.setAttribute("data-bound","true");
		let menubutton = new Menubutton(element);
		menubutton.init();
		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}
}

/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   Menubutton.js
*
*   Desc:   Menubutton widget that implements ARIA Authoring Practices
*/

/*
*   @constructor MenuButton
*
*   @desc
*       Object that configures menu item elements by setting tabIndex
*       and registering itself to handle pertinent events.
*
*       While menuitem elements handle many keydown events, as well as
*       focus and blur events, they do not maintain any state variables,
*       delegating those responsibilities to its associated menu object.
*
*       Consequently, it is only necessary to create one instance of
*       MenubuttonItem from within the menu object; its configure method
*       can then be called on each menuitem element.
*
*   @param domNode
*       The DOM element node that serves as the menu item container.
*       The menuObj PopupMenu is responsible for checking that it has
*       requisite metadata, e.g. role="menuitem".
*
*
*/
let Menubutton = function (domNode) {

	this.domNode   = domNode;
	this.popupMenu = false;

	this.hasFocus = false;
	this.hasHover = false;

	this.keyCode = Object.freeze({
		'TAB': 9,
		'RETURN': 13,
		'ESC': 27,
		'SPACE': 32,
		'PAGEUP': 33,
		'PAGEDOWN': 34,
		'END': 35,
		'HOME': 36,
		'LEFT': 37,
		'UP': 38,
		'RIGHT': 39,
		'DOWN': 40
	});
};

Menubutton.prototype.init = function () {

	this.domNode.setAttribute('aria-haspopup', 'true');

	this.domNode.addEventListener('keydown', this.handleKeydown.bind(this));
	this.domNode.addEventListener('click', this.handleClick.bind(this));
	this.domNode.addEventListener('focus', this.handleFocus.bind(this));
	this.domNode.addEventListener('blur', this.handleBlur.bind(this));
	this.domNode.addEventListener('mouseover', this.handleMouseover.bind(this));
	this.domNode.addEventListener('mouseout', this.handleMouseout.bind(this));

	// initialize pop up menus

	var popupMenu = document.getElementById(this.domNode.getAttribute('aria-controls'));

	if (popupMenu) {
		if (popupMenu.getAttribute('aria-activedescendant')) {
			this.popupMenu = new PopupMenuActionActivedescendant(popupMenu, this);
			this.popupMenu.init();
		}
		else {
			this.popupMenu = new PopupMenuAction(popupMenu, this);
			this.popupMenu.init();
		}
	}

};

Menubutton.prototype.handleKeydown = function (event) {
	let flag = false;

	switch (event.keyCode) {
		case this.keyCode.SPACE:
		case this.keyCode.RETURN:
		case this.keyCode.DOWN:
			if (this.popupMenu) {
				this.popupMenu.open();
				this.popupMenu.setFocusToFirstItem();
			}
			flag = true;
			break;

		case this.keyCode.UP:
			if (this.popupMenu) {
				this.popupMenu.open();
				this.popupMenu.setFocusToLastItem();
				flag = true;
			}
			break;

		default:
			break;
	}

	if (flag) {
		event.stopPropagation();
		event.preventDefault();
	}
};

Menubutton.prototype.handleClick = function (event) {
	if (this.domNode.getAttribute('aria-expanded') == 'true') {
		this.popupMenu.close(true);
	}
	else {
		this.popupMenu.open();
		this.popupMenu.setFocusToFirstItem();
	}
};

Menubutton.prototype.handleFocus = function (event) {
	this.popupMenu.hasFocus = true;
};

Menubutton.prototype.handleBlur = function (event) {
	this.popupMenu.hasFocus = false;
	setTimeout(this.popupMenu.close.bind(this.popupMenu, false), 300);

};

Menubutton.prototype.handleMouseover = function (event) {
	this.hasHover = true;
	this.popupMenu.open();
};

Menubutton.prototype.handleMouseout = function (event) {
	this.hasHover = false;
	setTimeout(this.popupMenu.close.bind(this.popupMenu, false), 300);
};

/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   MenuItem.js
*
*   Desc:   Popup Menu Menuitem widget that implements ARIA Authoring Practices
*/

/*
*   @constructor MenuItem
*
*   @desc
*       Wrapper object for a simple menu item in a popup menu
*
*   @param domNode
*       The DOM element node that serves as the menu item container.
*       The menuObj PopupMenu is responsible for checking that it has
*       requisite metadata, e.g. role="menuitem".
*
*   @param menuObj
*       The object that is a wrapper for the PopupMenu DOM element that
*       contains the menu item DOM element. See PopupMenuAction.js
*/
let PopupMenuItem = function (domNode, popupMenuObj) {

	this.domNode   = domNode;
	this.popupMenu = popupMenuObj;

	this.keyCode = Object.freeze({
		'TAB': 9,
		'RETURN': 13,
		'ESC': 27,
		'SPACE': 32,
		'PAGEUP': 33,
		'PAGEDOWN': 34,
		'END': 35,
		'HOME': 36,
		'LEFT': 37,
		'UP': 38,
		'RIGHT': 39,
		'DOWN': 40
	});
};

PopupMenuItem.prototype.init = function () {
	this.domNode.tabIndex = -1;

	if (!this.domNode.getAttribute('role')) {
		this.domNode.setAttribute('role', 'menuitem');
	}

	this.domNode.addEventListener('keydown',    this.handleKeydown.bind(this));
	this.domNode.addEventListener('click',      this.handleClick.bind(this));
	this.domNode.addEventListener('focus',      this.handleFocus.bind(this));
	this.domNode.addEventListener('blur',       this.handleBlur.bind(this));
	this.domNode.addEventListener('mouseover',  this.handleMouseover.bind(this));
	this.domNode.addEventListener('mouseout',   this.handleMouseout.bind(this));

};

/* EVENT HANDLERS */

PopupMenuItem.prototype.handleKeydown = function (event) {
	let flag = false,
		char = event.key;

	function isPrintableCharacter (str) {
		return str.length === 1 && str.match(/\S/);
	}

	if (event.ctrlKey || event.altKey  || event.metaKey) {
		return;
	}

	if (event.shiftKey) {
		if (isPrintableCharacter(char)) {
			this.popupMenu.setFocusByFirstCharacter(this, char);
		}
	}
	else {

		switch (event.keyCode) {
			case this.keyCode.SPACE:
				flag = true;
				break;

			case this.keyCode.RETURN:
				this.handleClick(event);
				flag = true;
				break;

			case this.keyCode.ESC:
				this.popupMenu.setFocusToController();
				this.popupMenu.close(true);
				flag = true;
				break;

			case this.keyCode.UP:
				this.popupMenu.setFocusToPreviousItem(this);
				flag = true;
				break;

			case this.keyCode.DOWN:
				this.popupMenu.setFocusToNextItem(this);
				flag = true;
				break;

			case this.keyCode.HOME:
			case this.keyCode.PAGEUP:
				this.popupMenu.setFocusToFirstItem();
				flag = true;
				break;

			case this.keyCode.END:
			case this.keyCode.PAGEDOWN:
				this.popupMenu.setFocusToLastItem();
				flag = true;
				break;

			case this.keyCode.TAB:
				this.popupMenu.setFocusToController();
				this.popupMenu.close(true);
				break;

			default:
				if (isPrintableCharacter(char)) {
					this.popupMenu.setFocusByFirstCharacter(this, char);
				}
				break;
		}
	}

	if (flag) {
		event.stopPropagation();
		event.preventDefault();
	}
};

PopupMenuItem.prototype.handleClick = function (event) {
	queue.execute(event.srcElement.getAttribute('data-queue'));
	this.popupMenu.setFocusToController();
	this.popupMenu.close(true);
};

PopupMenuItem.prototype.handleFocus = function (event) {
	this.popupMenu.hasFocus = true;
};

PopupMenuItem.prototype.handleBlur = function (event) {
	this.popupMenu.hasFocus = false;
	setTimeout(this.popupMenu.close.bind(this.popupMenu, false), 300);
};

PopupMenuItem.prototype.handleMouseover = function (event) {
	this.popupMenu.hasHover = true;
	this.popupMenu.open();

};

PopupMenuItem.prototype.handleMouseout = function (event) {
	this.popupMenu.hasHover = false;
	setTimeout(this.popupMenu.close.bind(this.popupMenu, false), 300);
};

/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   PopupMenuAction.js
*
*   Desc:   Popup menu widget that implements ARIA Authoring Practices
*/

/*
*   @constructor PopupMenuAction
*
*   @desc
*       Wrapper object for a simple popup menu (without nested submenus)
*
*   @param domNode
*       The DOM element node that serves as the popup menu container. Each
*       child element of domNode that represents a menuitem must have a
*       'role' attribute with value 'menuitem'.
*
*   @param controllerObj
*       The object that is a wrapper for the DOM element that controls the
*       menu, e.g. a button element, with an 'aria-controls' attribute that
*       references this menu's domNode. See MenuButton.js
*
*       The controller object is expected to have the following properties:
*       1. domNode: The controller object's DOM element node, needed for
*          retrieving positioning information.
*       2. hasHover: boolean that indicates whether the controller object's
*          domNode has responded to a mouseover event with no subsequent
*          mouseout event having occurred.
*/
let PopupMenuAction = function (domNode, controllerObj) {
	let elementChildren,
		msgPrefix = 'PopupMenu constructor argument domNode ';

	// Check whether domNode is a DOM element
	if (!domNode instanceof Element) {
		throw new TypeError(msgPrefix + 'is not a DOM Element.');
	}

	// Check whether domNode has child elements
	if (domNode.childElementCount === 0) {
		throw new Error(msgPrefix + 'has no element children.');
	}

	// Check whether domNode child elements are A elements
	let childElement = domNode.firstElementChild;
	while (childElement) {
		let menuitem = childElement.firstElementChild;
		if (menuitem && menuitem === 'A') {
			throw new Error(msgPrefix + 'Cannot have descendant elements are A elements.');
		}
		childElement = childElement.nextElementSibling;
	}

	this.domNode = domNode;
	this.controller = controllerObj;

	this.menuitems  = [];      // see PopupMenu init method
	this.firstChars = [];      // see PopupMenu init method

	this.firstItem  = null;    // see PopupMenu init method
	this.lastItem   = null;    // see PopupMenu init method

	this.hasFocus   = false;   // see MenuItem handleFocus, handleBlur
	this.hasHover   = false;   // see PopupMenu handleMouseover, handleMouseout
};

/*
*   @method PopupMenuAction.prototype.init
*
*   @desc
*       Add domNode event listeners for mouseover and mouseout. Traverse
*       domNode children to configure each menuitem and populate menuitems
*       array. Initialize firstItem and lastItem properties.
*/
PopupMenuAction.prototype.init = function () {
	let childElement, menuElement, firstChildElement, menuItem, textContent, numItems, label;

	// Configure the domNode itself
	this.domNode.tabIndex = -1;

	this.domNode.setAttribute('role', 'menu');

	if (!this.domNode.getAttribute('aria-labelledby') && !this.domNode.getAttribute('aria-label') && !this.domNode.getAttribute('title')) {
		label = this.controller.domNode.innerHTML;
		this.domNode.setAttribute('aria-label', label);
	}

	this.domNode.addEventListener('mouseover', this.handleMouseover.bind(this));
	this.domNode.addEventListener('mouseout',  this.handleMouseout.bind(this));

	// Traverse the element children of domNode: configure each with
	// menuitem role behavior and store reference in menuitems array.
	let menuElements = this.domNode.getElementsByTagName('LI');

	for (let i = 0; i < menuElements.length; i++) {

		menuElement = menuElements[i];

		if (!menuElement.firstElementChild && menuElement.getAttribute('role') != 'separator') {
			menuItem = new PopupMenuItem(menuElement, this);
			menuItem.init();
			this.menuitems.push(menuItem);
			textContent = menuElement.textContent.trim();
			this.firstChars.push(textContent.substring(0, 1).toLowerCase());
		}
	}

	// Use populated menuitems array to initialize firstItem and lastItem.
	numItems = this.menuitems.length;
	if (numItems > 0) {
		this.firstItem = this.menuitems[0];
		this.lastItem  = this.menuitems[numItems - 1];
	}
};

/* EVENT HANDLERS */

PopupMenuAction.prototype.handleMouseover = function (event) {
	this.hasHover = true;
};

PopupMenuAction.prototype.handleMouseout = function (event) {
	this.hasHover = false;
	setTimeout(this.close.bind(this, false), 300);
};

/* FOCUS MANAGEMENT METHODS */

PopupMenuAction.prototype.setFocusToController = function (command) {
	if (typeof command !== 'string') {
		command = '';
	}

	if (command === 'previous') {
		this.controller.menubutton.setFocusToPreviousItem(this.controller);
	}
	else {
		if (command === 'next') {
			this.controller.menubutton.setFocusToNextItem(this.controller);
		}
		else {
			this.controller.domNode.focus();
		}
	}
};

PopupMenuAction.prototype.setFocusToFirstItem = function () {
	this.firstItem.domNode.focus();
};

PopupMenuAction.prototype.setFocusToLastItem = function () {
	this.lastItem.domNode.focus();
};

PopupMenuAction.prototype.setFocusToPreviousItem = function (currentItem) {
	let index;

	if (currentItem === this.firstItem) {
		this.lastItem.domNode.focus();
	}
	else {
		index = this.menuitems.indexOf(currentItem);
		this.menuitems[index - 1].domNode.focus();
	}
};

PopupMenuAction.prototype.setFocusToNextItem = function (currentItem) {
	let index;

	if (currentItem === this.lastItem) {
		this.firstItem.domNode.focus();
	}
	else {
		index = this.menuitems.indexOf(currentItem);
		this.menuitems[index + 1].domNode.focus();
	}
};

PopupMenuAction.prototype.setFocusByFirstCharacter = function (currentItem, char) {
	let start, index;
	char = char.toLowerCase();

	// Get start index for search based on position of currentItem
	start = this.menuitems.indexOf(currentItem) + 1;
	if (start === this.menuitems.length) {
		start = 0;
	}

	// Check remaining slots in the menu
	index = this.getIndexFirstChars(start, char);

	// If not found in remaining slots, check from beginning
	if (index === -1) {
		index = this.getIndexFirstChars(0, char);
	}

	// If match was found...
	if (index > -1) {
		this.menuitems[index].domNode.focus();
	}
};

PopupMenuAction.prototype.getIndexFirstChars = function (startIndex, char) {
	for (let i = startIndex; i < this.firstChars.length; i++) {
		if (char === this.firstChars[i]) {
			return i;
		}
	}
	return -1;
};

/* MENU DISPLAY METHODS */

PopupMenuAction.prototype.open = function () {
	// get bounding rectangle of controller object's DOM node
	let rect = this.controller.domNode.getBoundingClientRect();

	// set CSS properties
	this.domNode.style.display = 'block';
	this.domNode.style.position = 'absolute';
	//this.domNode.style.top  = rect.height + 'px';
	//this.domNode.style.left = '0px';

	// set aria-expanded attribute
	this.controller.domNode.setAttribute('aria-expanded', 'true');
};

PopupMenuAction.prototype.close = function (force) {
	if (typeof force !== 'boolean') {
		force = false;
	}

	if (force || (!this.hasFocus && !this.hasHover && !this.controller.hasHover)) {
		this.domNode.style.display = 'none';
		this.controller.domNode.removeAttribute('aria-expanded');
	}
};