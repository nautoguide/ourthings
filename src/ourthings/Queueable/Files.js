/** @module ourthings/Queueable/Files */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * File upload functions
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */
export default class Files extends Queueable {


	/**
	 * Load a file into memory with option to preview
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom location that contains the files input
	 * @param {string} json.previewId - Dom location to put preview
	 */
	clientLoad(pid, json) {
		let self = this;
		let element = self.queue.getElement(json.targetId);
		let files = element.files;
		if (files && files[0]) {
			let reader = new FileReader();
			reader.readAsDataURL(files[0]);
			reader.onload = function (evt) {
				if (json.previewId) {
					let preview = self.queue.getElement(json.previewId);
					preview.src = evt.target.result;
				} else {
					self.set(pid, evt.target.result);
				}
				self.finished(pid, self.queue.DEFINE.FIN_OK);
			};
			reader.onerror = function (evt) {
				// TODO Write me!
				console.log('error');
				debugger;
				self.finished(pid, self.queue.DEFINE.FIN_ERROR);

			};
		}

	}

	/**
	 * Image preview
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom location that contains the files input
	 * @param {string} json.previewId - Dom location to put preview
	 * @param {string} json.dragTargetId - Dom location to target for the drop zone
	 */
	filePreview(pid, json) {
		let self = this;
		let element = self.queue.getElement(json.targetId);

		/**
		 *  Clear down any previous file memory entries
		 */
		self.queue.deleteMemory('file');

		/**
		 * Drag drop functions
		 * @param e
		 */
		function onDragEnter(e) {
			e.stopPropagation();
			e.preventDefault();
		}

		function onDragOver(e) {
			e.stopPropagation();
			e.preventDefault();
		}

		function onDragLeave(e) {
			e.stopPropagation();
			e.preventDefault();
		}

		function onDrop(e) {
			e.stopPropagation();
			e.preventDefault();
			setFiles(e.dataTransfer.files);
			return false;
		}

		function setFiles(files) {
			let file = files[0];
			self.queue.setMemory('file', file, 'Session');
			doPreview(file);
		}

		/**
		 *  Did we need a drag and drop on this element?
		 */
		if (json.dragTargetId) {
			let dragElement = self.queue.getElement(json.dragTargetId);
			dragElement.addEventListener('dragenter', onDragEnter, false);
			dragElement.addEventListener('dragover', onDragOver, false);
			dragElement.addEventListener('dragleave', onDragLeave, false);
			dragElement.addEventListener('drop', onDrop, false);
		}


		/**
		 *  Event for change (IE the input file box selected a file)
		 */
		element.addEventListener('change', function () {
			let file = this.files[0];
			self.queue.setMemory('file', file, 'Session');
			doPreview(file);
		});

		/**
		 * Actual preview function called from both change & drag drop events
		 * @param file
		 */

		function doPreview(file) {
			let reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = function (evt) {
				if (json.previewId) {
					let preview = self.queue.getElement(json.previewId);
					preview.src = evt.target.result;
				} else {
					self.set(pid, evt.target.result);
				}
			};
			reader.onerror = function (evt) {
				// TODO Write me!
				console.log('error');
				debugger;

			};
		}

		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Upload fiel to S3
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.targetId - Dom location that contains the files input
	 * @param {boolean} json.file - use the memory file object set
	 * @param {string} json.contentType - Content type of file
	 * @param {string} json.headers - Additional headers to send
	 * @param {string} json.url - url to upload to
	 */
	putFileToS3(pid, json) {
		let self = this;
		json.contentType = json.contentType || 'image/png';
		let headers = json.headers || {};
		headers['Content-Type'] = json.contentType;
		let file;
		/**
		 *  The upload can come from an input or via memory
		 *  In the case of memory we cleanup the memory
		 */
		if (json.file) {
			file=memory.file.value;
			self.queue.deleteMemory('file');
		} else {
			let element = self.queue.getElement(json.targetId);
			file = element.files[0];
		}

		/**
		 *  Make the call to S3 with the file data
		 */
		fetch(json.url, {
			headers: headers,
			method: 'PUT',
			body: file
		})
			.then(response => self.queue.handleFetchErrors(response))
			.then(function (response) {
				switch (json.contentType) {
					case 'application/json':
						return response.json();
					default:
						return response.text();
				}
			})
			.then(function (response) {
				/*
				 * Convert the response to json and start the loader
				 */
				self.set(pid, response);
				self.finished(pid, self.queue.DEFINE.FIN_OK);

			})
			.catch(function (error) {
				console.info(self.queue.DEFINE.CONSOLE_LINE);
				console.error('Error:', error);
				console.info("Warning this error is probably fatal as I have no templates to load");
				self.finished(pid, self.queue.DEFINE.FIN_ERROR, 'S3 upload error');

			});

	}
}
