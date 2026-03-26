import { api, LightningElement } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import LEAFLET from '@salesforce/resourceUrl/Leaflet_1_9_4';
import MAP_RESOURCES from '@salesforce/resourceUrl/PS2MapComponents';

const MODE = {
    INIT: 'init',
    RECORD: 'record',
    CENTER: 'center',
    TRACK: 'track',
    SUGGEST: 'suggest'
};

export default class Ps2BaseMap extends LightningElement {
    @api height;
    @api label;
    @api zoomLevel = 13;

    @api enableCenterOnLocation = false;
    @api enableReverseGeocode = false;
    @api enableAddressAutocomplete = false;
    @api startLatitude = 39.60495;
    @api startLongitude = -97.40802;
    @api searchPlaceholder = 'Enter Address';

    addressSuggestions = null;
    searchValue = null;

    initCentered = false;
    currAddress = {};
    crosshairAddress = {};

    mode = MODE.INIT;

    locAddress;
    suggestAddress;

    currPos = null;
    recPos = null;

    gpsImage = MAP_RESOURCES + '/gps-arrow.png';
    recordGpsImage = MAP_RESOURCES + '/gps-crosshair-2.png';
    crosshairImage = MAP_RESOURCES + '/mapCrosshair.png';

    map = null;
    recordLayer = null;
    crosshairLayer = null;
    crosshairMarker = null;

    renderedCallback() {
        this.template.querySelector('.mapContainer').style.height = `${this.height}px`;
    }

    connectedCallback() {
        Promise.all([
            loadStyle(this, LEAFLET + '/leaflet.css'),
            loadScript(this, LEAFLET + '/leaflet.js'),
        ]).then(() => {
            // Leaflet should be ready, create a new draw method
            this.draw();
        });
    }

    draw() {
        let container = this.template.querySelector('.mapContainer');

        this.map = L.map(container, {
            zoomControl: true,
            boxZoom: true,
            trackResize: true,
            doubleClickZoom: true,
        });
        this.map.attributionControl.setPrefix(false);
        //let map = L.map(container, { scrollWheelZoom: false }).setView(position, 13);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: this.label,
        }).addTo(this.map);

        /*
        let marker = L.marker(position).addTo(this.map);
        let featureGroup = L.featureGroup([marker]).addTo(this.map);
        this.map.fitBounds(featureGroup.getBounds());
        
        */
        if (this.startLatitude != null && this.startLongitude != null) {
            this.map.setView([this.startLatitude, this.startLongitude], this.zoomLevel);
        }

        //////////////////////////////
        // setup layers and markers //
        //////////////////////////////
        console.log('ps2BaseMap: adding layers and markers...');
        this.recordLayer = new L.LayerGroup();
        this.crosshairLayer = new L.LayerGroup();

        console.log('ps2BaseMap: crosshairImage = ' + this.crosshairImage);

        this.recordLayer.addTo(this.map);
        this.crosshairLayer.addTo(this.map);

        var crosshairIcon = L.icon({
            //iconUrl: '/resource/mapCrosshair',
            iconUrl: this.crosshairImage,
            iconSize: [170, 170], // size of the icon
        });


        this.crosshairMarker = new L.marker(this.map.getCenter(), {
            icon: crosshairIcon,
            clickable: false,
        });


        //this.crosshairLayer.addLayer(this.crosshairMarker);


        //////////////////////////////////////
        // get the current lat/lng location //
        //////////////////////////////////////
        navigator.geolocation.getCurrentPosition(
            (location) => {
                console.log('location=' + JSON.stringify(location));
                console.log('getCurrentPosition... ' + location.coords.latitude + ',' + location.coords.longitude);
                this.currPos = [location.coords.latitude, location.coords.longitude];

                if (this.enableCenterOnLocation == true && !this.initCentered) {
                    this.showCenterCrosshair();
                    this.map.setView(this.currPos);
                    this.initCentered = true;
                }
            });

        this.map.on('move', () => {
            this.adjustCenterCrosshair();
        });

        //////////////////////////////////////////////////////////////////
        // when map is moved, do reverse address lookup and show on map //
        //////////////////////////////////////////////////////////////////
        this.map.on('moveend', () => {
            console.log('ps2BaseMap: moveend');

            var coords = this.map.getCenter();


            console.log('crosshair coords [' + coords.lat + ',' + coords.lng + ']');
            this.adjustCenterCrosshair();

            if (this.isModeRecord()) {
                this.setModeTrack();
                this.locAddress = null;
                this.hideCenterCrosshair();
            }
            else if (this.isModeSuggest()) {
                this.setModeTrack();
            }
            else {
                if (this.enableReverseGeocode) {
                    this.reverseGeocode(coords.lat, coords.lng);
                }
            }

            //this.getAddressSuggestions('584 saint ju');

            /*
            reverseGeocode({ lat: coords.lat, lng: coords.lng })
            .then((result) => {
                console.log('result=' + JSON.stringify(result));
                this.locAddress = result.label;
            })
            .catch((error) => {

            });
            */
        });
    }

    setModeInit() {
        console.log('setModeInit() ...');
        this.mode = MODE.INIT;
    }

    isModeTrack() {
        return this.mode === MODE.TRACK;
    }

    setModeTrack() {
        console.log('setModeTrack() ...');
        this.mode = MODE.TRACK;
    }

    isModeRecord() {
        return this.mode === MODE.RECORD;
    }

    setModeRecord() {
        console.log('setModeRecord() ...');
        this.mode = MODE.RECORD;

    }


    isModeSuggest() {
        return this.mode === MODE.SUGGEST;
    }

    setModeSuggest() {
        console.log('setModeSuggest() ...');
        this.mode = MODE.SUGGEST;

    }

    setModeCenter() {
        console.log('setModeCenter() ...');
        this.mode = MODE.CENTER;

    }

    showCenterCrosshair() {
        console.log('ps2BaseMap: showCenterCrosshair');
        this.crosshairLayer.clearLayers();
        this.crosshairLayer.addLayer(this.crosshairMarker);
    }

    hideCenterCrosshair() {
        this.crosshairLayer.clearLayers();
    }

    adjustCenterCrosshair() {
        if (this.crosshairLayer.hasLayer(this.crosshairMarker)) {
            this.crosshairMarker.setLatLng(this.map.getCenter());
        }
        else {
            this.showCenterCrosshair();
        }

    }

    centerOnLocation() {
        console.log('centerOnLocation invoked...');
        this.setModeCenter();
        this.showCenterCrosshair();
        this.map.setView(this.currPos);

    }

    centerOnRecord() {
        console.log('centerOnRecord invoked...');
        if ((this.currAddress != null) && (this.currAddress.latitude != null) && (this.currAddress.longitude != null)) {
            this.setModeRecord();
            this.map.setView([this.currAddress.latitude, this.currAddress.longitude]);
        }
    }

    saveLocation() {
        console.log('saveLocation invoked...');

        this.hideCenterCrosshair();

        this.locAddress = null;
        this.currAddress = this.crosshairAddress;
        this.recPos = [this.crosshairAddress.latitude, this.crosshairAddress.longitude];


        var recordMarker = new L.marker(this.recPos);
        this.recordLayer.clearLayers();
        this.recordLayer.addLayer(recordMarker);

        const selectedEvent = new CustomEvent('setcrosshair', { detail: this.crosshairAddress });
        this.dispatchEvent(selectedEvent);
    }

    geocodeAddress(addrStr) {
        console.log('geocodeAddress=[' + addrStr + ']');
        var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?singleLine=' + encodeURIComponent(addrStr) + '&f=json&maxLocations=1';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.candidates != null && data.candidates.length > 0) {
                    //this.map.setView([data.candidates[0].location.y, data.candidates[0].location.x], 18);
                    //this.map.panTo([data.candidates[0].location.y, data.candidates[0].location.x]);
                    this.searchValue = '';
                    this.addressSuggestions = null;
                    this.suggestAddress = [data.candidates[0].location.y, data.candidates[0].location.x];
                    console.log('zoom=' + this.map.getZoom());

                    this.map.flyTo(this.suggestAddress, 17);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }

    reverseGeocode(lat, lng) {
        console.log('reverseGeocode=[' + lat + ',' + lng + ']');
        var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=' + lng + ',' + lat + '&f=json';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);

                this.crosshairAddress = {};
                this.crosshairAddress.label = '';
                this.crosshairAddress.fullAddress = '';
                this.crosshairAddress.street = data.address.Address;
                this.crosshairAddress.city = data.address.City;
                this.crosshairAddress.state = data.address.RegionAbbr;
                this.crosshairAddress.postal = data.address.Postal;
                //this.crosshairAddress.latitude = data.location.y;
                //this.crosshairAddress.longitude = data.location.x;
                this.crosshairAddress.latitude = lat;
                this.crosshairAddress.longitude = lng;
                this.crosshairAddress.wkid = data.location.spatialReference.wkid;

                if (data.address.Address != null && data.address.Address != '') {
                    this.crosshairAddress.fullAddress = data.address.Address + ', ' + data.address.City + ', ' + data.address.RegionAbbr + ' ' + data.address.Postal;
                    this.crosshairAddress.label = this.crosshairAddress.fullAddress;
                }
                else {
                    this.crosshairAddress.label = '[' + data.location.y.toFixed(6) + ',' + data.location.x.toFixed(6) + ']';
                }

                this.locAddress = this.crosshairAddress.label;
            })
            .catch((error) => {
                console.log(error);
            });
    }

    handleSearchChange(event) {
        console.log('handleSearchChange...');

        const searchStr = event.detail.value;
        console.log('searchStr=' + searchStr);

        if (searchStr != null && searchStr.length >= 3) {
            console.log('do a search');
            this.getAddressSuggestions(searchStr);
        }
        else {
            this.addressSuggestions = null;
        }
    }

    handleSuggestionSelect(event) {
        console.log('handleSuggestionSelect...');

        const magicKey = event.target.getAttribute('data-item');
        const textStr = event.target.innerText;
        console.log('magicKey=' + magicKey);
        console.log('textStr=' + textStr);


        this.mode = MODE.SUGGEST;
        //this.geocodeAddress(textStr);

        this.getSuggestDetails(textStr, magicKey);
    }

    getAddressSuggestions(searchStr) {
        console.log('mapCenter=[' + this.map.getCenter().lng + ',' + this.map.getCenter().lat + ']');
        var location = '{"x":' + this.map.getCenter().lng + ',"y":' + this.map.getCenter().lat + ',"spatialReference":{"wkid":4326}}';
        var searchExtent = '{"xmin" : ' + (this.map.getCenter().lng - 0.6) + ', "ymin" : ' + (this.map.getCenter().lat - 0.6) + ', "xmax" : ' + (this.map.getCenter().lng + 0.6) + ' , "ymax" : ' + (this.map.getCenter().lat + 0.6) + ', "spatialReference" : {"wkid" : 4326} }';
        console.log('searchExtent=' + searchExtent);

        var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&category=Address&maxSuggestions=10&text="' + encodeURIComponent(searchStr) + '"&searchExtent=' + encodeURIComponent(searchExtent);
        //var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&category=Address&text=' + searchStr ;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(JSON.stringify(data.suggestions));

                this.addressSuggestions = [];
                if (data.suggestions.length > 0) {
                    for (let i = 0; i < data.suggestions.length; i++) {
                        this.addressSuggestions = data.suggestions;
                    }
                }

                //this.getSuggestDetails(data.suggestions[0].text, data.suggestions[0].magicKey);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    getAddressSuggestions2(textStr) {
        var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?singleLine="' + textStr + '"&category=Address&f=json';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    getSuggestDetails(textStr, magicKey) {
        var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine="' + textStr + '"&magicKey="' + magicKey + '"&f=json';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);

                if (data.candidates != null && data.candidates.length > 0) {
                    //this.map.setView([data.candidates[0].location.y, data.candidates[0].location.x], 18);
                    //this.map.panTo([data.candidates[0].location.y, data.candidates[0].location.x]);
                    this.searchValue = '';
                    this.addressSuggestions = null;
                    this.suggestAddress = [data.candidates[0].location.y, data.candidates[0].location.x];
                    console.log('zoom=' + this.map.getZoom());

                    const addr = this.parseAddress(data.candidates[0].address);
                    if (addr) {
                        this.crosshairAddress = {};
                        this.crosshairAddress.label = data.candidates[0].address;
                        this.crosshairAddress.fullAddress = data.candidates[0].address;
                        this.crosshairAddress.street = addr.street;
                        this.crosshairAddress.city = addr.city;
                        this.crosshairAddress.state = addr.state;
                        this.crosshairAddress.postal = addr.postal;
                        this.crosshairAddress.latitude = data.candidates[0].location.y;
                        this.crosshairAddress.longitude = data.candidates[0].location.x;
                        this.crosshairAddress.wkid = 4326;

                        this.locAddress = this.crosshairAddress.label;
                    }

                    this.map.flyTo([this.crosshairAddress.latitude, this.crosshairAddress.longitude], 17);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }

    parseAddress(addrStr) {
        var addr = null;

        var parts = addrStr.split(',');

        if (parts.length == 4) {
            addr = {};
            addr.street = parts[0].trim();
            addr.city = parts[1].trim();
            addr.state = parts[2].trim();
            addr.postal = parts[3].trim();
        }

        return addr;
    }
}