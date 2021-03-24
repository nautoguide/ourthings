/** @module ourthings/Queueable/Menu */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * Menu
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * menu.initMenu({"targetId":"menu1"});
 *
 */
class Menu extends Queueable {

	/**
	 * Render a template into the dom using the queues templateProcessor
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - dom id of menu
	 * @example
	 * menu.initMenu({"targetId":"menu1"});
	 */
	initMenu(pid,json) {
		let self=this;
		const options = Object.assign({
			"classModifiers":[
				{"targetId":".main-menu","class":"open-this-menu"},
				{"targetId":".page-header","clas":"open-search"}
			],
			"menuTop":"#menuTop"
		}, json);
		const element=this.queue.getElement(options.targetId);

		const menuTop=self.queue.getElement(options.menuTop);


		function menuToggle() {
			if (menuTop.getAttribute('aria-expanded') === 'true') {
				// Close
				closeMenu();
			} else {
				// Open
				for (let i in options.classModifiers) {
					const modElement = self.queue.getElement(options.classModifiers[i].targetId);
					modElement.classList.add(options.classModifiers[i].class);
				}
				menuTop.setAttribute('aria-expanded', 'true');
				menuTop.setAttribute('aria-hidden', 'false');
				window.setTimeout(function () {
					menuTop.children[0].focus();
				},0);
			}
		}
		element.addEventListener("keydown", function (e) {
			e.preventDefault();
			if(e.keyCode===13) {
				menuToggle();
			}
		});

		element.addEventListener("click", function (e) {
			menuToggle();
		});

		function closeMenu() {
			for (let i in options.classModifiers) {
				const modElement = self.queue.getElement(options.classModifiers[i].targetId);
				modElement.classList.remove(options.classModifiers[i].class);
			}
			menuTop.setAttribute('aria-expanded','false');
			menuTop.setAttribute('aria-hidden','true');
		}

			/*
			 * add the menu children click events
			 */
		for(let i=0;i<menuTop.children.length;i++) {

			menuTop.children[i].addEventListener("click", function (e) {
				clickItem();
			});
			menuTop.children[i].addEventListener("keydown", function (e) {
				if(e.keyCode===32) {
					clickItem(true,menuTop.children[i]);
				}
			});
		}

		function clickItem(keymode,element) {
			for (let i in options.classModifiers) {
				const modElement = self.queue.getElement(options.classModifiers[i].targetId);
				modElement.classList.remove(options.classModifiers[i].class);
			}
			menuTop.setAttribute('aria-expanded','false');
			/*
			 * Was this a keyboard hit? If so 'click' the element
			 */
			if(keymode) {
				element.click();
			}
		}

		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}
}

export default Menu;