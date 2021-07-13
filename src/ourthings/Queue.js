/** @module ourthings/Queue */
import Define from './Define.js';
import * as consoleBadge from 'console-badge';
import Memory from "./Memory";
import Language from "./Language";

/**
 * @classdesc
 *
 * The main queue class
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * let queue = new Queue();
 */
class Queue {

	/**
	 * Class constructor
	 */
	constructor(queueablesList,domain) {
		let self = this;
		let calcDomain=window.location.hostname;
		domain=domain||calcDomain;
		self.domain=domain;
		/*
		 * Create our DEFINE object for
		 * @type {Define}
		 */
		self.DEFINE = new Define();
		/*
		 * Our Queue array
		 *
		 * @type {Array}
		 */
		self.queue = {};

		/*
		 * Our events (queues) which can be called by name
		 */
		self.prepare = {};


		/*
		 * Queueable items object
		 */
		self.queueables = {};
		/*
		 * Templates to be loaded
		 * @type {Array}
		 */
		self.templates = [];

		/*
		 * Register lists
		 */
		self.registers = [];

		/*
		 * Create a fragment for big dom inserts
		 * @type {DocumentFragment}
		 */
		self.fragment = document.createDocumentFragment();

		/*
		 * Se our status
		 * @type {number}
		 */
		self.status = self.DEFINE.STATUS_LOADING;

		/*
		 * Our queue process ID
		 * @type {number}
		 */
		self.pid = 0;
		self.runningPid = -1;

		/*
		 * Our unique bind ids
		 */
		self.ucid = 0;

		/*
		 * When processing out loops this keeps a track
		 */
		self.activeLoops = [];


		/*
		 * Language support
		 */

		self.language=false;

		/*
		 * Default time for process to be executed after
		 * TODO Platform test / tune
		 * @type {number}
		 */
		self.defaultTimer = 10;

		/*
		 * Dev mode?
		 */

		self.developerMode = false;

		//console.clear();
		consoleBadge.log({
			mode: 'shields.io',
			leftText: 'ourthings framework',
			rightText: 'https://github.com/nautoguide/ourthings 🚀',
			rightBgColor: '#ffc107',
			rightTextColor: '#1a1a1a'
		});
		/*
		 * Listener for our chrome-plugin
		 */
		document.addEventListener('ourthings_site', function (e) {
			switch (e.detail.function) {
				case 'ping':
					document.dispatchEvent(new CustomEvent('ourthings_extension', {
						detail: {"function": "pong"}
					}));
					break;
				case 'menu':
					self.menu();
					break;
			}
		});

		self.browserClasses();

		/*
		 * Run init against all our queueables
		 *
		 * This basically passes the queue object (self) though but also for any queueables that require it
		 * starts any promise functions that will result in them becoming active
		 */
		for (let i in queueablesList) {
			self.checkQueueable(i, queueablesList[i]);
		}

		/*
		 * Initialise the memory
		 */
		window.memory = {};

		/*
		 * Load any perm cookies
		 */
		self._loadMemoryPerms();
		if (window.memory.developer && window.memory.developer.value === true)
			self.developerMode = true;
		/*
		 * Load any url params into memoery
		 */

		const urlParams=self.urlToJson();
		// Legacy method
		self.setMemory("urlParams", urlParams, "Session");
		// Pass them into memory
		for(let i in urlParams) {
			self.setMemory(i, urlParams[i], "Session");
		}

		/*
		 * Enable language support?
		 */

		let attr= self.getElement("script[data-lang]", false);
		if(attr) {
			let langFile=attr.getAttribute("data-lang");
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Booting',
				rightText: "Language support",
				rightBgColor: '#ffc107',
				rightTextColor: '#1a1a1a'
			});
			fetch(langFile, {
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(response => self.handleFetchErrors(response))
				.then(response => response.json())
				.then(function (response) {
					/**
					 * Convert the response to json and start the loader
					 */
					self.language= new Language(response);
					bootTemplates();
				})
				.catch(function (error) {
					self.reportError(error, 'Warning this error is fatal, I could not load your language file');
				});
		} else {
			bootTemplates();
		}


		function bootTemplates() {
			/*
			 * Load the templates.json
			 *
			 * This can now be specified by data-templates on the script include
			 */
			let templateInclude = "templates.json";

			let attr = self.getElement("script[data-templates]", false);
			if (attr && attr.getAttribute("data-templates")) {
				templateInclude = attr.getAttribute("data-templates");
			}

			fetch(templateInclude, {
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(response => self.handleFetchErrors(response))
				.then(response => response.json())
				.then(function (response) {
					/**
					 * Convert the response to json and start the loader
					 */
					self.templates = response;
					self.templateLoader();
				})
				.catch(function (error) {
					self.reportError(error, 'Warning this error is probably fatal as I have no templates to load');
				});
		}
	}

	/**
	 * Error Handler for fetch calls
	 * @param response {object} - Fetch response object
	 * @returns {Object}
	 */
	handleFetchErrors(response) {
		let self = this;
		if (!response.ok) {
			self.status = self.DEFINE.STATUS_ERROR;
			throw Error(response.statusText);
		}
		return response;
	}

	checkQueueable(name, obj) {
		let self = this;
		if (self.queueables[name] === undefined) {
			self.queueables[name] = new obj();
			self.queueables[name].init(self);
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Booting',
				rightText: name,
				rightBgColor: '#ffc107',
				rightTextColor: '#1a1a1a'
			});
			return false;
		}
		return true;
	}

	/**
	 * Helper function to upcase first letter of string
	 * @param string
	 * @return {string}
	 */
	capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	/**
	 * Loads templates from the template stack. Recursively calls self until stack is empty
	 * @returns {void}
	 */
	templateLoader() {
		let self = this;

		/*
		 * Version check as we changed the format
		 */
		if (this.templates.version < 1.0) {
			self.reportError("Template file has no version, expecting >=1.0", "Warning this error is probably fatal as I have no templates to load");
			return;
		}
		/*
		 *  Are there any templates to load?
		 *
		 *  If not then we dump the fragment into the dom
		 */
		if (this.templates.templates.length === 0) {
			document.head.appendChild(self.fragment);
			// Clean up the fragment
			self.fragment = document.createDocumentFragment();
			/*
			 * Set our status and then process the init template
			 */
			self.status = self.DEFINE.STATUS_LOADED;
			/*
			 * Detach the init template loader from this stack chain
			 *
			 * We do this because a fail in a subsequent template will register as an error in the fetch catch method
			 * which is misleading
			 */
			setTimeout(function () {
				self.templateProcessor("#init", false);
			}, 100);

			self.status = self.DEFINE.STATUS_RUNNING;
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Online',
				rightText: 'queue.show(); # To debug the queue',
				rightBgColor: '#ffc107',
				rightTextColor: '#1a1a1a'
			});
			if (self.developerMode === true) {
				consoleBadge.log({
					mode: 'shields.io',
					leftText: 'DEVELOPER MODE',
					rightText: 'Enabled',
					rightBgColor: '#ffc107',
					rightTextColor: '#1a1a1a'
				});
			}
			return;
		}

		/*
	    * Pop the template off the stack
	    */
		let template = this.templates.templates.pop();
		if (typeof template === "string") {
			template = {"url": template, "type": "text/html"}
		}

		/*
		 * Is there a cache?
		 */
		if (this.templates.cache && self.developerMode !== true) {
			template = this.templates.cache;
			this.templates.templates = [];
		}

		fetch(template.url, {
			headers: {
				'Content-Type': template.type
			},
			mode: 'cors',
			credentials: 'same-origin'
		})
			.then(response => self.handleFetchErrors(response))
			.then(response => response.text())
			.then(function (response) {

				/*
				 * Get the template we were sent and add it to the fragment for insertion into the dom
				 *
				 * We wrap it in meta tag, this helps improve render speed but still stuck with an innerHTML
				 * as we don't know the content
				 *
				 */
				let text = response;
				/*
				 * Remove any html comments as they will slow down processing later on
				 */
				text = text.replace(/<!--([\s\S]*?)-->/g, '');

				let meta = document.createElement('meta');
				meta.setAttribute("name", "generator");
				meta.setAttribute("content", template.url);
				if (template.type === 'text/css')
					meta.innerHTML = `<style>${text}</style>`;
				else
					meta.innerHTML = text;
				self.fragment.appendChild(meta);

				/*
				 *  Call our self again to process any more templates
				 */
				self.templateLoader();
			})
			.catch(function (error) {
				console.error('Error:', error);
				console.info("Warning this error is probably fatal as a template specified in templates.json has failed to load or wont process");
			});
	};

	/**
	 * Template processor
	 * Takes a template, process it and places into the dom
	 * @param templateId {string} - ID of the template
	 * @param targetId {string|false} - Place in the dom the put the result. In the event of false we process without dom
	 * @return {boolean|string} - success status
	 */
	templateProcessor(templateId, targetId, mode) {
		let self = this;
		let commands = [];
		mode = mode || self.DEFINE.RENDER_INSERT;

		let templateDom = self.getElement(templateId);
		if (!templateDom) {
			self.reportError('No valid template', 'I have no valid template, check the templateId [' + templateId + ']');
			return false;
		}
		let targetDom = undefined;
		let templateHTML = templateDom.innerHTML;

		const startTime=Date.now();
		if(self.developerMode)
			console.log(`template ${templateId}`);
		/*
		 * Pass all out tags {{ }} First
		 *
		 * TODO we need to split this so only loop etc is done first, then pass to templateParse then parse
		 * out {{eval}} when the command queues are gone to prevent executing too early
		 */
		let parsedTemplate = self.templateVars(templateHTML);
		const parseTime=Date.now();
		/*
		 * now pass to the templateParse to build our commands
		 */
		parsedTemplate = self.templateParse(parsedTemplate, commands);
		const commandTime=Date.now();

		if (targetId === "return")
			return parsedTemplate;


		if (targetId !== false) {
			targetDom = self.getElement(targetId);
			if (!targetDom) {
				self.reportError('No valid target', 'I have no valid target to render the template [' + templateId + '] to, check the targetId [' + targetId + ']');
				return false;
			}
			self.renderToDom(targetDom, parsedTemplate, mode);

		}
		const domTime=Date.now();

		self.commandsBind(commands);
		const bindTime=Date.now();

		if(self.developerMode) {
			console.log(`Parse: ${(parseTime-startTime)/1000} Command: ${(commandTime-startTime)/1000} Dom: ${(domTime-startTime)/1000} Bind: ${(bindTime-startTime)/1000}`);
		}
		return true;
	}

	/**
	 * Process the template looking for {{}} instances
	 * @param template
	 * @return {*}
	 */
	templateVars(template) {
		let match;
		let self = this;
		/*
		 * Fix any multi level loop references
		 */

		for (let i in self.activeLoops) {
			let loopRegex = new RegExp("#loop" + i, "g");
			let incrementRegex = new RegExp("#increment" + i, "g");
			template = template.replace(loopRegex, memory['for' + i].value.index);
			template = template.replace(incrementRegex, memory['for' + i].value.increment);
		}


		/*
		 * Look for {{#for}} loops and execute them
		 */
		const forRegex = /{{#([0-9]{0,1})for (.*?)}}([\s\S]*?){{\/for}}/;
		while (match = forRegex.exec(template)) {
			let subTemplate = '';
			match[1] = match[1] || 0;
			self.activeLoops.push(match[1]);
			/*
			 * loop through making sub templates as we go
			 *
			 * NOTE: you will notice that all index methods use 0 at the end. This is to allow
			 * for the future when we implement for loops in for loops.
			 */
			let increment = 0;
			for (let i in eval(match[2])) {
				/*
				 * Set a memory 'for0' containing the index. This is an object as in the future it
				 * may be expanded to contain other info.
				 */
				this.setMemory("for" + match[1], {"index": i, "increment": increment}, "session");
				/*
				 * This is the quick way to reference in the index using #loop[n]
				 */
				let loopRegex = new RegExp("#loop" + match[1], "g");
				let incrementMatch = match[3].replace(loopRegex, i);
				/*
				 * Process the template
				 */
				subTemplate += self.templateVars(incrementMatch, i);
				increment++;
			}
			template = template.replace(match[0], subTemplate);
			self.activeLoops.shift();
		}
		/*
	 	 * Process {{#if}}
	 	*/
		const ifRegex = /{{#if (.*?)}}([\s\S]*?){{\/if}}/;
		while (match = ifRegex.exec(template)) {
			const elseRegex = /{{#if .*?}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g;
			let ifResult = match[2];
			let elseResult = '';
			let elseMatch = elseRegex.exec(match[0]);
			if (elseMatch) {
				ifResult = elseMatch[1];
				elseResult = elseMatch[2];
			}
			try {
				if (eval(match[1]))
					template = template.replace(match[0], self.templateVars(ifResult));
				else
					template = template.replace(match[0], self.templateVars(elseResult));
			} catch (e) {
				consoleBadge.log({
					mode: 'shields.io',
					leftText: 'Failed to eval',
					rightText: match[1],
					rightBgColor: '#ff4d4d',
					rightTextColor: '#1a1a1a'
				});
				template = template.replace(match[0], '');
			}
		}

		/*
		 * Look for any includes to directly inject templates
		 */
		const includeRegex = /{{#include (.*?)}}/;
		while (match = includeRegex.exec(template)) {
			template = template.replace(match[0], self.templateVars(self.getElement(eval(match[1])).innerHTML));
		}

		/*
		 * Process any other {{}} tags but not if they have {{!}} as those are done on command exec time
		 */
		const commandRegex = /{{([^!|~](.|\n)*?)}}/;
		while (match = commandRegex.exec(template)) {
			if (match[1][0] === '^')
				template = template.replace('"' + match[0] + '"', self.varsParser(match[1].substring(1, match[1].length)));
			else
				template = template.replace(match[0], self.varsParser(match[1]));
		}
		return template;
	}

	/**
	 * Process a json object and replace {{!}} tags + # tags
	 * @param json
	 * @return {any}
	 */
	jsonVars(json) {
		let self = this;
		json = JSON.stringify(json);
		let match;

		/*
		 * Specials #pid
		 */

		const pidRegex = /\#pid/;
		while (match = pidRegex.exec(json)) {
			json = json.replace(match[0], self.runningPid);
		}

		/*
		 * Specials #stack
		 */

		const stackRegex = /\#stack/;
		while (match = stackRegex.exec(json)) {
			json = json.replace(match[0], `queue.queue[${self.runningPid}].stack`);
		}

		/*
		 * {{!}} tags
		 */

		const commandRegex = /{{(![\^]{0,1})(.*?)}}/;
		while (match = commandRegex.exec(json)) {
			if (match[1] === '!^')
				json = json.replace('"' + match[0] + '"', self.varsParser(match[2]));
			else
				json = json.replace(match[0], self.varsParser(match[2]));
		}
		let jsonReturn = {};
		try {
			jsonReturn = JSON.parse(json);
		} catch (e) {
			self.reportError("Can not parse JSON [" + json + "]", "This error is probably fatal, check your templates");

		}
		return jsonReturn;
	}

	/**
	 * parse a var string
	 *
	 * TODO This is massively insecure. If as user can input {{}} into a form and have it displayed
	 * to other users they can take over. We either clean all input as you would with <script> etc tags or we
	 * manually write a parser.
	 *
	 * @param parseString
	 * @return {any}
	 */
	varsParser(parseString) {
		let ret = undefined;
		try {
			ret = eval(parseString);
		} catch (e) {
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Cant resolve',
				rightText: parseString,
				rightBgColor: '#ff4d4d',
				rightTextColor: '#1a1a1a'
			});
		}
		return ret;
	}

	/**
	 * Takes a template and runs any template commands contained in it to create a HTML template
	 * ready to be put into the dom
	 *
	 * @param template {string}
	 * @return {string}
	 */
	templateParse(template, commands) {
		let commandRegex = /[@\-]([a-zA-Z0-9]*?\.[a-zA-Z0-9]*?\((.|\n)*?(\);))/;
		let match = undefined;
		let parentCommand;
		let isParent;
		let self = this;
		/*
		 *  Locate all the commands in the template and generate an array of command objects that
		 *  are linked by a reference into the template
		 */
		while (match = commandRegex.exec(template)) {
			isParent = match[0][0] === '@';
			/*
			 * Generate this command object from the extracted string
			 */
			let command = self.commandParse(match[1], isParent);

			// Bad command queue
			if(command===undefined) {
				return 'Template parse failed';
			}
			/*
			 *  In the case of an instant or sub run we don't need to leave anything in the DOM so nuke
			 */
			if (command.options.queueRun === self.DEFINE.COMMAND_INSTANT || command.options.queueRun === self.DEFINE.COMMAND_SUB || command.options.queuePrepare || command.options.queueBindTarget) {
				template = template.replace(match[0], "");
			} else {
				template = template.replace(match[0], "data-queueable=\"CMD" + command.ucid + "\"");
			}
			/*
			 *  Is this a @parent or a -child?
			 */
			if (isParent) {
				// Set the parent point to current position
				parentCommand = commands.length;

				commands.push(command);
			} else {
				// If the parent has just been created it won't have child structure
				if (commands[parentCommand].commands === undefined) {
					commands[parentCommand].commands = [];
				}
				// Put the command in the parents
				commands[parentCommand].commands.push(command);
			}
		}
		// Add the instants to the active queue
		self.commandsQueue(commands);
		return template;
	}

	/**
	 * Bind the events to the dom based on the command Object
	 * @param commandObj
	 */
	commandsBind(commandObj) {
		let self = this;
		for (let command in commandObj) {
			/*
			 * Bind queue elements will not me marked to run instantly so we pick those
			 */
			if (commandObj[command].options.queueRun !== self.DEFINE.COMMAND_INSTANT) {
				/*
				 * Find its dom entry using the selector we added
				 */
				let element;
				if (commandObj[command].options.queueBindTarget)
					element = self.getElement(commandObj[command].options.queueBindTarget);
				else
					element = self.getElement("[data-queueable=CMD" + commandObj[command].ucid + "]", false);
				if (element !== false) {
					/*
					 * Add the event. We flip it over to an instant event now because we want
					 * it triggered.
					 *
					 * The user may have specified an event and if so it will be a comma separated list
					 */
					let event = commandObj[command].options.queueEvent || "click";
					let events = event.split(",");

					for (let e in events) {
						if (events[e] === 'keydown') {
							element.addEventListener(events[e], function (e) {
								let codes = [self.DEFINE.KEY_RETURN];
								if (commandObj[command].options.queueEventCodes)
									codes = commandObj[command].options.queueEventCodes;
								if (codes.indexOf(e.keyCode) !== -1||codes==="*") {
									if( (commandObj[command].options.queueEventCtrlKey===undefined||e.ctrlKey===commandObj[command].options.queueEventCtrlKey) && (commandObj[command].options.queueEventShiftKey===undefined||e.shiftKey===commandObj[command].options.queueEventShiftKey)  ) {
										commandObj[command].options.queueRun = self.DEFINE.COMMAND_INSTANT;
										self.commandsQueue.apply(self, [[commandObj[command]]]);
									}
								}
							});
						} else {
							element.addEventListener(events[e], function (e) {
								e.stopPropagation();
								e.preventDefault();
								if(commandObj[command].options.queueButtonDisable===true) {
									element.disabled=true;
								}
								commandObj[command].options.queueRun = self.DEFINE.COMMAND_INSTANT;
								self.commandsQueue.apply(self, [[commandObj[command]]]);
							});
						}
					}
				}
			}
		}

	}

	/**
	 * Take the commands array with command objects in it and add them to the queue *if* they are
	 * marked as instant. IE ready to execute
	 *
	 * @param commandObj
	 */
	commandsQueue(commandObj) {
		let self = this;
		for (let command in commandObj) {
			/*
			 * Init the stack
			 */
			commandObj[command].stack = {};
			/*
			 * DEFINE.COMMAND_INSTANT, basically a queue item we need to get running
			 */
			if (commandObj[command].options.queueRun === self.DEFINE.COMMAND_INSTANT) {
				self.queue[self.pid] = self.deepCopy(commandObj[command]);
				self.pid++;
			}
			/*
			 * Is the a prepare queue that will be triggered at some later stage
			 */
			if (commandObj[command].options.queuePrepare !== undefined) {
				self.prepare[commandObj[command].options.queuePrepare] = self.deepCopy(commandObj[command]);
				if (commandObj[command].options.queueRun == self.DEFINE.COMMAND_INSTANT) {
					consoleBadge.log({
						mode: 'shields.io',
						leftText: 'Running Prepared Queue',
						rightText: commandObj[command].options.queuePrepare,
						rightBgColor: '#aeff79',
						rightTextColor: '#1a1a1a'
					});
				} else {
					consoleBadge.log({
						mode: 'shields.io',
						leftText: 'Added Prepared Queue',
						rightText: commandObj[command].options.queuePrepare,
						rightBgColor: '#ffef6c',
						rightTextColor: '#1a1a1a'
					});
				}

			}
		}
		/*
		 *  Trigger a queue process
		 */
		self.queueProcess();
	}

	/**
	 * Execute a queue that is loaded into prepare
	 *
	 * @param prepareName {string} Name of the prepared queue
	 * @param json {object}
	 * @param silentFail {boolean}
	 */
	execute(prepareName, json, silentFail) {
		let self = this;
		if (self.prepare[prepareName] !== undefined) {
			if(!self.prepare[prepareName].options.queueStatement || eval(self.prepare[prepareName].options.queueStatement)) {
				/*
				 * Take a copy of the prepared command as we need to alter it
				 * and possibly pass new params then add it to the queue
				 */
				let dereferenceCommand = self.deepCopy(self.prepare[prepareName]);
				dereferenceCommand.options.queueRun = self.DEFINE.COMMAND_INSTANT;
				if (json !== undefined)
					dereferenceCommand.json = Object.assign(dereferenceCommand.json, json);
				self.commandsQueue.apply(self, [[dereferenceCommand]]);
				return true;
			} else {
				return false;
			}
		} else {
			if (silentFail !== true)
				self.reportError("Can not execute prepare [" + prepareName + "]", "The prepared queue you requested does not exist");
			return false;
		}

	}

	/**
	 * Force a queue processing
	 *
	 * This launches the actual objects using a timeout
	 *
	 * @param sync {boolean} - Send true to force sync mode (Really only for test mode)
	 */
	queueProcess(sync) {
		let self = this;
		/*
		 *  TODO Only implementing basic queue here for testing. Concepts of active componets etc need importing
		 *  for moho
		 */
		for (let item in self.queue) {
			/*
			 *  Look for items that are QUEUE_ADDED as they need processing
			 *
			 */
			if (self.queue[item].state === self.DEFINE.QUEUE_ADDED) {
				/*
				 * Does this queueable exist?
				 */
				if (self.queueables[self.queue[item].queueable]) {

					/*
					 * Check if we have any registers that need setting
					 */

					if (!self.queue[item].options.queueRegister || (self.queue[item].options.queueRegister && self.registers.indexOf(self.queue[item].options.queueRegister) !== -1)) {

						/*
						 * do we have a prefilter statement?
						 */

						if(!self.queue[item].options.queueStatement || eval(self.queue[item].options.queueStatement)) {
							/*
							 * Is it online? If not we fail silently as it may come online later
							 */
							if (self.queueables[self.queue[item].queueable].ready) {
								/*
								 * Update our state to be running
								 */
								self.queue[item].state = self.DEFINE.QUEUE_RUNNING;
								/*
								 * Assign a pid
								 */
								if (self.queue[item].pid === undefined) {
									self.queue[item].pid = item;
								}
								/*
								 * Check if any specific timing is needed
								 */
								self.queue[item].options.queueTimer = self.queue[item].options.queueTimer || self.defaultTimer;

								/*
								 *  Launch the function as a time out (so we get control back)
								 */

								if (sync) {
									self.runningPid = item;
									self.queueables[self.queue[item].queueable].start.apply(self.queueables[self.queue[item].queueable], [self.queue[item].pid, self.queue[item].command, self.jsonVars(self.queue[item].json), self]);
								} else {
									setTimeout(function () {
										self.runningPid = item;
										self.queueables[self.queue[item].queueable].start.apply(self.queueables[self.queue[item].queueable], [self.queue[item].pid, self.queue[item].command, self.jsonVars(self.queue[item].json), self]);
									}, self.queue[item].options.queueTimer);
								}
							}
						}
					}
				} else {
					self.reportError("Can not find queueable [" + self.queue[item].queueable + "]", "Have you added it to the build?");
				}
			}
		}
	}

	/**
	 * Find a queue item by searching for its PID
	 * @param pid
	 * @return {*}
	 */
	findQueueByPid(pid) {
		let self = this;
		for (let item in self.queue) {
			if (self.queue[item].pid === pid) {
				return self.queue[item];
			}
		}
		return false;
	}

	/**
	 * Called by queueables to add something to our memory stack
	 * @param name
	 * @param value
	 * @param pid
	 */
	memory(pid, value) {
		let self = this;
		let command = this.findQueueByPid(pid);
		if (command) {
			let origin = command.options.memoryName || command.queueable + '.' + command.command;
			let mode = self.DEFINE.MEMORY_GARBAGE;
			if (command.options.memoryMode)
				mode = command.options.memoryMode;
			let memoryDetails = new Memory(pid, mode, origin, value);
			window.memory[origin] = memoryDetails;
			return true;
		} else {
			if(pid!==-1)
				this.reportError("Could not set memory", "The memory set for pid [" + pid + "] could not be found");
			return false;
		}
	}

	/**
	 * Set a queue stack item
	 * @param pid
	 * @param name
	 * @param value
	 * @return {boolean}
	 */
	setStack(pid, name, value) {
		let command = this.findQueueByPid(pid);
		command.stack[name] = value;
		return true;
	}

	/**
	 * Set memory that is not associated with a running queueable (IE from the templates)
	 * @param name
	 * @param value
	 * @param mode
	 * @return {boolean}
	 */
	setMemory(name, value, mode) {
		let self = this;
		mode = mode || self.DEFINE.MEMORY_GARBAGE;
		let memoryDetails = new Memory(-1, mode, 'User', value);
		window.memory[name] = memoryDetails;
		// Are we updating perms? If so we need to sync them
		if (mode == self.DEFINE.MEMORY_PERMANENT)
			self._updateMemoryPerms();
		return true;
	}

	/**
	 * Set a register
	 * @param name
	 * @returns {boolean}
	 */
	setRegister(name) {
		if (this.registers.indexOf(name) === -1) {
			this.registers.push(name);
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Register set',
				rightText: name,
				rightBgColor: '#69ddff',
				rightTextColor: '#1a1a1a'
			});
		} else {
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Register already set',
				rightText: name,
				rightBgColor: '#69ddff',
				rightTextColor: '#1a1a1a'
			});
		}
		this.queueProcess();
		return true;
	}

	/**
	 * delete a register
	 * @param name
	 * @returns {boolean}
	 */
	deleteRegister(name) {
		if (this.registers.indexOf(name) !== -1) {
			this.registers.splice(this.registers.indexOf(name), 1);
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Register deleted',
				rightText: name,
				rightBgColor: '#ffef6c',
				rightTextColor: '#1a1a1a'
			});
		} else {
			consoleBadge.log({
				mode: 'shields.io',
				leftText: 'Register does not exist for delete',
				rightText: name,
				rightBgColor: '#ff313e',
				rightTextColor: '#1a1a1a'
			});
		}
		this.queueProcess();
		return true;
	}

	/**
	 * Delete Memory TODO clean up perms
	 * @param name
	 * @return {boolean}
	 */
	deleteMemory(name) {
		delete window.memory[name];
		this._updateMemoryPerms();
		return true;
	}

	/**
	 * Flush any permanent memory to cookies
	 * @private
	 */
	_updateMemoryPerms() {
		let self = this;
		let perms = [];
		let date = new Date();
		date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
		let expires = "; expires=" + date.toUTCString();
		for (let i in window.memory) {
			if (window.memory[i].mode === self.DEFINE.MEMORY_PERMANENT) {
				self.setCookie('OT_' + i, window.memory[i]._store());
				perms.push(i);
			}
		}
		self.setCookie('OT_INDEX', window.btoa(JSON.stringify(perms)));
	}

	/**
	 * Load perm memory items from cookies
	 * @private
	 */
	_loadMemoryPerms() {
		let self = this;
		let index = self.getCookie("OT_INDEX");
		if (index !== null) {
			try {
				index = JSON.parse(window.atob(index));
				for (let i in index) {
					let perm = JSON.parse(decodeURIComponent(escape(window.atob(self.getCookie("OT_" + index[i])))));
					window.memory[index[i]] = new Memory(perm.pid, perm.mode, perm.origin, perm.value);
				}
			} catch (e) {
				console.error('OT_INDEX seems corrupted');
			}
		}

	}

	/**
	 * Retrieve a cookie by name
	 * @param name - Cookie name
	 * @returns {*}
	 */
	getCookie(name) {
		let nameEQ = name + "=";
		let ca = document.cookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
		}
		return null;
	}

	/**
	 * set a cookie by name and value
	 * @param name - Cookie name
	 * @param value - Value of cookie
	 * @returns {*}
	 */
	setCookie(name, value,time) {
		let self=this;
		let date = new Date();
		time=time||(7 * 24 * 60 * 60 * 1000)
		date.setTime(date.getTime() + time);
		const secure = window.location.href.match(/https\:\/\//i);
		const cookieString = `${name}=${value};expires=${date.toUTCString()};domain=${self.domain}; path=/;${(secure !== null ? 'Secure;' : '')} SameSite=Strict`;
		//console.log(cookieString)
		document.cookie = cookieString;
	}

	/**
	 * Called at the end of a queue run to flush any garbage
	 * @param pid
	 */
	cleanMemory(pid) {
		let self = this;
		for (let i in window.memory) {
			if (window.memory[i].pid === pid && window.memory[i].mode === self.DEFINE.MEMORY_GARBAGE) {
				window.memory[i] = {};
				delete window.memory[i];
			}
		}

	}


	/**
	 * Is there any work to do in the queue?
	 */
	isWork() {
		let self = this;
		let count = 0;
		for (let item in self.queue) {
			if (self.queue[item].state !== self.DEFINE.QUEUE_FINISHED && self.queue[item].state !== self.DEFINE.QUEUE_ERROR)
				count++;
		}
		return count;
	}

	/**
	 *  Clean up any finished queues
	 */
	cleanQueue() {
		for (let item in this.queue) {
			if (this.queue[item].state === this.DEFINE.QUEUE_FINISHED) {
				delete this.queue[item];
			}
		}
	}

	/**
	 *  Called to flag a queue item as finished
	 *
	 *  Normally hooked down from queueable this is a queue item saying I have finished in mode (see define.js)
	 *
	 * @param pid
	 * @param mode
	 */
	finished(pid, mode, error) {
		let self = this;

		self.queue[pid].error = error;
		if (self.queue[pid].state === self.DEFINE.QUEUE_RUNNING) {
			/*
			 * Did the command return an error? If so we will stop this queue from further execution
			 */
			if (mode == self.DEFINE.FIN_ERROR) {
				self.queue[pid].state = self.DEFINE.QUEUE_ERROR;
				self.reportError(error, 'The queueable [' + pid + '] has errored, queue put on hold');
				return;
			}
			/*
			 * Was there a warning?. This isn't serious so we just mention it to the console
			 */
			if (mode == self.DEFINE.FIN_WARNING) {
				console.log('Warning: ' + error);
			}
			/*
			 *
			 * Check if this queue has commands left
			 */
			if (self.queue[pid].commands !== undefined && self.queue[pid].commands.length > 0) {
				/*
				 * Move the next item in the queue down
				 */
				self.queue[pid].command = self.queue[pid].commands[0].command;
				self.queue[pid].queueable = self.queue[pid].commands[0].queueable;
				self.queue[pid].json = self.queue[pid].commands[0].json;
				self.queue[pid].options = self.queue[pid].commands[0].options;
				self.queue[pid].commands.shift();
				/*
				 *  Update the pid
				 *  TODO remove this as queues need to maintain their Pid for memory
				 */
				//self.queue[item].pid=self.pid;
				//self.pid++;
				self.queue[pid].state = self.DEFINE.QUEUE_ADDED;
				/*
				 * Start the queue processor as we just posted a new command
				 */
				self.queueProcess();
			} else {
				self.queue[pid].state = self.DEFINE.QUEUE_FINISHED;
				self.cleanMemory(self.queue[pid].pid);
				self.cleanQueue();
			}
			return;
		} else {
			self.reportError('Cant stop an already stopped process [' + pid + ']', 'Queue is corrupted');
			return;
		}

	}

	/**
	 * This will take a command string in the format object.command({},{}); and split it down
	 * into it parts as an object
	 *
	 * TODO no concept of the context of the command IE was it from inside a div that need binding?
	 * @param command {string}
	 * @return {object}
	 */
	commandParse(command, isParent) {
		let self = this;
		let commandObject = {"ucid": ++self.ucid};
		// Find the actual command
		let commandArray = command.match(/(.*?)\(/)[1].split('.');
		commandObject.queueable = commandArray[0];
		commandObject.command = commandArray[1];
		// Strip as we go to make follow up regex easier
		command = command.replace(/.*?\(/, '[');
		// Find first json arg

		command = command.replace(/\);$/m, ']');
		let jsonArray=[];
		try {
			jsonArray = JSON.parse(command);
		} catch (e) {
			self.reportError('Command parser cant decode json',e);
			console.log(command);
			return undefined;
		}
		if (jsonArray[0]) {
			commandObject.json = jsonArray[0];
		} else {
			commandObject.json = {};
		}

		if (jsonArray[1]) {
			commandObject.options = jsonArray[1];
		} else {
			commandObject.options = {};
		}
		/*
		 * Set our default options if they haven't been set
		 *
		 * We must always have a queueRun object if its not set (normally by instant) then its either an event in
		 * which case it must be a parent or failing then its a sub
		 *
 		 */
		commandObject.options.queueRun = commandObject.options.queueRun || (isParent ? self.DEFINE.COMMAND_EVENT : self.DEFINE.COMMAND_SUB);
		commandObject.state = self.DEFINE.QUEUE_ADDED;
		return commandObject;
	}

	/**
	 * Render some text/html to the dom
	 * @param domObject {object} - The object in the dom to write to
	 * @param text {string} - The text/HTML to write
	 * @param mode {number} - Mode to use while writing see define.js
	 * @return {boolean}
	 */
	renderToDom(domObject, text, mode) {
		let self = this;
		mode = mode || self.DEFINE.RENDER_INSERT;
		switch (mode) {
			case self.DEFINE.RENDER_INSERT:
				domObject.innerHTML = text;
				break;
			case self.DEFINE.RENDER_APPEND:
				domObject.insertAdjacentHTML('beforeend', text);
				break;
			case self.DEFINE.RENDER_REPLACE:
				const html = new DOMParser().parseFromString(text, 'text/html');
				domObject.parentNode.replaceChild(html.body.firstChild, domObject);
				break;
		}
		return true;
	}

	/**
	 * Finds elements in the dom of an iframe (or current document) using the query selector
	 * @param iframeTarget Iframe or false
	 * @param elementTarget query
	 * @param errorTrap {boolean} Trap any errors?
	 * @return {object|false}
	 */
	getIframeElements(iframeTarget, elementTarget, errorTrap = true) {
		let self = this;
		let iframe = document.getElementById(iframeTarget);
		if (!iframe)
			iframe = document;
		else
			iframe = iframe.contentDocument || iframe.contentWindow.document;
		let element = iframe.querySelectorAll(elementTarget);
		/*
		 * IE11 BUG, check for non arrays and attempt to convert
		 */
		if (!Array.isArray(element)) {
			element = Array.from(element);
		}
		if (element !== null)
			return element;
		if (errorTrap)
			self.reportError('Dom Element find failed for [' + elementTarget + '] iframe [' + iframeTarget + ']', 'Follow up calls that rely on this will fail');
		return false;
	}

	/**
	 * Finds an element in the dom using the jquery formant IE #id .class tag (will only ever return one)
	 * @param elementTarget
	 * @param errorTrap {boolean} Trap any errors?
	 * @return {object|false}
	 */
	getElement(elementTarget, errorTrap = true) {
		let self = this;
		let element = document.querySelector(elementTarget);
		if (element !== null)
			return element;
		if (errorTrap)
			self.reportError('Dom Element find failed for [' + elementTarget + ']', 'Follow up calls that rely on this will fail');
		return false;
	}

	/**
	 * Finds an element in the dom using the jquery formant and return a value that is scaped (json safe)
	 * @param elementTarget
	 * @param errorTrap {boolean} Trap any errors?
	 * @return {object|false}
	 */
	getElementValueEscaped(elementTarget, errorTrap = true) {
		let self = this;
		let element = document.querySelector(elementTarget);
		if (element !== null) {
			let unEscaped=element.value;
			unEscaped=unEscaped.replace(/\n/g,'\\n');
			unEscaped=unEscaped.replace(/\r/g,'\\r');
			unEscaped=unEscaped.replace(/\t/g,'\\t');
			return unEscaped.replace(/\"/g,"&quot;");
		}
		if (errorTrap)
			self.reportError('Dom Element find failed for [' + elementTarget + ']', 'Follow up calls that rely on this will fail');
		return false;
	}

	/**
	 * Finds an element(s) in the dom using the jquery formant IE #id .class tag (can return one or more)
	 * @param elementTarget
	 * @return {object|false}
	 */
	getElements(elementTarget) {
		let self = this;
		let element = document.querySelectorAll(elementTarget);
		/*
		 * IE11 BUG, check for non arrays and attempt to convert
		 */
		if (!Array.isArray(element)) {
			element = Array.from(element);
		}
		if (element !== null)
			return element;
		self.reportError('Dom Element(s) find failed for [' + elementTarget + ']', 'Follow up calls that rely on this will fail');
		return false;
	}


	/**
	 *  Show current queue status in the console DEBUG function
	 */
	show(pid) {
		let self = this;
		if(self.queue.length>0) {
			for (let i in self.queue) {
				let indent = 0;
				if(pid===undefined||self.queue[i].pid===pid) {
					self.prettyCommandObject(self.queue[i], indent);
					for (let j in self.queue[i].commands) {
						indent++;
						self.prettyCommandObject(self.queue[i].commands[j], indent);

					}
				}
			}
		} else {
			console.log(`Queue is empty, pid is ${self.pid}`);
		}
	}

	consoleBadge(options) {
		consoleBadge.log(options);
	}

	/**
	 * Make a pretty version of the currrent commandObject and dump it to the console
	 * @param commandObject
	 * @param indent
	 */
	prettyCommandObject(commandObject, indent) {
		let self = this;
		let string = '';
		for (var i = 0; i < indent; i++) {
			string += ' ';
		}
		let color = self.DEFINE.CONSOLE_COL_GREEN;
		switch (commandObject.state) {
			case self.DEFINE.QUEUE_FINISHED:
				color = self.DEFINE.CONSOLE_COL_AMBER;
				break;
			case self.DEFINE.QUEUE_ERROR:
				color = self.DEFINE.CONSOLE_COL_RED;
				break;

		}
		string += commandObject.queueable + '.' + commandObject.command + '(' + JSON.stringify(commandObject.json) + ',' + JSON.stringify(commandObject.options) + ');'
		console.log('%c ' + string, color);
		if (commandObject.error)
			console.log('%c  Stopped: ' + commandObject.error, self.DEFINE.CONSOLE_COL_AMBER);
	}

	/**
	 * Report an error to the console, adds various internal stats
	 * @param error
	 * @param message
	 */
	reportError(error, message) {
		consoleBadge.log({
			mode: 'shields.io',
			leftText: error,
			rightText: message,
			rightBgColor: '#ff0707',
			rightTextColor: '#1a1a1a'
		});
	}

	/**
	 * Deep copy and object IE remove references
	 * @param inputObject
	 * @return {any}
	 */
	deepCopy(inputObject) {
		return JSON.parse(JSON.stringify(inputObject));
	}

	/**
	 * Map an object with sub objects using a map function
	 * @param obj
	 * @param mapFunction
	 */
	objectMap(obj, mapFunction) {
		for (let i in obj) {
			if (typeof obj[i] === 'object') {
				this.objectMap(obj[i], mapFunction);
			} else {
				obj[i] = mapFunction(obj[i]);
			}
		}
	}

	/**
	 * Adds classes for browser type to body for use in CSS
	 */
	browserClasses() {
		let self = this;
		let bodyElement = self.getElement("body");
		if (!!window.MSInputMethodContext && !!document.documentMode)
			bodyElement.classList.add("ie11");
		else
			bodyElement.classList.add("notie11");
		if (navigator.vendor.match(/apple/i))
			bodyElement.classList.add("safari");
		if (navigator.vendor.match(/google/i))
			bodyElement.classList.add("chrome");
		if (navigator.userAgent.indexOf("Edge") > -1)
			bodyElement.classList.add("edge");
		if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
			bodyElement.classList.add("firefox");
	}

	/**
	 * Get any params from the url in json format
	 *
	 * This supports both the search format IE ? and also hash format # (# added to support AWS cognito)
	 */
	urlToJson() {
		let url = location.search!==""? location.search:location.hash;
		let query = url.substr(1);
		let result = {};
		query.split("&").forEach(function (part) {
			let item = part.split("=");
			result[item[0]] = decodeURIComponent(item[1]);
		});
		return result;
	}

	/**
	 *  Work in progress,
	 */
	menu() {
		queue.setMemory('developer', !this.developerMode, "Permanent");
		alert('DEVELOPER MODE: ' + this.developerMode)
		//document.body.innerHTML+='<div id="ourthingsMenu"><button onclick="queue.toggleDebug()">DEBUG MODE</button></div>';
	}

}

export default Queue;