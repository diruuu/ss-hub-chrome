const {chrome}: any = window;

class StateChecker {
  constructor() {
    this.sendState();
  }
  // Check current state
  check() {
    const stateIdentifier = [{
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

    const activeState = stateIdentifier.filter((identifier, key) => {
      const {elementID} = identifier;
      if (document.getElementById(elementID) !== null) {
        return true;
      } else {
        return false;
      }
    });
    if (activeState.length > 0) {
      return activeState[0].name;
    }
    return "unknown";
  }
  // Find element on DOM by text containing
  findElementByContain(text) {
    const elm = document.getElementsByTagName("td");
    const searchText = text;
    let found;
    for (var i = 0; i < elm.length; i++) {
      if (elm[i].textContent == searchText) {
        found = elm[i];
        break;
      }
    }
    if (found !== undefined) {
      const parentHTML = found.parentNode.outerHTML;
      return parentHTML.match(/<td>:\s*?(\S.*?)\s*?<\/td>/m)[1];
    }
  }
  // Send current state to background process
  sendState() {
    const value: any = {};
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
  }
}

// Do checking
new StateChecker();
