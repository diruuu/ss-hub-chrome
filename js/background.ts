const {chrome, Notification}: any = window;

class Background {
  // public timeScrappingURL = "http://localhost/ss-hub-fake/after-start.html";
  // public viewLogURL = "http://localhost/ss-hub-fake/timesheet.html";
  // public submitLogURL = "http://hub.softwareseni.co.id/staff/s_attendance/quick_log";

  public timeScrappingURL = "http://hub.softwareseni.co.id/pages/timesheet";
  public viewLogURL = "http://hub.softwareseni.co.id/pages/my_timesheet_report";
  public submitLogURL = "http://hub.softwareseni.co.id/staff/s_attendance/quick_log";

  constructor() {
    chrome.runtime.onInstalled.addListener(() => {
      this.detectEvent();
      this.detectAlarmEvents();
      this.detectIfStorageChange();
      this.setInitialData();
    });
  }
  // Init initial data
  setInitialData() {
    const settings = {
      timeUpNotifier: {
        enabled: true,
        time: "17:00",
        notifyText: "It's time to go home. Thanks for today!"
      },
      forgotLoginNotifier: {
        enabled: true,
        time: "07:50",
        notifyText: "You forgot to login on SS Hub. Login now buddy!"
      },
      lunchTimeNotifier: {
        enabled: true,
        time: "12:00",
        notifyText: "Take a rest! You are not a robot."
      },
      breadTimeNotifier: {
        enabled: true,
        time: "10:00",
        notifyText: "Bread time! Yeah finally!"
      }
    };

    // Save to chrome storage
    chrome.storage.sync.set({ 'settings': settings }, () => {
      // Init initial notifier handler
      chrome.storage.sync.get('settings', (data) => {
        const {settings} = data;
        this.notifierHandler(settings);
      });
    });
  }

  detectIfStorageChange() {
    chrome.storage.onChanged.addListener(() => {
      chrome.storage.sync.get('settings', (data) => {
        const {settings} = data;
        this.notifierHandler(settings);
      });      
    });
  }

  // Create alarm
  notifierHandler(settings) {
    // Clear all alarms
    chrome.alarms.clearAll();

    // Create alarms
    const alarms = ["timeUpNotifier", "forgotLoginNotifier", "lunchTimeNotifier", "breadTimeNotifier"];
    alarms.map((alarm, key) => {
      if (settings[alarm].enabled && Date.now() < this.getStartingTime(settings[alarm].time)) {
        chrome.alarms.create(alarm, { 
          when: this.getStartingTime(settings[alarm].time),
          periodInMinutes: 1440 
        });
      }
    })
  }

  detectAlarmEvents() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      chrome.storage.sync.get('settings', (data) => {
        const {settings} = data;
        let notifyText;
        switch (alarm.name) {
          case "timeUpNotifier":
            notifyText = settings.timeUpNotifier.notifyText;
            this.exchangeData("showNotification", notifyText, true);
            break;
          case "lunchTimeNotifier":
            notifyText = settings.lunchTimeNotifier.notifyText;
            this.exchangeData("showNotification", notifyText, true);
            break;
          case "breadTimeNotifier":
            notifyText = settings.breadTimeNotifier.notifyText;
            this.exchangeData("showNotification", notifyText, true);
            break;
          case "forgotLoginNotifier":
            notifyText = settings.forgotLoginNotifier.notifyText;
            this.refreshPage(this.timeScrappingURL);
            break;
          default:
            break;
        }
      });
    });
  }

  // Detect event that sent to background process
  detectEvent() {
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        const {value} = request;
        // Handle when popup is opened
        switch (request.type) {
          case "pageOpened":
            this.exchangeData("onLoading", true);
            this.refreshPage(this.timeScrappingURL);
            break;
          case "sendState":
            if (request.tabActive) {
              chrome.tabs.remove(sender.tab.id);
              this.exchangeData("loadingFinished", value);

              // Check if not login
              if (value.currentState === "needLogin") {
                chrome.storage.sync.get('settings', (data) => {
                  // Show a notification if not login
                  this.exchangeData("showNotification", data.settings.forgotLoginNotifier.notifyText, true);
                }); 
              }
            }
            break;
          case "viewLogNeedRefresh":
            this.exchangeData("viewLogOnLoading", true);
            this.refreshPage(this.viewLogURL);
            break;  
          case "sendTimeSheetData":
            if (request.tabActive) {
              chrome.tabs.remove(sender.tab.id);
              this.exchangeData("viewLogLoadingFinished", value);
            }
            break;
          case "submitLogPageNeedRefresh":
            this.refreshPage(this.submitLogURL);
            break;  
          default:
            break;
        }
        // Send request response
        sendResponse({ request: request, sender: sender });
      });
  }
  
  // Send event to popup
  exchangeData(type, value, toActiveTab = false) {
    if (toActiveTab) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: type,
          value: value
        });
      });
      return;
    }
    chrome.runtime.sendMessage({
      type: type,
      value: value
    });
  }

  getStartingTime(time) {
    var completeTime = this.getDate("year") + "-" + this.addZero(this.getDate("month") + 1) + "-" + this.addZero(this.getDate("day")) + "T" + time;
    var now = new Date(completeTime);
    var UTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    return UTC.getTime();
  }

  getDate(format, date = new Date()) {
    switch (format) {
      case "year":
        return date.getFullYear();
      case "month":
        return date.getMonth();
      case "day":
        return date.getDate();
      case "hour":
        return date.getHours();
      case "minute":
        return date.getMinutes();
      case "second":
        return date.getSeconds();
      default:
        return date.getHours();
    }
  }

  addZero(x) {
    if (x < 10) {
      return x = '0' + x;
    } else {
      return x;
    }
  }

  // Handler to refresh page
  refreshPage(url) {
    // Check if tab is exist
    chrome.tabs.query({
      url: url
    }, (tabs) => {
      if (tabs.length > 0) {
        // If tab already opened then reload
        const id = tabs[0].id;
        chrome.tabs.reload(id);
      } else {
        // if not opened then open tab
        chrome.tabs.create({ url: url, active: false });
      }
    });
  }
}

new Background();
