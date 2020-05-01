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

		let history = {"revertPtr": false, "mode": options.mode, "log": []};
		this.index = options.index;

		history.log.push({
			"name": "Session start",
			"type": "full",
			"geojson": this._compressGeojson("full", options.geojson),
			"index": this._makeHistoryIndex(options.geojson)
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
	 */
	historyAdd(pid, json) {
		let options = Object.assign({
			"type": "incremental"
		}, json);
		if (memory.geojsonHistory.value.revertPtr!==false&&memory.geojsonHistory.value.mode === "simple") {
			memory.geojsonHistory.value.log=memory.geojsonHistory.value.log.splice(0,memory.geojsonHistory.value.revertPtr+1);
			memory.geojsonHistory.value.revertPtr=false;
		}
		memory.geojsonHistory.value.log.push({
			"name": options.name,
			"geojson": this._compressGeojson(options.type, options.geojson),
			"type": options.type,
			"index": this._makeHistoryIndex(options.geojson)
		});

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
		let historyCut = [];
		let geojsonBuild;
		let fastIndex;
		memory.geojsonHistory.value.revertPtr = currentPtr;
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

	historyCompare(pid,json) {
		let options = Object.assign({
			"index": "feature_id"
		}, json);
		const index1=this._makeHistoryIndex(options.geojson1);
		const index2=this._makeHistoryIndex(options.geojson2);

		let deletes=[];

		//TODO iterate to find deletes

		this.queue.setMemory("historyCompare", {"updates":options.geojson2,"deletes":deletes}, "Session");

		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}


}
