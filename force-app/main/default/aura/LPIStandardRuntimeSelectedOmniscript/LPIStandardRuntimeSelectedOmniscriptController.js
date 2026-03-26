({
    doInit : function(cmp) {
            var action = cmp.get("c.demoOmniscript");
            console.log("in doInit");
            var OSType = cmp.get("v.Type");
            console.log("OSType is " + OSType);
            action.setParams({OSType: cmp.get("v.Type")});
            
            action.setCallback(this, function(response) {
            console.log("In setCallBack");
            console.log('We have a call back!');
            console.log('Response Vals: [' + response.getReturnValue() + ']');
            var state = response.getState();
            if (state === "SUCCESS") {
                // Alert the user with the value returned 
                // from the server
                
                   var OSDetails = response.getReturnValue();
                var OSType = OSDetails.Type;
                var OSSubtype = OSDetails.SubType;
                var OSLanguage = OSDetails.Language;
                
                console.log("From server: Type is " + OSType + " Subtype is " + OSSubtype + " Language is " + OSLanguage);
                $A.createComponent(
                    "runtime_omnistudio:omniscript",
                    {"type":OSType,
                     "subType": OSSubtype,
                     "language": OSLanguage,
                     "inlineVariant": "brand",
                     "direction":"ltr",
                     "display": "Display OmniScript on page",
                     "theme":"lightning"},
                    function(element, status, errorMessage){
                        if (cmp.isValid() && status == 'SUCCESS'){
                            var body = cmp.get('v.body');
                            body.push(element);
                            cmp.set('v.body', element);
                            
                        }
                        else {
                            console.log("Found a problem: Status is " + status + errorMessage);
                        }
                    }
                );

            }
            else if (state === "INCOMPLETE") {
                // do something
                console.log("In Incomplete section");
            }
            else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + 
                                 errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        
        $A.enqueueAction(action);
    }
    
}
)