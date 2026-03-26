import { LightningElement } from 'lwc';

export default class Ps2MapTester extends LightningElement {
  setCrosshair(event) {
    console.log('setCrosshair() invoked...');
    console.log(JSON.stringify(event.detail));
  }
}