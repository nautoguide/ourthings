/** @module Openlayers */
import Queueable from "../Queueable";
import {Map, View, Feature} from 'ol';
import {getWidth, getTopLeft} from 'ol/extent.js';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Point} from 'ol/geom.js';

import Disposable from 'ol/Disposable';
import OSM from 'ol/source/OSM';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import XYZ from 'ol/source/XYZ.js';

import WKT from 'ol/format/WKT';
import Overlay from 'ol/Overlay';
import {unByKey} from 'ol/Observable'


import GeoJSON from 'ol/format/GeoJSON';
import {fromLonLat, units, epsg3857, epsg4326} from 'ol/proj';

import Select from 'ol/interaction/Select';
import Snap from 'ol/interaction/Snap';
import Modify from 'ol/interaction/Modify';
import Draw from 'ol/interaction/Draw';

import proj4 from "proj4";
import {register} from 'ol/proj/proj4';
import {get as getProjection} from 'ol/proj'

import {transform} from 'ol/proj';

import {defaults as defaultInteractions, DragRotateAndZoom} from 'ol/interaction';

import {click, pointerMove, altKeyOnly, shiftKeyOnly, singleClick} from 'ol/events/condition';

import * as consoleBadge from "console-badge";

import {v4 as uuidv4} from 'uuid';

import {point, polygon, multiPolygon} from '@turf/turf';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import booleanContains from '@turf/boolean-contains';
import buffer from '@turf/buffer';
import kinks from '@turf/kinks';
import bboxPolygon from '@turf/bbox-polygon';
import bbox from '@turf/bbox';

proj4.defs([
	["EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.999601 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +datum=OSGB36 +units=m +no_defs"]
]);

register(proj4);


/**
 * @classdesc
 *
 * Openlayers Hook
 *
 * @author Richard Reynolds richard@nautoguide.com
 *
 * @example
 * //
 *
 * @description You need to add "ol": "^5.3.0" to your package.json to build with openlayers
 *
 */
export default class Openlayers extends Queueable {

	init(queue) {
		this.queue = queue;

		this.maps = {};

		this.overlays = {};

		this.ready = true;
	}

	/**
	 *
	 * Create a new map
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.target - id of element in the page to target
	 * @param {int} json.zoom - statement to check
	 * @param {array} json.center - Center on
	 * @param {string} json.renderer - Renderers to use
	 * @example
	 * openlayer.addMap();
	 *
	 */
	addMap(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"zoom": 0,
			"renderer": ['webgl', 'canvas'],
			"target": "map",
			"center": [0, 0],
			"projection": "EPSG:3857",
			"debug": false
		}, json);
		let projection = getProjection(options.projection);
		const map = new Map({
			target: options.target,
			view: new View({
				center: options.center,
				zoom: options.zoom,
				renderer: options.renderer,
				projection: projection,
				resolutions: options.resolutions,
				extent: options.extent,
			}),
			interactions: defaultInteractions().extend([
				new DragRotateAndZoom()
			]),
			keyboardEventTarget: document

		});
		if (options.debug === true) {
			self.queue.consoleBadge({
				mode: 'shields.io',
				leftText: 'Map debugger online',
				rightText: options.map,
				rightBgColor: '#7277ff',
				rightTextColor: '#1a1a1a'
			});
			map.on('moveend', self._debug);
		}
		self.maps[options.map] = {"object": map, "layers": {}, zoom: map.getView().getZoom(), "controls": {}};

		map.getView().on('propertychange', function (e) {
			switch (e.key) {
				case 'resolution': {
					/**
					 *  Check for judder - We only want zoom events that are not a transition
					 */

					let level = Math.round(map.getView().getZoom());
					let zoomLevel = self.maps[options.map].zoom;

					if (zoomLevel !== level || map.getView().getZoom() % 1 === 0) {
						self.queue.setMemory(options.map + 'ResolutionChange', {
							"zoom": map.getView().getZoom(),
							"resolution": map.getView().getResolution()
						}, "Session");
						self.queue.execute(options.map + "ResolutionChange");
					}

					self.maps[options.map].zoom = zoomLevel;
					break;
				}
			}
		});

		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	_debug(event) {
		let map = event.map;
		let extent = map.getView().calculateExtent(map.getSize());
		let center = map.getView().getCenter();
		self.queue.consoleBadge({
			mode: 'shields.io',
			leftText: 'Map Extent',
			rightText: extent,
			rightBgColor: '#7277ff',
			rightTextColor: '#1a1a1a'
		});
		self.queue.consoleBadge({
			mode: 'shields.io',
			leftText: 'Map Center',
			rightText: center,
			rightBgColor: '#7277ff',
			rightTextColor: '#1a1a1a'
		});
	}

	/**
	 *
	 * Add a layer to the map
	 * @param {int} pid - process ID
	 * @param {object} json - queue arguments
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {string} json.name - name for the layer (used to reference)
	 * @param {string} json.typr - Layer type osm,vector
	 * @param {float} json.opacity - layer opacity
	 * @param {boolean} json.transparent - is the layer transparent?
	 * @param {string} json.style - Style object to use
	 * @param {boolean} json.active - Is the layer active
	 * @param {object|string} json.geojson - geojson to add to the layer (vector)
	 * @example
	 * openlayer.addLayer();
	 *
	 */

	addLayer(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"name": "default",
			"opacity": 1,
			"transparent": false,
			"active": true
		}, json);
		let map = self.maps[options.map].object;
		let olLayer = null;

		/*
		 * If we had a style specified then we need to check if it needs expanding
		 */
		if (options.style !== undefined && typeof options.style !== 'object')
			options.style = eval(options.style);

		/*
		 * Find the requested layer type as a function
		 */
		let layerFunction = self["_addLayer_" + options.type];
		if (typeof layerFunction === "function") {
			olLayer = layerFunction.apply(self, [options]);
		} else {
			self.finished(pid, self.queue.DEFINE.FIN_ERROR, "No add layer function for " + options.type);
			return false;
		}
		/*
		 * Add the layer and update the the maps object with the new layers
		 */
		map.addLayer(olLayer);
		self.maps[options.map].layers[options.name] = olLayer;
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Add an osm layer
	 * @param options
	 * @return {TileLayer}
	 * @private
	 */
	_addLayer_osm(options) {
		let olLayer = new TileLayer({
			source: new OSM()
		});
		return olLayer;
	}

	/**
	 * Add an wmts layer
	 * @param options
	 * @return {TileLayer}
	 * @private
	 */
	_addLayer_wmts(options) {
		let self = this;
		let map = self.maps[options.map].object;
		let view = map.getView();
		let source = new WMTS({
			url: options.url,
			layer: options.layer,
			matrixSet: options.matrixSet,
			format: 'image/png',
			crossOrigin: 'anonymous',
			projection: view.getProjection(),
			tileGrid: new WMTSTileGrid({
				resolutions: view.getResolutions(),
				matrixIds: options.matrix,
				origin: options.origin

			})
		});
		let olLayer = new TileLayer({
			extent: options.extent,
			opacity: options.opacity,
			visible: options.active,
			name: options.name,
			source: source
		});

		return olLayer;

	}

	/**
	 * Add an xyz layer
	 * @param options
	 * @return {TileLayer}
	 * @private
	 */
	_addLayer_xyz(options) {
		let source = new XYZ({
			url: options.url,
			crossOrigin: 'Anonymous'
		});
		let olLayer = new TileLayer({
			extent: options.extent,
			opacity: options.opacity,
			visible: options.active,
			name: options.name,
			source: source
		});
		return olLayer;
	}

	/**
	 * Add a vector layer
	 * @param options
	 * @return {VectorLayer}
	 * @private
	 */
	_addLayer_vector(options) {
		let self = this;
		let source = {};
		let vectorSource;
		if (options.geojson !== undefined) {
			source.features = this._loadGeojson(options.map, options.geojson);
		}
		vectorSource = new VectorSource(source);
		let olLayer = new VectorLayer({
			name: options.name,
			visible: options.active,
			source: vectorSource,
			style: options.style,
			opacity: options.opacity,
			selectable: options.selectable,
			hover: options.hover
		});
		return olLayer;
	}

	/**
	 * Make a new control
	 *
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map name
	 * @param {string} json.mode -  on|off
	 * @param {array} json.name - What to call it (used later to reference)
	 * @param {array} json.control - The control function to use
	 *
	 */
	makeControl(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"mode": "on",
			"control": "simpleSelect",
			"name": "ss"
		}, json);
		let map = self.maps[options.map].object;
		let control;
		/*
		 * Find the requested control type as a function
		 */
		let controlFunction = self["_control_" + options.control];
		if (typeof controlFunction === "function") {
			control = controlFunction.apply(self, [options]);
		} else {
			self.finished(pid, self.queue.DEFINE.FIN_ERROR, "No control function for " + options.control);
			return false;
		}

		self.maps[options.map].controls[options.name] =
			{
				state: options.mode,
				obj: control
			};

		if (options.mode === "on")
			map.addInteraction(control);

		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Set a controls(s) to the requested mode and set others to opposit state
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map name
	 * @param {string} json.mode -  on|off
	 * @param {array} json.name - control to set
	 *
	 */
	controlSet(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"names": ["ss"]
		}, json);
		let map = self.maps[options.map].object;
		let controls = self.maps[options.map].controls;

		/*
		 * Toggle out all controls. We do this rather than be selective
		 * due to snap always needing to be the last added
		 */
		for (let i in controls) {
			this._toggleControl(map, controls[i],'off');

		}

		/*
		 * Toggle in the ones we do need (in order this is important for the likes of snap
		 */
		for (let i in options.names) {
					this._toggleControl(map, controls[options.names[i]],'on');
		}
		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Toggle a control between on/off
	 * @param map
	 * @param control
	 * @private
	 */
	_toggleControl(map, control,mode) {
		if (control.state === 'on'&&mode==='off') {
			map.removeInteraction(control.obj);
			control.state = 'off';
		}
		if (control.state === 'off'&&mode==='on') {
			map.addInteraction(control.obj);
			control.state = 'on';
		}
	}

	/**
	 *
	 *   CONTROLS
	 *
	 *
	 */


	/**
	 * Use the standard openlayers select control
	 * @param json
	 * @param {string} json.map - Map name
	 * @param {string} json.mode -  on|off
	 * @param {string} json.perfix - prefix to use
	 * @param {array} json.layers - layers to use
	 *
	 * @description This select control uses the default openlayers model. Useful for applications with no overlapping features. It does not support selecting hidden features
	 */
	_control_simpleSelect(json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"mode": "on",
			"prefix": ""
		}, json);
		if (options.layers) {
			for (let i in options.layers) {
				options.layers[i] = self.maps[options.map].layers[options.layers[i]];
			}
		}
		let map = self.maps[options.map].object;

		let control = new Select({"layers": options.layers});
		control.on('select', selectFunction);

		function selectFunction(e) {
			self.queue.setMemory(options.prefix + 'simpleSelect', e, "Session");
			self.queue.setMemory(options.map + 'selectedFeatures', e.selected, "Session");

			if (e.deselected.length > 0 && e.selected.length === 0)
				self.queue.execute(options.prefix + "simpleDeselect");
			if (e.selected.length > 0)
				self.queue.execute(options.prefix + "simpleSelect");
		}

		return control;
	}

	/**
	 * MultiEdit tool
	 * @param json
	 * @param {string} json.map - Map name
	 * @param {array} json.layer - layer to use
	 * @param {object} json.mode - on|off
	 * @param {object} json.projection - properties to set
	 * @param {object} json.inside - JSON with single feature to use
	 * @param {object} json.buffer - buffer in meters around the inside
	 *
	 */
	_control_multiEdit(json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"prefix": "",
			"layer": "default",
			"projection": "EPSG:4326",
			"inside": undefined,
			"buffer": 10
		}, json);
		let map = self.maps[options.map].object;
		let view = map.getView();
		let layer = this.maps[options.map].layers[options.layer];
		let source = layer.getSource();


		let featureCache = [];

		/*
		 * Modify interaction, does all the hard work
		 */
		let control = new Modify({
			source: source,
			pixelTolerance: 10,
			deleteCondition: function (evt) {
				return shiftKeyOnly(evt) && singleClick(evt)
			}
		});
		let maskFeature = buffer(options.inside.features[0], options.buffer, {units: "meters"});
		let bufferedMask = polygon(maskFeature.geometry.coordinates);


		/*
		 * When the user starts moving something we take a copy of it for use
		 * encase we need to revert
		 */
		control.on('modifystart', function (event) {
			let features = event.features.getArray();
			featureCache = [];
			for (let i = 0; i < features.length; i++) {
				featureCache.push(features[i].clone());
			}
		});

		/*
		 * When the user has finished the move / action
		 */
		control.on('modifyend', function (event) {

			/*
			 * What point did we move?
			 */
			let movedPoint = transform(event.mapBrowserEvent.coordinate, view.getProjection().getCode(), "EPSG:4326");
			let turfPoint = point(movedPoint);
			/*
			 * Modified features
			 */
			let modifiedFeatures = [];
			map.forEachFeatureAtPixel(event.mapBrowserEvent.pixel, function (feature, layer) {

				if (layer && layer.get('name') === options.layer) {
					modifiedFeatures.push(feature);
				}
			});



			let modifiedFeaturesJSON = new GeoJSON({
				"dataProjection": options.projection,
				"featureProjection": view.getProjection().getCode()
			}).writeFeaturesObject(modifiedFeatures);

			/*
            * Flag any inside feature valid
            */
			for(let i in modifiedFeaturesJSON.features) {
				let polygons=[modifiedFeaturesJSON.features[i]];
				if(polygons[0].geometry.type==="MultiPolygon")
					polygons=self._multiFeatureToPolygon(modifiedFeaturesJSON.features[i]);

				for(let p in polygons) {
					if (booleanContains(bufferedMask, polygons[p])) {
						modifiedFeatures[i].set('invalid', false);
					}
				}
			}
			/*
			 * All features
			 */
			let features = new GeoJSON({
				"dataProjection": options.projection,
				"featureProjection": view.getProjection().getCode()
			}).writeFeaturesObject(event.features.getArray());
			/*
			 * Check inside
			 */

			let isInside = true;
			let isKink = false;
			if (options.inside) {
				isInside = booleanPointInPolygon(turfPoint, bufferedMask);
			}

			/*
			 * Check for any kinks in the modified features
			 */
			for (let i in modifiedFeaturesJSON.features) {
				let kinkres = kinks(modifiedFeaturesJSON.features[i]);
				if (kinkres.features.length > 0) {
					isKink = true;
					break;
				}
			}

			/*
			 * Set memory and execute
			 */
			if (isInside === true && isKink === false) {
				self.queue.setMemory(options.prefix + 'multiEditFeatures', features, "Session");
				self.queue.setMemory(options.prefix + 'multiEditModifiedFeatures', modifiedFeaturesJSON, "Session");
				self.queue.execute(options.prefix + "multiEdit");
			} else {
				for (let i = 0; i < featureCache.length; i++) {
					for (let j = 0; j < modifiedFeatures.length; j++) {
						if (featureCache[i].get('uuid') === modifiedFeatures[j].get('uuid')) {
							modifiedFeatures[j].setGeometry(featureCache[i].getGeometry());
							break;
						}
					}
				}
				self.queue.execute(options.prefix + "multiEditOutside");
			}
		});

		return control;

	}

	_control_drawFeature( json) {
		let self=this;
		let options = Object.assign({
			"map": "default",
			"prefix": "",
			"layer": "default",
			"projection": "EPSG:4326",
			"type": "Polygon",
			"buffer":10
		}, json);
		let map = self.maps[options.map].object;

		let layer = this.maps[options.map].layers[options.layer];
		let source = layer.getSource();
		let view = map.getView();

		let bufferedMask;
		if (options.inside) {
			let maskFeature = buffer(options.inside.features[0], options.buffer, {units: "meters"});
			bufferedMask = polygon(maskFeature.geometry.coordinates);
		}
		let control= new Draw({
				source: source,
				type: options.type
			});

		control.on('drawend', function (event) {
			/*
			 * Add a uuid
			 */
			self._idFeatures([event.feature]);

			let features = new GeoJSON({
				"dataProjection": options.projection,
				"featureProjection": view.getProjection().getCode()
			}).writeFeaturesObject([event.feature]);
			let isInside = true;
			let isKink = false;
			if (options.inside) {
				isInside = booleanContains(bufferedMask,features.features[0]);
			}



			if(!isInside)
				event.feature.set('invalid',true);

			self.queue.setMemory(options.prefix + 'drawFeatures', features, "Session");
			self.queue.execute(options.prefix + "drawFeature");
		});
		return control;

	}

	_control_snap( json) {
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"pixelTolerance": 5
		}, json);


		let layer = this.maps[options.map].layers[options.layer];
		let source = layer.getSource();

		let control= new Snap({
			source: source,
			pixelTolerance: options.pixelTolerance
		});
		return control;
	}

	/**
	 *
	 *  END CONTROLS
	 *
	 */

	/**
	 * Convert a feature of multiPolygon to a featue(s) of Polygons. No properies are copied
	 * @param feature
	 * @returns {[]}
	 * @private
	 */
	_multiFeatureToPolygon(feature) {
		let features=[];
		for(let i in feature.geometry.coordinates) {
			features.push({
				type: "Feature",
				geometry:{
					coordinates:feature.geometry.coordinates[i],
					type: "Polygon"
				}
			})
		}
		return features;
	}
	/**
	 * Use a filter object to locate features on a single layer
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map name
	 * @param {array} json.layer - layer to use
	 * @param {object} json.filter - Filter eg {"feature_id":1}
	 *
	 */
	findFeatures(pid, json) {
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"filter": {}
		}, json);
		let foundFeatures = [];
		let layer = this.maps[options.map].layers[options.layer];
		let source = layer.getSource();
		let features = source.getFeatures();
		for (let i in features) {
			for (let f in options.filter) {
				let check = features[i].get(f);
				/*
				 * Note there can be differing types here, hence ==
				 */
				if (check == options.filter[f]) {
					foundFeatures.push(features[i]);
				}
			}
		}
		this.queue.setMemory('findFeatures', foundFeatures, "Session");
		this.queue.setMemory(options.map + 'selectedFeatures', foundFeatures, "Session");
		this.finished(pid, this.queue.DEFINE.FIN_OK);
		return foundFeatures;
	}

	/**
	 * Set a features properties by id
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map name
	 * @param {array} json.layer - layer to use
	 * @param {object} json.id - Feature id
	 * @param {object} json.properties - properties to set
	 *
	 */
	setFeaturePropertyById(pid, json) {
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"id": "",
			"properties": {}
		}, json);
		let layer = this.maps[options.map].layers[options.layer];
		let source = layer.getSource();
		let feature = source.getFeatureById(options.id);
		feature.setProperties(options.properties);
		this.queue.setMemory('updatedFeature', new GeoJSON({
			"dataProjection": "EPSG:4326",
			"featureProjection": "EPSG:3857"
		}).writeFeaturesObject([feature]), "Session");
		this.finished(pid, this.queue.DEFINE.FIN_OK);
	}

	/**
	 * Use the standard click event
	 * @param pid
	 * @param json
	 *
	 * @description This select control uses the default openlayers model. Useful for applications with no overlapping features. It does not support selecting hidden features
	 */
	simpleClick(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"mode": "on",
			"prefix": ""
		}, json);
		let map = self.maps[options.map].object;
		if (options.mode === "on") {
			self.maps[options.map].clickTag = map.on('click', clickfunction);
		} else {
			console.log('off');
			unByKey(self.maps[options.map].clickTag);
		}

		function clickfunction(e) {
			console.log(e);
			self.queue.setMemory(options.prefix + 'simpleClick', e, "Session");
			self.queue.execute(options.prefix + "simpleClick");
		}

		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}


	/**
	 * Convert a coordinate to WKT
	 * @param pid
	 * @param json
	 *
	 * @description Convert a coordinate to WKT
	 */
	coordinatesToWKT(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
		}, json);
		let olGeom = new Point(options.coordinate);
		let format = new WKT();
		let wktRepresenation = format.writeGeometry(olGeom);
		self.set(pid, {"wkt": wktRepresenation});
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Add a feature to the Map
	 * TODO: This is old code for getting something working. Needs functionising, not for production
	 * @param pid
	 * @param json
	 */
	addFeature(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"values": {}
		}, json);

		let map = self.maps[options.map].object;
		let layer = self.maps[options.map].layers[options.layer];
		let view = map.getView();
		let source = layer.getSource();
		console.log(layer);

		let projection = "EPSG:" + options.geometry.match(/SRID=(.*?);/)[1];
		let wkt = options.geometry.replace(/SRID=(.*?);/, '');

		let format = new WKT();
		let feature = format.readFeature(wkt);
		options.values.geometry = feature.getGeometry().transform(projection, view.getProjection().getCode());
		source.addFeature(new Feature(options.values));
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Delete features from layer by id
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.layer - Layer to get extent from
	 * @param {string} json.id - id of feature
	 */
	deleteFeatureById(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"id": ""
		}, json);
		let map = self.maps[options.map].object;
		let layer = self.maps[options.map].layers[options.layer];
		let source = layer.getSource();
		let feature = source.getFeatureById(options.id);
		source.removeFeature(feature);
		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Add geojson features to a layer
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.layer - Layer to get extent from
	 * @param {string} json.gejson - geojson
	 */
	addGeojson(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"geojson": {}
		}, json);
		let layer = self.maps[options.map].layers[options.layer];
		let source = layer.getSource();

		let features = this._loadGeojson(options.map, options.geojson);
		source.addFeatures(this._idFeatures(features));
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Openlayers doesn't ID features by default. This will apply a unique id to all features passed to it
	 * @param features
	 * @private
	 */
	_idFeatures(features) {
		for (let i in features) {
			if (features[i].get('uuid') === undefined) {
				let uuid = uuidv4();
				features[i].setId(uuid);
				features[i].set('uuid', uuid);
			} else {
				features[i].setId(features[i].get('uuid'));
			}
		}
		return features;
	}

	/**
	 * gets geojson features to a layer
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.layer - Layer to get extent from
	 * @param {string} json.prefix - Prefix for memory
	 * @param {string} json.projection - Projection to use
	 */
	getGeojson(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"projection": "EPSG:4326",
			"prefix": ""
		}, json);
		let map = self.maps[options.map].object;
		let view = map.getView();

		let layer = self.maps[options.map].layers[options.layer];
		let source = layer.getSource();
		let features = source.getFeatures();
		let returnJson = new GeoJSON({
			"dataProjection": options.projection,
			"featureProjection": view.getProjection().getCode()
		}).writeFeaturesObject(features);

		self.queue.setMemory(options.prefix + 'getGeojson', returnJson, "Session");

		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Loads geojson from var or object
	 * @param geojson
	 * @private
	 */
	_loadGeojson(map, geojson) {
		let self = this;
		if (typeof geojson === 'object') {
			return (new GeoJSON({})).readFeatures(geojson, {featureProjection: self.maps[map].object.getView().getProjection()});
		} else {
			return (new GeoJSON({})).readFeatures(eval(geojson), {featureProjection: self.maps[map].object.getView().getProjection()});
		}

	}

	/**
	 * Remove the data from a layer on the map.
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.layer - Layer to clear
	 */
	clearLayer(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"layer": "default"
		}, json);
		let layer = self.maps[options.map].layers[options.layer];
		if (layer) {
			let source = layer.getSource();
			source.clear();
		} else {
			console.warn(`No such layer [${options.layer}]`);
		}
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Flag a layer as changed (cause redraw).
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.layer - Layer to flag
	 */
	changed(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"layer": "default"
		}, json);
		let layer = self.maps[options.map].layers[options.layer];
		layer.changed();
		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Toggle layer on and off
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.layer - Layer to clear
	 */
	toggleLayer(pid, json) {
		let options = Object.assign({
			"map": "default",
			"layer": "default"
		}, json);
		let layer = this.maps[options.map].layers[options.layer];
		layer.setVisible(!layer.getVisible());
		this.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 *  Move the map so the cords are at the center
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.coordinate - Coordinate to use
	 * @example
	 * openlayers.centerOnCoordinate({"coordinate":"{{!^JSON.stringify(memory.simpleSelect.value.selected[0].getGeometry().getCoordinates())}}"});
	 *
	 */
	centerOnCoordinate(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
		}, json);
		/*
		 * Pull all our resources
		 */
		let map = self.maps[options.map].object;
		let view = map.getView();
		let size = map.getSize();
		view.centerOn(json.coordinate, size, [size[0] / 2, size[1] / 2]);
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Zoom a layer to the extent of its features (needs appropriate zoom levels to work well
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.inc - Increment of he zoom EG 1|-1|2|-2|etc
	 * @param {string} json.delay - Delay period of the zoom in ms
	 * @example
	 * openlayers.animateZoom({"inc":"2});
	 */
	animateZoom(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"inc": +1,
			"delay": 100
		}, json);
		/*
		 * Pull all our resources
		 */
		let map = self.maps[options.map].object;
		let view = map.getView();
		/*
		 * Animate a zoom
		 */
		view.animate({zoom: view.getZoom() + options.inc, duration: options.delay});
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Zoom a layer to the extent of its features (needs appropriate zoom levels to work well
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.duration - Delay period of the zoom in ms
	 * @param {string} json.location - location to fly to
	 * @param {boolean} json.wait - Wait till end of animation to finish queue item
	 * @example
	 * openlayers.flyTo({"location":"2});
	 */
	flyTo(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"duration": 2000,
			"location": "",
			"wait": false
		}, json);
		/*
		 * Pull all our resources
		 */
		let map = self.maps[options.map].object;
		let view = map.getView();

		let zoom = view.getZoom();
		let parts = 2;
		let called = false;

		function callback(complete) {
			--parts;
			if (called) {
				return;
			}
			if (parts === 0 || !complete) {
				called = true;
				if (options.wait === true)
					self.finished(pid, self.queue.DEFINE.FIN_OK);

			}
		}

		view.animate({
			center: options.location,
			duration: options.duration
		}, callback);
		view.animate({
			zoom: zoom - 1,
			duration: options.duration / 2
		}, {
			zoom: zoom,
			duration: options.duration / 2
		}, callback);
		if (options.wait === false)
			self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Zoom a layer to the extent of its features (needs appropriate zoom levels to work well
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.layer - Layer to get extent from
	 * @example
	 * openlayers.zoomToLayerExtent({"map":"map_1","layer":"data"});
	 */
	zoomToLayerExtent(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"layer": "default",
			"buffer": 100,
			"unit" :"meters",
		}, json);
		/*
		 * Pull all our resources
		 */
		let map = self.maps[options.map].object;
		let view = map.getView();
		let layer = self.maps[options.map].layers[options.layer];
		let source = layer.getSource();
		/*
		 * Get the extent of the features and fit them
		 */

		let featuresGeojson = new GeoJSON({
			"dataProjection": "EPSG:4326",
			"featureProjection": view.getProjection().getCode()
		}).writeFeaturesObject(source.getFeatures());

		let featuresBbox=bbox(featuresGeojson);
		let extentPolygon=bboxPolygon(featuresBbox);
		let bufferedFeature = buffer(extentPolygon, options.buffer, {units: options.unit});
		let bufferedExtent=bbox(bufferedFeature);
		let transformedExtentP1=transform([bufferedExtent[0],bufferedExtent[1]], "EPSG:4326",view.getProjection().getCode());
		let transformedExtentP2=transform([bufferedExtent[2],bufferedExtent[3]], "EPSG:4326",view.getProjection().getCode());
		let transformedExtent=[transformedExtentP1[0],transformedExtentP1[1],transformedExtentP2[0],transformedExtentP2[1]]
		try {
			view.fit(transformedExtent, map.getSize());
		} catch (e) {
			/*
			 * Fitting when the layer is empty fill cause OL to error
			 */
		}

		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Update size of map (in the event of resize or rotation this will fix it)
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference can be * and all maps will be targeted
	 * @example
	 * openlayers.updateSize({"map":"map_1"});
	 */
	updateSize(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
		}, json);
		/*
		 * Pull all our resources
		 */
		if (json.map === "*") {
			for (let i in self.maps) {
				let map = self.maps[i].object;
				map.updateSize();
			}
		} else {
			let map = self.maps[options.map].object;
			map.updateSize();
		}
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Add an overlay to the map
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.overlay - Overlay reference to use
	 * @param {string} json.targetId - Dom element to use
	 * @param {string} json.coordinate - coordinate to place it (Event.coordinate) for clicks
	 * @example
	 * openlayers.addOverlay({"targetId":"#functionOverlay","coordinate":"{{!^JSON.stringify(memory.simpleSelect.value.mapBrowserEvent.coordinate)}}"});
	 */
	addOverlay(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"overlay": "default",
		}, json);

		/*
		 * Pull all our resources
		 */
		let map = self.maps[options.map].object;

		if (self.overlays[options.overlay]) {
			map.removeOverlay(self.overlays[options.overlay].object);
			delete self.overlays[options.overlay];
		}
		/*
		 * Get the html element from the dom
		 */
		let element = self.queue.getElement(options.targetId);
		/*
		 * Make an overlay and add to the map
		 */
		let overlay = new Overlay({
			element: element,
			position: options.coordinate
		});
		map.addOverlay(overlay);
		/*
		 * Store the object for later (destroy)
		 */
		self.overlays[options.overlay] = {"object": overlay};
		self.finished(pid, self.queue.DEFINE.FIN_OK);
	}

	/**
	 * Remove an overlay from the map
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference
	 * @param {string} json.overlay - Overlay reference to use
	 * @example
	 * openlayers.removeOverlay();
	 */
	removeOverlay(pid, json) {
		let self = this;
		let options = Object.assign({
			"map": "default",
			"overlay": "default",
		}, json);

		/*
		 * Pull all our resources
		 */
		let map = self.maps[options.map].object;

		if (self.overlays[options.overlay]) {
			map.removeOverlay(self.overlays[options.overlay].object);
			delete self.overlays[options.overlay];
		}
		self.finished(pid, self.queue.DEFINE.FIN_OK);

	}
}
