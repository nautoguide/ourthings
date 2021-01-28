/** @module ourthings/Queueable/Geojson */
import Queueable from "../Queueable";

/**
 * @classdesc
 *
 * geojson Functions
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 */
export default class Geojson extends Queueable {


	/**
	 * Init the geojson history
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.geojson - starting geojson
	 */
	historyInit(pid, json) {
		let options = Object.assign({
			"index": "feature_id",
			"mode": "simple"
		}, json);

		let history = {"revertPtr": false, "mode": options.mode, "log": [],"stepPtr":0};
		this.index = options.index;

		history.log.push({
			"name": "Session start",
			"type": "full",
			"geojson": this._compressGeojson("full", options.geojson),
			"index": this._makeHistoryIndex(options.geojson),
			"savePtr": true
		});
		this.queue.setMemory("geojsonHistory", history, "Session");
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * Add to the geojson history
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.geojson - starting geojson
	 * @param {string} json.type - Type of entry
	 * @param {array} json.features - features that are updated [{id:xx,action:"update|delete|new"}]
	 */
	historyAdd(pid, json) {
		let options = Object.assign({
			"type": "incremental",
			"features": []
		}, json);
		if (memory.geojsonHistory.value.revertPtr !== false && memory.geojsonHistory.value.mode === "simple") {
			memory.geojsonHistory.value.log = memory.geojsonHistory.value.log.splice(0, memory.geojsonHistory.value.revertPtr + 1);
			memory.geojsonHistory.value.revertPtr = false;
		}

		let entry = {
			"name": options.name,
			"geojson": this._compressGeojson(options.type, options.geojson),
			"type": options.type,
			"index": this._makeHistoryIndex(options.geojson),
			"details": options.details,
			"features": options.features,
			"savePtr": false
		}
		memory.geojsonHistory.value.stepPtr = memory.geojsonHistory.value.log.length;
		memory.geojsonHistory.value.log.push(entry);

		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * We need to make a fast access index for history based on our 'index' element for use later to speed up
	 * access and prevent many searches
	 *
	 * @param json
	 * @private
	 */
	_makeHistoryIndex(json) {
		let index = {};
		for (let i in json.features) {
			index[json.features[i].properties[this.index]] = {"position": i};
		}
		return index;
	}

	_compressGeojson(type, json) {
		if (type === 'full' || type === 'incremental')
			return json;
		if (type === 'geometry') {
			/*
			 * This edit was geometry only so we nuke properties (but not index as we need that)
			 */
			for (let i in json.features) {
				for (let p in json.features[i].properties) {
					if (p !== this.index)
						delete json.features[i].properties[p];
				}
			}
		}
		return json;
	}

	historyRevert(pid, json) {
		/**
		 * Add to the geojson history
		 * @param {number} pid - Process ID
		 * @param {object} json - queue arguments
		 * @param {string} json.id - history id
		 * @param {string} json.name - memory name to use
		 */
		let currentPtr = parseInt(json.id);
		if(currentPtr<0)
			currentPtr=0;
		if(currentPtr>=memory.geojsonHistory.value.log.length)
			currentPtr=memory.geojsonHistory.value.log.length-1;
		let historyCut = [];
		let geojsonBuild;
		let fastIndex;
		memory.geojsonHistory.value.revertPtr = currentPtr;
		memory.geojsonHistory.value.stepPtr = currentPtr;
		/*
		 * Cut out history from our end id to the first full geojson
		 */
		for (let i = currentPtr; i >= 0; i--) {
			if (memory.geojsonHistory.value.log[i].type === "full") {
				geojsonBuild = this.queue.deepCopy(memory.geojsonHistory.value.log[i].geojson);
				fastIndex = this.queue.deepCopy(memory.geojsonHistory.value.log[i].index);
				break;
			}
			historyCut.unshift(memory.geojsonHistory.value.log[i]);
		}
		/*
		 * geojsonBuild now contains the last full backup & historyCut is the array of changes needed to be applies
		 * in order to achieve the point in history. fastIndex is the index to access geojsonBuild and needs updating as
		 * we move down the history *if* additions / subtactions are made
		 */
		let len = historyCut.length;
		for (let i = 0; i < len; i++) {
			for (let f = 0; f < historyCut[i].geojson.features.length; f++) {
				switch (historyCut[i].type) {
					case 'geometry':
						geojsonBuild.features[fastIndex[historyCut[i].geojson.features[f].properties[this.index]].position].geometry = this.queue.deepCopy(historyCut[i].geojson.features[f].geometry);
						break;
					default:
						geojsonBuild.features[fastIndex[historyCut[i].geojson.features[f].properties[this.index]].position] = this.queue.deepCopy(historyCut[i].geojson.features[f]);
						break;
				}
			}
		}
		self.queue.setMemory(json.name, geojsonBuild, "Session");
		if (memory.geojsonHistory.value.mode !== "simple") {
			memory.geojsonHistory.value.log.push({
				"name": "Revert point",
				"geojson": geojsonBuild,
				"type": "full",
				"index": this._makeHistoryIndex(geojsonBuild)

			})
		}

		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}

	historyCompare(pid, json) {
		let options = Object.assign({
			"index": "feature_id"
		}, json);
		const index1 = this._makeHistoryIndex(options.geojson1);
		const index2 = this._makeHistoryIndex(options.geojson2);

		let deletes = [];

		//TODO iterate to find deletes

		this.queue.setMemory("historyCompare", {"updates": options.geojson2, "deletes": deletes}, "Session");

		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	historySave(pid, json) {

		/*
		 * Find save prt
		 */
		let savePtr = 0;
		let oldSave;
		for (let i = memory.geojsonHistory.value.log.length - 1; i >= 0; i--) {
			if (memory.geojsonHistory.value.log[i].savePtr) {
				memory.geojsonHistory.value.log[i].savePtr = false;
				savePtr = i+1;
				oldSave = memory.geojsonHistory.value.log[i];

			}
		}
		memory.geojsonHistory.value.log[memory.geojsonHistory.value.log.length - 1].savePtr = true;
		/*
		 * Run
		 */

		let updateUpdates = [];
		let updateDeletes = [];
		let updateAdds = [];
		// Pre lookup deletes
		for (let f = savePtr; f < memory.geojsonHistory.value.log.length; f++) {
			for (let a in memory.geojsonHistory.value.log[f].features) {
				if (memory.geojsonHistory.value.log[f].features[a].action == 'delete') {
					// can we actually find it in the old save (add/delete)
					if(oldSave.index[memory.geojsonHistory.value.log[f].features[a].id]) {
						updateDeletes.push(oldSave.geojson.features[oldSave.index[memory.geojsonHistory.value.log[f].features[a].id].position].properties['feature_id']);
					}
				}
			}
		}

		// Now updates and add
		for (let i in json.geojson.features) {
			let mode = "none";
			let found = false;
			for (let f = savePtr; f < memory.geojsonHistory.value.log.length; f++) {
				if (mode === 'add')
					break;
				for (let a in memory.geojsonHistory.value.log[f].features) {
					if (memory.geojsonHistory.value.log[f].features[a].id === json.geojson.features[i].properties.uuid) {

						found=true;
						switch (memory.geojsonHistory.value.log[f].features[a].action) {
							case "update":
								mode = "update";
								break;
							case "add":
								mode = "add";
								break;
						}
					}
				}
			}
			switch (mode) {
				case "none":
					// Do nothing this feature hasn't changed
					break;
				case "update":
					updateUpdates.push(json.geojson.features[i]);
					break;
				case "add":
					updateAdds.push(json.geojson.features[i]);
					break;
			}
		}
		this.queue.setMemory("historySavePacket", {
			"updates": {type: "FeatureCollection", features: updateUpdates},
			"deletes": updateDeletes,
			"inserts": {type: "FeatureCollection", features: updateAdds}
		}, "Session");
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}


}
