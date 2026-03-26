({

    onInit: function (cmp, event, helper) {
        
        var updateContractAction = cmp.get("c.getUpdatedRecord");
        cmp.set("v.Spinner", true);
        updateContractAction.setParams({
            sourceRecordId : cmp.get("v.recordId"),
            autoDocgen : "true"
        });

        updateContractAction.setCallback(this, function(result) {
            var state = result.getState();
            var response;
            if (state === 'SUCCESS') {
                cmp.set("v.Spinner", false);
                
                response = result.getReturnValue();
                $A.get("e.force:showToast").setParams({
                    mode: 'dismissible',
                    type: "success",
                    message: "Contracts Updated Succesfully"
                }).fire();
            }else{
                cmp.set("v.Spinner", false);
                
                $A.get("e.force:showToast").setParams({
                    mode: 'dismissible',
                    type: "error",
                    message: result.getError() && result.getError()[0] && result.getError()[0].message ? result.getError()[0].message :"Error while updating contracts",
                    duration: 10000,
                }).fire();
            }
            $A.get("e.force:closeQuickAction").fire();
        });
        $A.enqueueAction(updateContractAction);
    }
})