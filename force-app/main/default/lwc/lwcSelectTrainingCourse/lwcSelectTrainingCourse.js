import { LightningElement,api,track } from 'lwc';
import { OmniscriptBaseMixin } from "omnistudio/omniscriptBaseMixin";

const columns = [
    { label: 'Id', fieldName: 'OfferingId' },
    { label: 'Name', fieldName: 'Name' },
    { label: 'Hours', fieldName: 'Hours' },
    { label: 'Start Date', fieldName: 'FormattedDate' },
    { label: 'Start Time', fieldName: 'FormattedTime' },
    { label: 'Location', fieldName: 'Location' },
];

export default class lwcdatatable extends OmniscriptBaseMixin(LightningElement) {
    @track columns = columns;
    _jsonDef;
    _headerJson;
    _omniJsonData;
    _assetDetails; // Needs to match the OS parameter
    
    @api
    set omniJsonDef(json) {
        if(json) {
            this._jsonDef = json;
        }
    }

    get omniJsonDef() {
        return this._jsonDef;
    }

    @api 
    set omniScriptHeaderDef(headerJson) {
        if(headerJson) {
            this._headerJson = headerJson;
        }
    }

    get omniScriptHeaderDef() {
        return this._headerJson;
    }

    @api
    set omniJsonData(omniData) {
        if(omniData) {
            this._omniJsonData = omniData;
        }
    }

    get omniJsonData() {
        return this._omniJsonData;
    }

    // Needs to match the OS parameter
    @api
    set assetDetails(myassets) {
        console.log('### this._assetDetails:  ' + myassets + ';');
        if(myassets) {
            this._assetDetails = myassets;
        }
    }
    
    // Needs to match the OS parameter
    get assetDetails() {
        console.log('$$$ this._assetDetails:  ' + this._assetDetails + ';');
        return this._assetDetails;
    }

    getSelectedName(event) {
        const selectedRows = event.detail.selectedRows;
        // this will update the OS's data json with the last selected row. If you want this selectable items to allow user to select more than one row and write all the selected rows in the data json, then update this
        for (let i = 0; i < selectedRows.length; i++){
            this.omniUpdateDataJson(selectedRows[i].OfferingId);
        }
    }
}