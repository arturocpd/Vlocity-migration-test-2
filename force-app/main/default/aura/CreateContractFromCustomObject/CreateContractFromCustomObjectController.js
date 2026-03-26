({

    onInit: function (cmp, event, helper) {
        var createContractAction = cmp.get("c.getCreatedRecord");
        cmp.set("v.Spinner", true);
        createContractAction.setParams({
            sourceRecordId : cmp.get("v.recordId"),
            autoDocgen : "true"
        });

        createContractAction.setCallback(this, function(result) {
            var state = result.getState();
            var response, navLink, pageRef;
            if (state === 'SUCCESS') {
                cmp.set("v.Spinner", false);
            
                response = result.getReturnValue();
                var contractId = response[0];
                var successMessage = response[1] + " created successfully";
                $A.get("e.force:showToast").setParams({
                    mode: 'dismissible',
                    type: "success",
                    message: successMessage,
                    duration: 10000
                }).fire();
                navLink = cmp.find("navLink");
                pageRef = {
                    type: 'standard__recordPage',
                    attributes: {
                        actionName: 'view',
                        objectApiName: 'Contract',
                        recordId : response[0]
                    },
                };
                navLink.navigate(pageRef, true);
            }else{
                cmp.set("v.Spinner", false);
        
                $A.get("e.force:showToast").setParams({
                    mode: 'dismissible',
                    type: "error",
                    message:result.getError() && result.getError()[0] && result.getError()[0].message ? result.getError()[0].message :"Contract creation failed",
                }).fire();
            }
        });
        $A.enqueueAction(createContractAction);
    }
})