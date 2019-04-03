import Queueable from "../Queueable";

export default class Mapbox extends Queueable {

    init(queue) {
        this.queue = queue;

        this.maps = {};

        this.overlays = {};

        this.ready = true;
    }

    addMap(pid,json) {

        mapboxgl.accessToken = 'pk.eyJ1IjoibmF1dG9ndWlkZWx0ZCIsImEiOiJjamx4dHQwYngwY2E1M3dxZGx1MHJoendpIn0.a6m0F2N8dJnx5yzz-OJfFQ';
        var map = new mapboxgl.Map({
            container: 'map', // container id
            style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
            center: [-74.50, 40], // starting position [lng, lat]
            zoom: 9 // starting zoom
        });

        self.maps[options.map]={"object":map,"layers":{}};
        self.finished(pid,self.queue.DEFINE.FIN_OK);
    }
}