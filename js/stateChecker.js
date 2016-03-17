var chrome = window.chrome;
var StateChecker = (function () {
    function StateChecker() {
        this.sendState();
    }
    // Check current state
    StateChecker.prototype.check = function () {
        var stateIdentifier = [{
                name: "needLogin",
                elementID: "login"
            }, {
                name: "notStarted",
                elementID: "start_working"
            }, {
                name: "hasStarted",
                elementID: "stop_working"
            }, {
                name: "hasFinished",
                elementID: "continue_working"
            }];
        var activeState = stateIdentifier.filter(function (identifier, key) {
            var elementID = identifier.elementID;
            if (document.getElementById(elementID) !== null) {
                return true;
            }
            else {
                return false;
            }
        });
        if (activeState.length > 0) {
            return activeState[0].name;
        }
        return "unknown";
    };
    // Find element on DOM by text containing
    StateChecker.prototype.findElementByContain = function (text) {
        var elm = document.getElementsByTagName("td");
        var searchText = text;
        var found;
        for (var i = 0; i < elm.length; i++) {
            if (elm[i].textContent == searchText) {
                found = elm[i];
                break;
            }
        }
        if (found !== undefined) {
            var parentHTML = found.parentNode.outerHTML;
            return parentHTML.match(/<td>:\s*?(\S.*?)\s*?<\/td>/m)[1];
        }
    };
    // Send current state to background process
    StateChecker.prototype.sendState = function () {
        var value = {};
        value.currentState = this.check();
        // Add additional value if on state "hasStarted"
        if (this.check() === "hasStarted") {
            value.workingDate = this.findElementByContain("Working Day");
            value.startingTime = this.findElementByContain("Start");
            value.totalWorkingTime = this.findElementByContain("Total Working Time");
            value.projects = document.getElementById("projects_id").innerHTML;
        }
        chrome.runtime.sendMessage({
            type: "sendState",
            value: value,
            tabActive: true
        });
    };
    return StateChecker;
}());
// Do checking
new StateChecker();
