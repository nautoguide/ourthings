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
    addMap(pid,json) {
        const options = Object.assign({
            map: 'default',
            zoom: 0,
            center: [-74.5, 40],
            style: 'mapbox://styles/mapbox/streets-v11',
            target: 'map',
            token:'fail',
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

        this.maps[options.map]={ map, layers: {} };

        map.on('load', () => {
            this.finished(pid,self.queue.DEFINE.FIN_OK);
        });
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

        this.maps[options.map].map.addSource(options.name, {
            type: 'geojson',
            data: options.data,
        });

        this._addLayer(options);

        this.finished(pid,self.queue.DEFINE.FIN_OK);
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

    	let mapOptions={
		    id: options.name,
		    type: options.type,
		    source: options.name,
		    paint: options.paint
	    };

	    if(options.layout)
		    mapOptions.layout=options.layout;

		if(options.filter)
    	    mapOptions.filter=options.filter;

        this.maps[options.map].map.addLayer(mapOptions);
    }

	/**
	 * Load images for use as icons (needs to be run prior to layer addition)
	 * @param {int} pid
	 * @param {object} json
	 * @param {string} json.map - name for the map (used to reference)
	 * @param {object} json.images - array of images to load in format [{"url":"url to image ","id":"id to use"}]
	 */
    addImages(pid,json) {
	    const options = Object.assign({
		    map: 'default',
		    images:[]
	    }, json);
	    let self=this;
	    Promise.all(
		    options.images.map(img => new Promise((resolve, reject) => {
			    self.maps[options.map].map.loadImage(img.url, function (error, res) {
				    if (error) {
				    	console.error('IMAGE: '+img.url+' - '+img.id);
					    throw error;
				    }
				    self.maps[options.map].map.addImage(img.id, res);
				    resolve();
			    })
		    }))
	    ).then(function(){
		    self.finished(pid,self.queue.DEFINE.FIN_OK);
	    })
    }

    addSelect(pid,json) {
        let self=this;
        const options = Object.assign({
            map: 'default',
            images:[],
            queue:"select"
        }, json);

        self.maps[options.map].map.on('click', json.layer, function (e) {
            const selectDetails={
                coordinates: e.features[0].geometry.coordinates.slice(),
                properties: e.features[0].properties
            };

           /* while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }*/
            self.queue.setMemory("select",selectDetails,"Session");

            self.queue.execute(options.queue,selectDetails);

        });
        self.finished(pid,self.queue.DEFINE.FIN_OK);

    }

    manualSelect(pid,json) {

        const options = Object.assign({
            map: 'default',
            layer:'default',
            queue:"select",
            filter: []
        }, json);
        let selectDetails={};
        const features=this.maps[options.map].map.getSource(json.layer)._data.features;

        features.forEach(function(feature){
            let res=eval(feature.properties[options.filter[1]]+' '+options.filter[0]+' '+options.filter[2]);
            if(res) {
                selectDetails.properties=feature.properties;
            }
        });

        self.queue.setMemory("select",selectDetails,"Session");
        self.queue.execute(options.queue,selectDetails);
        this.finished(pid,this.queue.DEFINE.FIN_OK);

    }

    addClick(pid,json) {
        let self=this;
        const options = Object.assign({
            map: 'default',
            queue: 'clicked'
        }, json);
        this.maps[options.map].map.on('click', function(e) {
            self.queue.setMemory("click",e,"Session");
            self.queue.execute(options.queue,e);
        });
        this.finished(pid,this.queue.DEFINE.FIN_OK);
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
            name: 'default',
            data: {
                type: 'FeatureCollection',
                features: [],
            },
        }, json);

        this.maps[options.map].map.getSource(options.name).setData({
            ...options.data,
        });
        this.finished(pid,self.queue.DEFINE.FIN_OK);
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
            name: '',
        }, json);

        this.maps[options.map].map.getSource(json.name).setData({
            type: 'FeatureCollection',
            features: [],
        });
        this.finished(pid,self.queue.DEFINE.FIN_OK);
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
        if(typeof coordinates[0][0] === 'object') {
            coordinates = coordinates[0]
        }
        const bounds = coordinates.reduce((bounds, coord) =>  bounds.extend(coord), new MapboxGL.LngLatBounds(coordinates[0], coordinates[0]));
        this.maps[options.map].map.fitBounds(bounds, { padding: options.padding });

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
        if(typeof paint === 'object') {
            final = paint.splice([paint.length - 1], 1);
            for (let value of options.paint.value) {
                for (let i = 0; i < paint.length; i += 2) {
                    if (value === paint[i]) {
                        paint.splice(i, 2);
                    }
                }
            }
            paint = [...paint, ...options.paint.value];

            paint.push(final[0]);
        } else {
            paint = options.paint.value;
        }

        this.maps[options.map].map.setPaintProperty(options.name, options.paint.type, paint);

        this.finished(pid,self.queue.DEFINE.FIN_OK);
    }
}