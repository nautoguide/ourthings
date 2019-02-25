/** @module Openlayers */
import Queueable from "../Queueable";
import {Map, View, Feature} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import WKT from 'ol/format/WKT';
import GeoJSON from 'ol/format/GeoJSON';
import {fromLonLat,units,epsg3857,epsg4326} from 'ol/proj';
import Select from 'ol/interaction/Select.js';
import {click, pointerMove, altKeyOnly} from 'ol/events/condition.js';


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
		let self=this;
		self.queue=queue;

		self.maps={};

		self.ready=true;
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
	addMap(pid,json) {
		let self=this;
		let options=Object.assign({
			"map":"default",
			"zoom": 0,
			"renderer": ['webgl', 'canvas'],
			"target":"map",
			"center":[0,0]
		},json);
		const map = new Map({
			target: options.target,
			view: new View({
				center: options.center,
				zoom: options.zoom,
				renderer: options.renderer
			})
		});
		self.maps[options.map]={"object":map,"layers":{}};
		self.finished(pid,self.queue.DEFINE.FIN_OK);
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

	addLayer(pid,json) {
		let self=this;
		let options=Object.assign({
			"map":"default",
			"name":"default",
			"opacity": 1,
			"transparent": false,
			"active": true
		},json);
		let map=self.maps[options.map].object;
		let olLayer = null;

		/*
		 * If we had a style specified then we need to check if it needs expanding
		 */
		if(options.style!==undefined&&typeof options.style!=='object')
			options.style=eval(options.style);

		/*
		 * Find the requested layer type as a function
		 */
		let layerFunction = self["_addLayer_" + options.type];
		if (typeof layerFunction === "function") {
			olLayer = layerFunction.apply(self, [options]);
		}
		else {
			self.finished(pid,self.queue.DEFINE.FIN_ERROR,"No add layer function for " + options.type);
			return false;
		}
		/*
		 * Add the layer and update the the maps object with the new layers
		 */
		map.addLayer(olLayer);
		self.maps[options.map].layers[options.name]=olLayer;
		self.finished(pid,self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Add an osm layer
	 * @param options
	 * @return {TileLayer}
	 * @private
	 */
	_addLayer_osm(options) {
		let olLayer=new TileLayer({
			source: new OSM()
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
		let self=this;
		let source={};
		let vectorSource;
		if(options.geojson!==undefined) {
			if(typeof options.geojson==='object') {
				source.features = (new GeoJSON({})).readFeatures(options.geojson, {featureProjection: self.maps[options.map].object.getView().getProjection()});
			} else {
				source.features = (new GeoJSON({})).readFeatures(eval(options.geojson), {featureProjection: self.maps[options.map].object.getView().getProjection()});
			}
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
	 * Use the standard openlayers select control
	 * @param pid
	 * @param json
	 *
	 * @description This select control uses the default openlayers model. Useful for applications with no overlapping features. It does not support selecting hidden features
	 */
	simpleSelect(pid,json) {
		let self=this;
		let options=Object.assign({
			"map":"default",
			condition:"click"
		},json);

		let selector = new Select();
		self.maps[options.map].object.addInteraction(selector);
		selector.on('select', function(e) {
			console.log(e);
			self.queue.setMemory('simpleSelect', e, "Session");
			self.queue.execute("simpleSelect");
		});
		self.finished(pid,self.queue.DEFINE.FIN_OK);

	}

	/**
	 * Add a feature to the Map
	 * TODO: This is old code for getting something working. Needs functionising, not for production
	 * @param pid
	 * @param json
	 */
	addFeature(pid,json) {
		let self=this;
		let options=Object.assign({
			"map":"default",
			"layer":"default",
			"values":{}
		},json);

		let map=self.maps[options.map].object;
		let layer=self.maps[options.map].layers[options.layer];
		let view=map.getView();
		let source=layer.getSource();
		console.log(layer);

		let projection = "EPSG:" + options.geometry.match(/SRID=(.*?);/)[1];
		let wkt = options.geometry.replace(/SRID=(.*?);/, '');

		let format = new WKT();
		let feature = format.readFeature(wkt);
		options.values.geometry = feature.getGeometry().transform(projection, view.getProjection().getCode());
		source.addFeature(new Feature(options.values));
		self.finished(pid,self.queue.DEFINE.FIN_OK);

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
	zoomToLayerExtent(pid,json) {
		let self=this;
		let options=Object.assign({
			"map":"default",
			"layer":"default"
		},json);
		/*
		 * Pull all our resources
		 */
		let map=self.maps[options.map].object;
		let view = map.getView();
		let layer=self.maps[options.map].layers[options.layer];
		let source = layer.getSource();
		/*
		 * Get the extent of the features and fit them
		 */
		let extent = source.getExtent();
		view.fit(extent, map.getSize());

		self.finished(pid,self.queue.DEFINE.FIN_OK);
	}
	/**
	 * Update size of map (in the event of resize or rotation this will fix it)
	 * @param pid
	 * @param json
	 * @param {string} json.map - Map reference can be * and all maps will be targeted
	 * @example
	 * openlayers.updateSize({"map":"map_1"});
	 */
	updateSize(pid,json) {
		let self=this;
		let options=Object.assign({
			"map":"default",
		},json);
		/*
		 * Pull all our resources
		 */
		if(json.map==="*") {
			for(let i in self.maps) {
				let map=self.maps[i].object;
				map.updateSize();
			}
		} else {
			let map = self.maps[options.map].object;
			map.updateSize();
		}
		self.finished(pid,self.queue.DEFINE.FIN_OK);

	}
}