// *******************************************************************************************
// @Name		    fakeIntegrationCard
// @Author		    Mitch Lynch (mitch.lynch@salesforce.com)
// @Date		    03/19/2023
// @Description	    LWC displays an interactive card that fakes an integration with another system.
// *******************************************************************************************/
// MODIFICATION LOG
// Date			Developer		Story		Description
// 03/20/2023   Mitch Lynch     n/a         Added dynamic icon to list items; added code comments; changed displayButton to displayStartButton to make room for having displayViewRecordButton (for a View Record button at the end of the sequence).
// 03/19/2023	Mitch Lynch     n/a		    Created base component.
// *******************************************************************************************/
// NOTES
// 
// Component was co-created with ChatGPT-4 (my second such component).
// 
// *******************************************************************************************

import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import MULESOFT_ICON from '@salesforce/resourceUrl/MuleSoftIcon';

export default class FakeIntegration extends NavigationMixin(LightningElement) {
    // Properties to control component UI elements
    @track displayText = true;
    @track displaySpinner = false;
    @track displayStartButton = true;
    @track displayRecordButton = false;
    @track displayCompletionMessage = false;
    @track displayProcessingMessage = false;
    @track displayProcessingSection = false;
    @track listItems = [];
    @track buttonLabel = 'Start Process';

    staticRecordId = '0xWHu0000013LIXUAI'; // the recordId you'll redirect the user to when they press the record button

    mulesoftIcon = `${MULESOFT_ICON}#mulesoft`

    // This method is triggered when the button is clicked
    startIntegration() {
        // Hide the text, button, and completion message
        this.displayText = true;
        this.displayStartButton = false;
        this.displayCompletionMessage = false;
        this.listItems = [];

        // Display the spinner and processing section
        this.displaySpinner = true;
        this.displayProcessingSection = true;
        setTimeout(() => {
            // Hide the spinner and display the processing message
            this.displaySpinner = false;
            this.executeSteps(0); // Start the steps execution
        }, 2000);
    }

    // This method is responsible for executing the steps and updating the UI
    executeSteps(step) {
        switch (step) {
            case 0:
                // Display the processing message
                this.displayProcessingMessage = true;
                setTimeout(() => this.executeSteps(1), 500);
                break;
            case 1:
                // Add the first list item
                this.listItems.push({ id: 0, text: 'Verifying eligibility and payment details...', showSuccess: false });
                setTimeout(() => this.executeSteps(2), 2000);
                break;
            case 2:
                // Show the success icon for the first list item
                this.listItems[0].showSuccess = true;
                setTimeout(() => this.executeSteps(3), 500);
                break;
            case 3:
                // Add the second list item
                this.listItems.push({ id: 1, text: 'Sending payment instructions...', showSuccess: false });
                setTimeout(() => this.executeSteps(4), 2000);
                break;
            case 4:
                // Show the success icon for the second list item
                this.listItems[1].showSuccess = true;
                setTimeout(() => this.executeSteps(5), 500);
                break;
            case 5:
                // Add the third list item
                this.listItems.push({ id: 2, text: 'Confirming payment initiated by accounting system...', showSuccess: false });
                setTimeout(() => this.executeSteps(6), 2000);
                break;
            case 6:
                // Show the success icon for the third list item
                this.listItems[2].showSuccess = true;
                setTimeout(() => this.executeSteps(7), 500);
                break;
            case 7:
                // Hide the processing message and show the completion message
                this.displayProcessingMessage = false;
                this.displayCompletionMessage = true;

                // Show the button with an updated label
                this.displayRecordButton = true;
                break;
            default:
                // Log an error message for any unexpected step value that is not handled in the switch statement
                console.error('Invalid step');
                break;
        }
    }

    handleRecordButtonClick() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.staticRecordId,
                actionName: 'view'
            }
        });
    }
}