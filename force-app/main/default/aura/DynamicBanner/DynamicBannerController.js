({
    init : function(cmp, evt) {
        
        // Get current user information
        var action = cmp.get("c.getUser");
        var userId = $A.get("$SObjectType.CurrentUser.Id");
        action.setParams({
            "userId": userId
        });
        
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS") {
                cmp.set("v.thisuser", response.getReturnValue());
            }
        });
        
        // Invoke the service
        console.log("Call Apex action");
        $A.enqueueAction(action);
        
        
        // Get active Dynamic Content records
        // where Content_Type__c = Button
            var getbuttons = cmp.get("c.getDynamicContentRecords");
            getbuttons.setParams({
                ParamTag : cmp.get("v.Tag"),
                ParamContentType : "Button"
            })
            getbuttons.setCallback(this, function(data) {
                cmp.set("v.ButtonRecords", data.getReturnValue());
                console.log(data.getReturnValue());
            });
            console.log("Call Apex getbuttons");
            $A.enqueueAction(getbuttons);
        
        
        // Get active Dynamic Content records
        // where Content_Type__c = Content Card
            var getcontentcards = cmp.get("c.getDynamicContentRecords");
            getcontentcards.setParams({
                ParamTag : cmp.get("v.Tag"),
                ParamContentType : "Content Card"
            })
            getcontentcards.setCallback(this, function(data) {
                cmp.set("v.ContentCardRecords", data.getReturnValue());
                console.log(data.getReturnValue());
            });
            console.log("Call Apex getcontentcards");
            $A.enqueueAction(getcontentcards);
        
        
        // Get active Dynamic Content records
        // where Content_Type__c = Metric
            var getmetrics = cmp.get("c.getDynamicContentRecords");
            getmetrics.setParams({
                ParamTag : cmp.get("v.Tag"),
                ParamContentType : "Metric"
            })
            getmetrics.setCallback(this, function(data) {
                cmp.set("v.MetricRecords", data.getReturnValue());
                console.log(data.getReturnValue());
            });
            console.log("Call Apex getmetrics");
            $A.enqueueAction(getmetrics);
    },
    
    
    
    // where Button Type = Flow,
    // opens modal window and
    // runs the flow
    runFlow : function( component, event, helper ) {
        
        let flowName = event.getSource().get( "v.name" );

        component.set( "v.showModal", true );

        $A.createComponent(
            "lightning:flow",
            {
                "onstatuschange": component.getReference( "c.hideModal" )
            },
            ( flow, status, errorMessage ) => {
                if ( status === "SUCCESS" ) {
                    component.set( "v.body", flow );
                    component.set( "v.flow", flow );
                	flow.startFlow( flowName );
                }
            }
        );
    },
    
    
	
    // hides flow modal
    hideModal : function( component, event, helper ) {
        if ( event.getParam( "status" ).indexOf( "FINISHED" ) !== -1 ) {
            component.set( "v.showModal", false );
            component.get( "v.flow" ).destroy();
            $A.get('e.force:refreshView').fire();
        }
    },
    
    
    
    // closes the flow modal when user clicks the close button
    closeModal : function( component, event, helper ) {
        component.set( "v.showModal", false );
        component.get( "v.flow" ).destroy();
    },
    
    
    
    // where Button Type = Link,
    // opens a new browser tab/window and
    // displays the URL
    gotoURL : function (cmp, event, helper) {
        var gotoURL = event.getSource().get("v.name");
        console.log("You are clicking the link button and going to" + gotoURL);
        // alert("You are aclicked gotoURL:  " + gotoURL);
        
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": gotoURL
        });
        urlEvent.fire();
    }
})