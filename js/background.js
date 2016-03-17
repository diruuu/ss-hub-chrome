var chrome = window.chrome, Notification = window.Notification;
var Background = (function () {
    // public timeScrappingURL = "http://hub.softwareseni.co.id/pages/timesheet";
    // public viewLogURL = "http://hub.softwareseni.co.id/pages/my_timesheet_report";
    // public submitLogURL = "http://hub.softwareseni.co.id/staff/s_attendance/quick_log";
    function Background() {
        var _this = this;
        this.timeScrappingURL = "http://localhost/ss-hub-fake/after-start.html";
        this.viewLogURL = "http://localhost/ss-hub-fake/timesheet.html";
        this.submitLogURL = "http://hub.softwareseni.co.id/staff/s_attendance/quick_log";
        chrome.runtime.onInstalled.addListener(function () {
            _this.detectEvent();
            _this.detectAlarmEvents();
            _this.detectIfStorageChange();
            _this.setInitialData();
        });
    }
    // Init initial data
    Background.prototype.setInitialData = function () {
        var _this = this;
        var settings = {
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
        chrome.storage.sync.set({ 'settings': settings }, function () {
            // Init initial notifier handler
            chrome.storage.sync.get('settings', function (data) {
                var settings = data.settings;
                _this.notifierHandler(settings);
            });
        });
    };
    Background.prototype.detectIfStorageChange = function () {
        var _this = this;
        chrome.storage.onChanged.addListener(function () {
            chrome.storage.sync.get('settings', function (data) {
                var settings = data.settings;
                _this.notifierHandler(settings);
            });
        });
    };
    // Create alarm
    Background.prototype.notifierHandler = function (settings) {
        var _this = this;
        // Clear all alarms
        chrome.alarms.clearAll();
        // Create alarms
        var alarms = ["timeUpNotifier", "forgotLoginNotifier", "lunchTimeNotifier", "breadTimeNotifier"];
        alarms.map(function (alarm, key) {
            if (settings[alarm].enabled && Date.now() < _this.getStartingTime(settings[alarm].time)) {
                chrome.alarms.create(alarm, {
                    when: _this.getStartingTime(settings[alarm].time),
                    periodInMinutes: 1440
                });
            }
        });
    };
    Background.prototype.detectAlarmEvents = function () {
        var _this = this;
        chrome.alarms.onAlarm.addListener(function (alarm) {
            chrome.storage.sync.get('settings', function (data) {
                var settings = data.settings;
                var notifyText;
                switch (alarm.name) {
                    case "timeUpNotifier":
                        notifyText = settings.timeUpNotifier.notifyText;
                        _this.exchangeData("showNotification", notifyText, true);
                        break;
                    case "lunchTimeNotifier":
                        notifyText = settings.lunchTimeNotifier.notifyText;
                        _this.exchangeData("showNotification", notifyText, true);
                        break;
                    case "breadTimeNotifier":
                        notifyText = settings.breadTimeNotifier.notifyText;
                        _this.exchangeData("showNotification", notifyText, true);
                        break;
                    case "forgotLoginNotifier":
                        notifyText = settings.forgotLoginNotifier.notifyText;
                        _this.refreshPage(_this.timeScrappingURL);
                        break;
                    default:
                        break;
                }
            });
        });
    };
    // Detect event that sent to background process
    Background.prototype.detectEvent = function () {
        var _this = this;
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            var value = request.value;
            // Handle when popup is opened
            switch (request.type) {
                case "pageOpened":
                    _this.exchangeData("onLoading", true);
                    _this.refreshPage(_this.timeScrappingURL);
                    break;
                case "sendState":
                    if (request.tabActive) {
                        chrome.tabs.remove(sender.tab.id);
                        _this.exchangeData("loadingFinished", value);
                        // Check if not login
                        if (value.currentState === "needLogin") {
                            chrome.storage.sync.get('settings', function (data) {
                                // Show a notification if not login
                                _this.exchangeData("showNotification", data.settings.forgotLoginNotifier.notifyText, true);
                            });
                        }
                    }
                    break;
                case "viewLogNeedRefresh":
                    _this.exchangeData("viewLogOnLoading", true);
                    _this.refreshPage(_this.viewLogURL);
                    break;
                case "sendTimeSheetData":
                    if (request.tabActive) {
                        chrome.tabs.remove(sender.tab.id);
                        _this.exchangeData("viewLogLoadingFinished", value);
                    }
                    break;
                case "submitLogPageNeedRefresh":
                    _this.refreshPage(_this.submitLogURL);
                    break;
                default:
                    break;
            }
            // Send request response
            sendResponse({ request: request, sender: sender });
        });
    };
    // Send event to popup
    Background.prototype.exchangeData = function (type, value, toActiveTab) {
        if (toActiveTab === void 0) { toActiveTab = false; }
        if (toActiveTab) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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
    };
    Background.prototype.getStartingTime = function (time) {
        var completeTime = this.getDate("year") + "-" + this.addZero(this.getDate("month") + 1) + "-" + this.addZero(this.getDate("day")) + "T" + time;
        var now = new Date(completeTime);
        var UTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
        return UTC.getTime();
    };
    Background.prototype.getDate = function (format, date) {
        if (date === void 0) { date = new Date(); }
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
    };
    Background.prototype.addZero = function (x) {
        if (x < 10) {
            return x = '0' + x;
        }
        else {
            return x;
        }
    };
    // Handler to refresh page
    Background.prototype.refreshPage = function (url) {
        // Check if tab is exist
        chrome.tabs.query({
            url: url
        }, function (tabs) {
            if (tabs.length > 0) {
                // If tab already opened then reload
                var id = tabs[0].id;
                chrome.tabs.reload(id);
            }
            else {
                // if not opened then open tab
                chrome.tabs.create({ url: url, active: false });
            }
        });
    };
    return Background;
}());
new Background();
