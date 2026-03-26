import { LightningElement, track } from 'lwc';

export default class MyLoadingScreen extends LightningElement {
    @track isLoading = true;
    @track progressValue = 0;
    @track currentAction = 'Starting...';

    connectedCallback() {
        this.performActions();
    }

    async performActions() {
        await this.delayAndUpdateProgress(1000, 'Creating records...');
        await this.delayAndUpdateProgress(1000, 'Updating records...');
        await this.delayAndUpdateProgress(1000, 'Querying for records...');
        await this.delayAndUpdateProgress(1000, 'Searching...');
        await this.delayAndUpdateProgress(1000, 'Comparing...');
        await this.delayAndUpdateProgress(1000, 'Pulling data via API...');
        this.isLoading = false;
    }

    delayAndUpdateProgress(duration, action) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.progressValue += 100 / 6;
                this.currentAction = action;
                resolve();
            }, duration);
        });
    }
}