import Queueable from "../Queueable";
import MapboxGL from 'mapbox-gl';
import centroid from '@turf/centroid';
import bbox from '@turf/bbox';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxEdit from 'mapbox-gl-edit';

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
	 * @param {int} json.maxZoom - Set the max zoom for the map (default 34)
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
			pitch: 0,
			mapZoom: 24
		}, json);

		MapboxGL.accessToken = options.token;
		const map = new MapboxGL.Map({
			container: options.target, // container id
			style: options.style, // stylesheet location
			center: options.center, // starting position [lng, lat]
			zoom: options.zoom, // starting zoom
			pitch: options.pitch,
			maxZoom: options.maxZoom
		});

		this.maps[options.map] = {map, layers: {}};
		this.maps[options.map].sources = {};
		this.maps[options.map].controls = {};

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
		map.on('idle', function () {
			self.queue.setRegister(options.map + 'Idle');
			//self.queue.execute(options.map+'Idle');
		});
		map.on('dataloading', function (data) {
			if (data.isSourceLoaded)
				self.queue.setRegister(options.map + 'DataLoaded');
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
			name: 'default'
		}, json);
		this.queue.deleteRegister(options.map + 'Idle');

		this.maps[options.map].map.addSource(options.name, {
			type: 'geojson',
			data: options.data,
		});

		//this._addLayer(options);

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
	addLayer(pid, json) {

		const options = Object.assign({
			map: 'default',
			type: 'point',
			source: 'default',
			paint: {},
		}, json);

		let mapOptions = {
			id: options.name,
			type: options.type,
			source: options.source,
			paint: options.paint
		};

		if (options.layout) {
			if (typeof options.layout !== 'object')
				options.layout = window[options.layout];
			mapOptions.layout = options.layout;
		}

		if (json.filter)
			mapOptions.filter = options.filter;

		this.maps[options.map].map.addLayer(mapOptions);
		this.finished(pid, self.queue.DEFINE.FIN_OK);

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
	 * @param {string} json.layers - name for the map layers in []
	 * @param {object} json.queue - queue to call upon select
	 * @param {object} json.unselectQueue - queue to call upon unselect
	 */
	addSelect(pid, json) {
		let self = this;
		const options = Object.assign({
			map: 'default',
			queue: "select",
			unselectQueue: "unselect"
		}, json);

		self.maps[options.map].map.on('click', function (e) {
			let f = self.maps[options.map].map.queryRenderedFeatures(e.point, {layers: options.layers});
			//debugger;
			//mapbox converts multi depth objects to strings. Deserialize this
			if (f.length >= 1) {

				for (let i in f[0].properties) {
					try {
						f[0].properties[i] = JSON.parse(f[0].properties[i]);
					} catch (e) {
						//do nothing (this was not a multi depth)
					}
				}
				const selectDetails = {
					coordinates: f[0].geometry.coordinates.slice(),
					centroid: centroid(f[0].geometry).geometry.coordinates,
					properties: f[0].properties,
					featureJSON: f[0].toJSON()
				};

				self.queue.setMemory("select", selectDetails, "Session");

				self.queue.execute(options.queue, selectDetails);
			} else {
				self.queue.setMemory("select", {}, "Session");
				self.queue.execute(options.queue);

			}

		});
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}
	/**
	 * Set filter on a layer
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.layer - name for the map layer
	 * @param {array} json.filter - new filter
	 */
	setFilter(pid, json) {
		const options = Object.assign({
			map: 'default',
			layer: 'default',
			filter: []
		}, json);
		this.maps[options.map].map.setFilter(options.layer, options.filter);
		this.finished(pid, this.queue.DEFINE.FIN_OK);

	}

	/**
	 * Await the source to be valid on a layer because mapbox has no event for this *WARNING SHIT HACK*
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.layer - name for the map layer
	 */
	awaitSourceFeatures(pid, json) {
		let self = this;
		const options = Object.assign({
			map: 'default',
			layer: 'default'
		}, json);
		const features = this.maps[options.map].map.querySourceFeatures(options.layer);
		if (features.length > 0) {
			this.finished(pid, this.queue.DEFINE.FIN_OK);
		} else {
			setTimeout(function () {
				self.awaitSourceFeatures(pid, json);
			}, 500);
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
		//const features = this.maps[options.map].map.querySourceFeatures(options.layer);
		const features = this.maps[options.map].sources[options.layer];
		features.forEach(function (feature) {
			let res = eval(feature.properties[options.filter[1]] + ' ' + options.filter[0] + ' ' + options.filter[2]);
			if (res) {
				selectDetails.properties = feature.properties;
				selectDetails.coordinates = feature.geometry.coordinates.slice();
				selectDetails.centroid = centroid(feature.geometry).geometry.coordinates;
				selectDetails.featureJSON = JSON.stringify(feature);
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
	 * @param {string} json.source - The name of the source that the data will be set on
	 * @param {object|string} json.data - The data to set the layer to (this will override old data)
	 */
	setData(pid, json) {

		const options = Object.assign({
			map: 'default',
			source: 'default',
			data: {
				type: 'FeatureCollection',
				features: [],
			},
			mode: 'clear',
			index: 'id'
		}, json);
		this.queue.deleteRegister(options.map + 'Idle');
		if(options.mode==='append') {
			for(let i in this.maps[options.map].sources[options.source]) {
				options.data.features.push(this.maps[options.map].sources[options.source][i]);
			}
		}
		let newFeatures=[];
		if(options.mode==='delete') {
			for(let i in this.maps[options.map].sources[options.source]) {
				let fdelete=false;
				for(let j in options.data.features) {
					if(options.data.features[j].properties[options.index]===this.maps[options.map].sources[options.source][i].properties[options.index]) {
						fdelete=true;
						break;
					}
				}
				if(fdelete===false)
					newFeatures.push(this.maps[options.map].sources[options.source][i]);
			}
			options.data.features=newFeatures;
		}

		this.maps[options.map].map.getSource(options.source).setData(options.data);
		// Make a copy of the source data because the internal call is not reliable
		this.maps[options.map].sources[options.source] = options.data.features;
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
		this.queue.deleteRegister(options.map + 'Idle');

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
	 * @param {string} json.source - Name of the layer to zoom in to
	 * @param {int} json.options - options as per: https://docs.mapbox.com/mapbox-gl-js/api/#map#fitbounds
	 */
	zoomToBounds(pid, json) {
		const options = Object.assign({
			map: 'default',
			source: 'default',
			options: {}
		}, json);

		let bounds = new MapboxGL.LngLatBounds();

		this.maps[options.map].sources[options.source].forEach(function (feature) {
			let fbbox = bbox(feature.geometry);
			bounds.extend([fbbox[0], fbbox[1]], [fbbox[2], fbbox[3]]);
		});
		if(bounds._ne)
			this.maps[options.map].map.fitBounds(bounds, options.options);
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * move to a feature
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 * @param {string} json.name - The name of the layer to query
	 * @param {string} json.property - The property key to check against
	 * @param {string} json.value - The value of the property that we'll be looking for
	 */
	moveToFeature(pid, json) {
		const options = Object.assign({
			map: 'default',
			layer: 'default',
			property: '',
			value: ''
		}, json);

		let features = this.maps[options.map].map.getSource(options.layer)._data.features;
		let pointGeom = null;

		for (const feature of features) {
			if (feature.properties.hasOwnProperty(options.property))
				/* Note the == match, this is lose on purpose, due to int/string casting
				 */
				if (feature.properties[options.property] == options.value) {
					pointGeom = feature;
					break;
				}
		}
		if (pointGeom !== null) {
			this.maps[options.map].map.flyTo({
				center: centroid(pointGeom.geometry).geometry.coordinates
			})
		}

		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Zoom /MapboxGL move to a feature
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

		for (const feature of features) {
			if (feature.properties.hasOwnProperty(options.property))
				/* Note the == match, this is lose on purpose, due to int/string casting
				 */
				if (feature.properties[options.property] == options.value) {
					pointGeom = feature;
					break;
				}
		}
		if (pointGeom !== null) {
			this.maps[options.map].map.flyTo({
				center: centroid(pointGeom.geometry).geometry.coordinates,
				zoom: options.zoom,
				minZoom: options.minZoom,
			})
		}

		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Move to a lat long
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 * @param {string} json.coordinates - lat long in array format
	 */
	moveToLocation(pid, json) {
		const options = Object.assign({
			map: 'default'
		}, json);

		this.maps[options.map].map.flyTo({
			center: options.coordinates
		});

		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Resize the visible map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 */
	resize(pid, json) {
		const options = Object.assign({
			map: 'default'
		}, json);
		this.maps[options.map].map.resize();
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Set pitch of the visible map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 * @param {int} json.pitch - The map pitch
	 */
	setPitch(pid, json) {
		const options = Object.assign({
			map: 'default',
			pitch: 0
		}, json);
		this.maps[options.map].map.setPitch(options.pitch);
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Set a memory mapDetails to have current info on the state of the map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 */
	getMapDetails(pid, json) {
		const options = Object.assign({
			map: 'default'
		}, json);
		let data = {
			center: this.maps[options.map].map.getCenter(),
			zoom: this.maps[options.map].map.getZoom()
		};
		self.queue.setMemory("mapDetails", data, "Session");
		this.finished(pid, self.queue.DEFINE.FIN_OK);
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
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Zoom the map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 */
	zoomTo(pid, json) {
		const options = Object.assign({
			map: 'default',
			zoom: 1
		}, json);
		this.maps[options.map].map.zoomTo(parseInt(options.zoom));
		this.finished(pid, self.queue.DEFINE.FIN_OK);
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
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Add a popup to the map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 * @param {array} json.lngLat - The long Lat to place the popup at
	 * @param {string} json.template - The template to use
	 */
	addPopup(pid, json) {
		const options = Object.assign({
			map: 'default',
			lngLat: [-96, 37.8],
			options:{closeOnClick: false}
		}, json);

		if (this.popup !== undefined)
			this.popup.remove();
		this.popup = new MapboxGL.Popup(options.options)
			.setLngLat(options.lngLat)
			.setHTML(`<div id="pu_${pid}"></div>`)
			.addTo(this.maps[options.map].map);
		this.queue.templateProcessor(options.template, `#pu_${pid}`, this.queue.DEFINE.RENDER_REPLACE);
		this.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Remove a popup from the map
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - The map that the querying layer is on
	 */
	removePopup(pid, json) {
		const options = Object.assign({
			map: 'default'
		}, json);

		if (this.popup !== undefined)
			this.popup.remove();
		this.finished(pid, self.queue.DEFINE.FIN_OK);

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

	addDrawTools(pid,json) {
		const options = Object.assign({
			map: 'default'
		}, json);
		let Draw = new MapboxDraw();
		this.maps[options.map].map.addControl(Draw, 'top-left');
		this.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	addEditTools(pid,json) {
		const options = Object.assign({
			map: 'default',
			source: 'default'
		}, json);
		this.maps[options.map].controls['Edit']= new MapboxEdit(options);
		this.maps[options.map].map.addControl(this.maps[options.map].controls['Edit']);
		this.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	removeEditTools(pid,json) {
		const options = Object.assign({
			map: 'default'
		}, json);
		this.maps[options.map].map.removeControl(this.maps[options.map].controls['Edit']);
		this.finished(pid, self.queue.DEFINE.FIN_OK);

	}
}