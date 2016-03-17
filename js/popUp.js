var chrome = window.chrome, $ = window.$;
var assign = Object.assign;
var immutable = function (source, target) {
    var type = Object.prototype.toString.call(source);
    if (type === "[object Array]") {
        return [].concat(source, target);
    }
    else if (type === "[object Object]") {
        return assign({}, source, target);
    }
    else {
        return undefined;
    }
};
var PopUp = (function () {
    function PopUp() {
        this.onOpened();
        this.listenToEvent();
        this.tabHandler();
        this.setFormValue();
        this.editSettingsHandler();
        this.handleViewLogTabOnClick();
        this.handleSubmitQuickLog();
        this.seedWorkingTimeOption();
    }
    PopUp.prototype.loopingTime = function (time) {
        var splitTime = time.split(":");
        var hours = splitTime[0] * 3600000;
        var minutes = splitTime[1] * 60000;
        var totalTime = hours + minutes;
        var ms = 30 * 60000;
        var totalLoop = parseInt((totalTime / ms).toFixed(0));
        var arr = [];
        for (var i = 0; i < totalLoop; ++i) {
            var hour = Math.round((i) / 2);
            var mod = (i) % 2;
            var minutes_1 = void 0;
            if (mod === 0) {
                minutes_1 = 30;
            }
            else {
                minutes_1 = 0;
            }
            arr.push({
                label: this.addZero(hour) + ":" + this.addZero(minutes_1),
                value: (hour * 60) + minutes_1
            });
            if (i === totalLoop - 1) {
                var min = parseInt(splitTime[1]);
                if (min < 30) {
                    arr.push({
                        label: this.addZero(hour) + ":" + this.addZero(min),
                        value: (hour * 60) + min
                    });
                }
                else if (min > 30) {
                    arr.push({
                        label: this.addZero(hour) + ":" + this.addZero(min - 30),
                        value: (hour * 60) + (min - 30)
                    });
                }
            }
        }
        ;
        return arr;
    };
    PopUp.prototype.handleViewLogTabOnClick = function () {
        $("#view-log-tab").on("click", function () {
            // Inform background script that view log page need to refresh
            chrome.runtime.sendMessage({
                type: "viewLogNeedRefresh",
                value: true
            });
        });
    };
    PopUp.prototype.handleSubmitQuickLog = function () {
        $("#submit-quick-log").on("click", function (event) {
            // Inform background script that view log page need to refresh
            chrome.runtime.sendMessage({
                type: "submitLogPageNeedRefresh",
                value: true
            });
            // Show loading part
            $("#tab-submit > *").hide();
            $("#send-log-loading").show();
            event.preventDefault();
        });
        $("#submit-another-log").on("click", function (event) {
            // Show log form
            $("#tab-submit > *").hide();
            $("#send-log-form").show();
            // Reset form value
            $("#desc").val("");
            event.preventDefault();
        });
    };
    PopUp.prototype.seedWorkingTimeOption = function () {
        var arr = [
            "00:15",
            "00:30",
            "00:45",
            "01:00",
            "01:15",
            "01:30",
            "01:45",
            "02:00",
            "02:15",
            "02:30",
            "02:45",
            "03:00",
            "03:15",
            "03:30",
            "03:45",
            "04:00",
            "04:15",
            "04:30",
            "04:45",
            "05:00",
            "05:15",
            "05:30",
            "05:45",
            "06:00",
            "06:15",
            "06:30",
            "06:45",
            "07:00",
            "07:15",
            "07:30",
            "07:45",
            "08:00",
            "08:15",
            "08:30",
            "08:45",
            "09:00",
        ];
        var elmArr = [];
        arr.map(function (time, key) {
            elmArr.push("<option value=\"" + ((key + 1) * 15) + "\">" + time + "</option>");
        });
        $("#working-time").html(elmArr.join(""));
    };
    // Listen to event sent by background page
    PopUp.prototype.listenToEvent = function () {
        var _this = this;
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            // Handle when popup is opened
            switch (request.type) {
                case "onLoading":
                    $("body").addClass("onLoading");
                    break;
                case "loadingFinished":
                    $("body").removeClass("onLoading"); // Remove loading class on  body
                    $("body").addClass(request.value.currentState); // Change body class based on state
                    // If on state hasStarted, play time count
                    if (request.value.currentState === "hasStarted") {
                        _this.playTimeCount(request.value.totalWorkingTime);
                        $("#projects").html(request.value.projects);
                    }
                    break;
                case "viewLogOnLoading":
                    $("#view-logs > div").hide();
                    $("#log-loading").show();
                    break;
                case "viewLogLoadingFinished":
                    $("#view-logs > div").hide();
                    var value = request.value;
                    // Check if value not empty
                    if (value.length) {
                        $("#log-items").html("").fadeIn();
                        value.map(function (log, key) {
                            var html = "<div class=\"log-item\"><div class=\"log-header\">" + log.time + "</div><div class=\"log-content\">" + log.desc + "</div></div>";
                            $("#log-items").append(html);
                        });
                    }
                    else {
                        $("#no-item").fadeIn();
                    }
                    break;
                case "submitLogPageOpened":
                    var tabID = sender.tab.id;
                    var formValue = {
                        project: $("#projects").val(),
                        workingTime: $("#working-time").val(),
                        desc: $("#desc").val()
                    };
                    // Send data back to page
                    chrome.tabs.sendMessage(tabID, {
                        type: "sendLogDataToServer",
                        value: formValue
                    });
                    break;
                case "submitLogStatus":
                    // Close sender tab
                    chrome.tabs.remove(sender.tab.id);
                    // Hide loading icon
                    $("#send-log-loading").hide();
                    if (request.value === "error") {
                        $("#send-log-status .status").html("Error on sending log!");
                    }
                    else {
                        $("#send-log-status .status").html("Success sending log!");
                    }
                    $("#send-log-status").show();
                    break;
                default:
                    break;
            }
            // Send request response
            sendResponse({ request: request, sender: sender });
        });
    };
    PopUp.prototype.editSettings = function (type, key, value) {
        chrome.storage.sync.get('settings', function (data) {
            var settings = data.settings;
            var settingKey = {};
            settingKey[key] = value;
            var dataResult = immutable(settings[type], settingKey);
            var dataResultObj = {};
            dataResultObj[type] = dataResult;
            chrome.storage.sync.set({ 'settings': immutable(settings, dataResultObj) });
        });
    };
    PopUp.prototype.editSettingsHandler = function () {
        var _this = this;
        $(".setting-form").on("change keyup", function (event) {
            var type = $(event.target).data("setting");
            var key = $(event.target).data("key");
            var value;
            if ($(event.target).attr("type") === "checkbox") {
                value = $(event.target)[0].checked;
            }
            else {
                value = $(event.target).val();
            }
            // Update storage
            _this.editSettings(type, key, value);
        });
    };
    PopUp.prototype.setFormValue = function () {
        chrome.storage.sync.get('settings', function (data) {
            var settings = data.settings;
            /*
             * ****
             * Time Up Notifier
             * ****
             */
            // Time Up enabled
            if (settings.timeUpNotifier.enabled) {
                $("#timeUpEnabled").prop('checked', true);
            }
            else {
                $("#timeUpEnabled").prop('checked', false);
            }
            // Time Up time
            $("#timeUpTime").val(settings.timeUpNotifier.time);
            // Time Up notify text
            $("#timeUpText").val(settings.timeUpNotifier.notifyText);
            /*
             * ****
             * Forgot Login Notifier
             * ****
             */
            // Forgot Login enabled
            if (settings.forgotLoginNotifier.enabled) {
                $("#forgotLoginEnabled").prop('checked', true);
            }
            else {
                $("#forgotLoginEnabled").prop('checked', false);
            }
            // Forgot Login time
            $("#forgotLoginTime").val(settings.forgotLoginNotifier.time);
            // Forgot Login notify text
            $("#forgotLoginText").val(settings.forgotLoginNotifier.notifyText);
            /*
             * ****
             * Lunch Time Notifier
             * ****
             */
            // Lunch Time enabled
            if (settings.lunchTimeNotifier.enabled) {
                $("#lunchTimeEnabled").prop('checked', true);
            }
            else {
                $("#lunchTimeEnabled").prop('checked', false);
            }
            // Lunch Time time
            $("#lunchTimeTime").val(settings.lunchTimeNotifier.time);
            // Forgot Login notify text
            $("#lunchTimeText").val(settings.lunchTimeNotifier.notifyText);
            /*
             * ****
             * Bread Time Notifier
             * ****
             */
            // Bread Time enabled
            if (settings.breadTimeNotifier.enabled) {
                $("#breadTimeEnabled").prop('checked', true);
            }
            else {
                $("#breadTimeEnabled").prop('checked', false);
            }
            // Bread Time time
            $("#breadTimeTime").val(settings.breadTimeNotifier.time);
            // Forgot Login notify text
            $("#breadTimeText").val(settings.breadTimeNotifier.notifyText);
        });
    };
    PopUp.prototype.tabHandler = function () {
        $(".tabs > span").click(function () {
            var target = $(this).data("target");
            $(".tabs > span").removeClass("active"); // Remove active class
            $(this).addClass("active"); // Add active class on active tab
            $(".content .tab-content").hide(); // Hide tab content
            $("#" + target).show();
        });
    };
    PopUp.prototype.onOpened = function () {
        // Inform background script that popUp is opened
        chrome.runtime.sendMessage({
            type: "pageOpened",
            value: true
        });
    };
    PopUp.prototype.getTimeDiffs = function (o) {
        o.setSeconds(o.getSeconds() + 1);
        // This is the returning JSON 
        var u = {
            hours: this.addZero(o.getHours()),
            minutes: this.addZero(o.getMinutes()),
            seconds: this.addZero(o.getSeconds())
        };
        return u;
    };
    PopUp.prototype.playTimeCount = function (startWorkingTime) {
        var _this = this;
        var startWorkingDate = this.convertToDate(startWorkingTime);
        var writeTimeToDOM = function () {
            var getTimeDiffs = _this.getTimeDiffs(startWorkingDate);
            var text = getTimeDiffs.hours + ':' + getTimeDiffs.minutes + ':' + getTimeDiffs.seconds;
            $("#total-working-value").text(text);
        };
        writeTimeToDOM();
        setInterval(writeTimeToDOM, 1000);
    };
    PopUp.prototype.convertToDate = function (time) {
        var completeTime = this.getDate("year") + "-" + this.addZero(this.getDate("month") + 1) + "-" + this.addZero(this.getDate("day")) + "T" + time;
        var now = new Date(completeTime);
        var UTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
        return UTC;
    };
    PopUp.prototype.getDate = function (format, date) {
        if (date === void 0) { date = new Date(); }
        switch (format) {
            case "year":
                return date.getUTCFullYear();
            case "month":
                return date.getUTCMonth();
            case "day":
                return date.getUTCDate();
            case "hour":
                return date.getUTCHours();
            case "minute":
                return date.getUTCMinutes();
            case "second":
                return date.getUTCSeconds();
            default:
                return date.getUTCHours();
        }
    };
    PopUp.prototype.addZero = function (x) {
        if (x < 10) {
            return x = '0' + x;
        }
        else {
            return x;
        }
    };
    return PopUp;
}());
new PopUp();
