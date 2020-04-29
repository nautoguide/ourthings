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
		let history=[];
		history.push({
			"name":"Session start",
			"type":"full",
			"geojson":json.geojson
			});
		this.index=json.index;
		self.queue.setMemory("geojsonHistory", history, "Session");
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * Add to the geojson history
	 * @param {number} pid - Process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.geojson - starting geojson
	 * @param {string} json.type - Type of entry
	 */
	historyAdd(pid,json) {
		let options=Object.assign({
			"type":"incremental"
		},json);
		/*
		 * TODO History DFF, add modes etc
		 */
		memory.geojsonHistory.value.push({
			"name":json.name,
			"geojson":json.geojson,
			"type":json.type
		})
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	historyRevert(pid,json) {
		/**
		 * Add to the geojson history
		 * @param {number} pid - Process ID
		 * @param {object} json - queue arguments
		 * @param {string} json.id - history id
		 * @param {string} json.name - memory name to use
		 */
		let currentPtr=parseInt(json.id);
		let historyCut=[];
		let geojsonBuild;
		/*
		 * Cut out history from our end id to the first full geojson
		 */
		for(let i=currentPtr;i>=0;i--) {
			if(memory.geojsonHistory.value[i].type==="full") {
				geojsonBuild=this.queue.deepCopy(memory.geojsonHistory.value[i].geojson);
				break;
			}
			historyCut.unshift(memory.geojsonHistory.value[i]);

		}
		console.log(geojsonBuild);
		let len=historyCut.length;
		for(let i=0;i<len;i++) {
			for(let f=0;f<historyCut[i].geojson.features.length;f++) {
				let matched=false;
				for(let b=0;b<geojsonBuild.features.length;b++) {
					if(geojsonBuild.features[b].properties[this.index]===historyCut[i].geojson.features[f].properties[this.index]) {
						geojsonBuild.features[b]=this.queue.deepCopy(historyCut[i].geojson.features[f]);
						matched=true;
						break;
					}
				}
				if(matched==false) {
					console.log(`could not revert ${historyCut[i].geojson.features[f].properties[this.index]}`);
				}
			}
		}
		self.queue.setMemory(json.name, geojsonBuild, "Session");
		memory.geojsonHistory.value.push({
			"name":"Revert point",
			"geojson":geojsonBuild,
			"type":"full"
		})

		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}


}
