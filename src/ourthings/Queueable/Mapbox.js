import Queueable from "../Queueable";
import MapboxGL from 'mapbox-gl';

export default class Mapbox extends Queueable {

	init(queue) {
		this.queue = queue;
		this.maps = {};
		this.overlays = {};
		this.ready = true;
	}

	/**
	 * Create a new mapbox gl map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.target - id of element in the page to target
	 * @param {string} json.style - mapbox style for the map
	 * @param {int} json.zoom - Set the initial zoom of the map
	 * @param {array} json.center - Center on
	 * @example
	 * mapbox.addMap({"map": "testMap", "target":"mapboxMap", "style": "mapbox://styles/mapbox/streets-v11", "zoom": 8, "center": [-70, 41.2]});
	 */
	addMap(pid, json) {
		const options = Object.assign({
			map: 'default',
			zoom: 0,
			center: [-74.5, 40],
			style: 'mapbox://styles/mapbox/streets-v11',
			target: 'map',
			token: 'fail',
			pitch: 0
		}, json);

		MapboxGL.accessToken = options.token;
		const map = new MapboxGL.Map({
			container: options.target, // container id
			style: options.style, // stylesheet location
			center: options.center, // starting position [lng, lat]
			zoom: options.zoom, // starting zoom
			pitch: options.pitch
		});

		this.maps[options.map] = {map, layers: {}};

		map.on('load', () => {
			this.finished(pid, self.queue.DEFINE.FIN_OK);
		});

		/*
		 * On idle run a queue (this is needed for blocking access to data before its loaded). We delay the start of this
		 * monitor to allow time for setup commands to run
		 */
/*
		setTimeout(function () {
*/
				map.on('idle',function(){
					self.queue.setRegister(options.map+'Idle');
					//self.queue.execute(options.map+'Idle');
				});
				map.on('dataloading',function(data){
					if(data.isSourceLoaded)
						self.queue.setRegister(options.map+'DataLoaded');
					//self.queue.execute(options.map+'Idle');
				})
/*
		}, 5000);
*/

	};

	/**
	 * Add a new source and layer to the map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.name - Name for the layer/source
	 * @param {string} json.type - The type of feature for the layer one of ['Point', 'Line', 'Polygon', 'MultiLineString']
	 * @param {string} json.filter - The layer filter
	 * @param {string|object} json.data - Set the data of the source, this could also be a url for the data
	 * @example
	 * mapbox.addSource({"map": "testMap", "name": "newLayer", "featureType": "Point", "data": "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_ports.geojson"});
	 */
	addSource(pid, json) {


		const options = Object.assign({
			map: 'default',
			data: {
				type: 'FeatureCollection',
				features: [],
			},
			type: 'point',
			name: 'default',
			paint: {},
		}, json);
		this.queue.deleteRegister(options.map+'Idle');

		this.maps[options.map].map.addSource(options.name, {
			type: 'geojson',
			data: options.data,
		});

		this._addLayer(options);

		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Add the layer to the map once a source has been created.
	 * @param {object} options
	 * @param {string} options.type - The type of feature that the layer is.
	 * @param {string} options.name - The name for the layer
	 * @param {object} options.paint - The paint styling for the layer
	 * @param {object} options.layout - The layout styling for the layer
	 * @private
	 */
	_addLayer(options) {

		let mapOptions = {
			id: options.name,
			type: options.type,
			source: options.name,
			paint: options.paint
		};

		if (options.layout) {
			if (typeof options.layout !== 'object')
				options.layout = window[options.layout];
			mapOptions.layout = options.layout;
		}

		if (options.filter)
			mapOptions.filter = options.filter;

		this.maps[options.map].map.addLayer(mapOptions);
	}

	/**
	 * Load images for use as icons (needs to be run prior to layer addition)
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {object} json.images - array of images to load in format [{"url":"url to image ","id":"id to use"}]
	 */
	addImages(pid, json) {
		const options = Object.assign({
			map: 'default',
			images: []
		}, json);
		let self = this;
		Promise.all(
			options.images.map(img => new Promise((resolve, reject) => {
				self.maps[options.map].map.loadImage(img.url, function (error, res) {
					if (error) {
						console.error('IMAGE: ' + img.url + ' - ' + img.id);
						throw error;
					}
					self.maps[options.map].map.addImage(img.id, res);
					resolve();
				})
			}))
		).then(function () {
			self.finished(pid, self.queue.DEFINE.FIN_OK);
		})
	}

	/**
	 * Add a select control to a layer
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.layer - name for the map layer
	 * @param {object} json.queue - queue to call upon select
	 */
	addSelect(pid, json) {
		let self = this;
		const options = Object.assign({
			map: 'default',
			queue: "select"
		}, json);

		self.maps[options.map].map.on('click', json.layer, function (e) {
			const selectDetails = {
				coordinates: e.features[0].geometry.coordinates.slice(),
				properties: e.features[0].properties,
				featureJSON: e.features[0].toJSON()
			};

			/* while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				 coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			 }*/
			self.queue.setMemory("select", selectDetails, "Session");

			self.queue.execute(options.queue, selectDetails);

		});
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Await the source to be valid on a layer because mapbox has no event for this *WARNING SHIT HACK*
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.layer - name for the map layer
	 */
	awaitSourceFeatures(pid, json) {
		let self=this;
		const options = Object.assign({
			map: 'default',
			layer: 'default'
		}, json);
		const features = this.maps[options.map].map.querySourceFeatures(options.layer);
		if(features.length>0) {
			this.finished(pid, this.queue.DEFINE.FIN_OK);
		} else {
			setTimeout(function () {
				self.awaitSourceFeatures(pid,json);
			},500);
		}
	}

	manualSelect(pid, json) {
		const options = Object.assign({
			map: 'default',
			layer: 'default',
			queue: "select",
			filter: []
		}, json);
		let selectDetails = {};
		const features = this.maps[options.map].map.querySourceFeatures(options.layer);
		features.forEach(function (feature) {
			let res = eval(feature.properties[options.filter[1]] + ' ' + options.filter[0] + ' ' + options.filter[2]);
			if (res) {
				selectDetails.properties = feature.properties;
				selectDetails.featureJSON = feature.toJSON();
			}
		});

		self.queue.setMemory("select", selectDetails, "Session");
		self.queue.execute(options.queue, selectDetails);
		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}

	addClick(pid, json) {
		let self = this;
		const options = Object.assign({
			map: 'default',
			queue: 'clicked'
		}, json);
		this.maps[options.map].map.on('click', function (e) {
			console.log(e);
			let data = {location: e.lngLat};
			self.queue.setMemory("click", data, "Session");
			self.queue.execute(options.queue, data);
		});
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	removeClick(pid, json) {
		let self = this;
		const options = Object.assign({
			map: 'default'
		}, json);
		this.maps[options.map].map.off('click', function (e) {
		});
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * Set the data for a layer
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The name of the map that the layer is on
	 * @param {string} json.name - The name of the layer that the data will be set on
	 * @param {object|string} json.data - The data to set the layer to (this will override old data)
	 */
	setData(pid, json) {

		const options = Object.assign({
			map: 'default',
			layer: 'default',
			data: {
				type: 'FeatureCollection',
				features: [],
			},
		}, json);
		this.queue.deleteRegister(options.map+'Idle');
		this.maps[options.map].map.getSource(options.layer).setData(options.data);
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	setPaintProperty(pid, json) {
		const options = Object.assign({
			map: 'default',
			layer: 'default'
		}, json);
		this.maps[options.map].map.setPaintProperty(options.layer, options.property, options.value);
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	setLayoutProperty(pid, json) {
		const options = Object.assign({
			map: 'default',
			layer: 'default'
		}, json);
		this.maps[options.map].map.setLayoutProperty(options.layer, options.property, options.value);
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Set the data for a layer
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The name of the map that the layer is on
	 * @param {string} json.name - The name of the layer to clear
	 */
	clearLayer(pid, json) {

		const options = Object.assign({
			map: 'default',
			layer: 'default'
		}, json);
		this.queue.deleteRegister(options.map+'Idle');

		this.maps[options.map].map.getSource(options.layer).setData({
			type: 'FeatureCollection',
			features: []
		});
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Zoom to the bounds of a layer
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - Name of the map the layer is within
	 * @param {string} json.name - Name of the layer to zoom in to
	 * @param {int} json.padding - Padding around the layer zoom
	 */
	zoomToBounds(pid, json) {
		const options = Object.assign({
			map: 'default',
			name: '',
			padding: 20,
		}, json);

		let coordinates = this.maps[options.map].map.getSource(json.name)._data.features[0].geometry.coordinates;
		if (typeof coordinates[0][0] === 'object') {
			coordinates = coordinates[0]
		}
		const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), new MapboxGL.LngLatBounds(coordinates[0], coordinates[0]));
		this.maps[options.map].map.fitBounds(bounds, {padding: options.padding});

		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Query and highlight feature depending on the paint features
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 * @param {string} json.name - The name of the layer to query
	 * @param {string} json.property - The property key to check against
	 * @param {string} json.value - The value of the property that we'll be looking for
	 * @param {int} json.zoom - The final zoom level for viewing the point
	 * @param {int} json.minZoom - The furthest out the map will zoom whilst flying to the point
	 */
	zoomToFeature(pid, json) {
		const options = Object.assign({
			map: 'default',
			layer: 'default',
			property: '',
			value: ''
		}, json);

		let features = this.maps[options.map].map.getSource(options.layer)._data.features;
		let pointGeom = null;

		for(const feature of features) {
			if(feature.properties.hasOwnProperty(options.property))
				if(feature.properties[options.property] === options.value) {
					pointGeom = feature.geometry.coordinates;
					break;
				}
		}

		if(pointGeom !== null) {
			this.maps[options.map].map.flyTo({
				center: pointGeom,
				zoom: options.zoom,
				minZoom: options.minZoom,
			})
		}

		this.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Zoom in the map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 */
	zoomIn(pid, json) {
		const options = Object.assign({
			map: 'default'
		}, json);
		this.maps[options.map].map.zoomIn();
		this.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Zoom out the map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 */
	zoomOut(pid, json) {
		const options = Object.assign({
			map: 'default'
		}, json);
		this.maps[options.map].map.zoomOut();
		this.finished(pid,self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Query and highlight feature depending on the paint features
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 * @param {string} json.name - The name of the layer to query
	 * @param {object} json.paint - The pain object for querying ans styling
	 * @param {string} json.paint.type - The styling type that will be changed for highlighting
	 * @param {array} json.paint.value - The list of paint styles for querying e.g. [["get", "feature_name"], "test_name", "#333399"] This will be appended to the current style
	 */
	paintQueryFeatures(pid, json) {
		const options = Object.assign({
			map: 'default',
			name: '',
			paint: {},
		}, json);

		let paint = JSON.parse(JSON.stringify(this.maps[options.map].layers[options.name])).defaultStyle[options.paint.type];
		let final = null;
		if (typeof paint === 'object') {
			final = paint.splice([paint.length - 1], 1);
			for (let value of options.paint.value) {
				for (let i = 0; i < paint.length; i += 2) {
					if (value === paint[i]) {
						paint.splice(i, 2);
					}
				}
			}
			// Edge doesn't support ... notation ffs. Don't want to bable edge so changed for now
			// Untested
			//paint = [...paint, ...options.paint.value];
			paint.push(options.paint.value)
			paint.push(final[0]);
		} else {
			paint = options.paint.value;
		}

		this.maps[options.map].map.setPaintProperty(options.name, options.paint.type, paint);

		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}
}