var chrome = window.chrome, $ = window.$;
var SubmitLogHandler = (function () {
    function SubmitLogHandler() {
        this.listenToEvent();
        this.sendState();
    }
    // Send current state to background process
    SubmitLogHandler.prototype.sendState = function () {
        chrome.runtime.sendMessage({
            type: "submitLogPageOpened",
            value: true
        });
    };
    SubmitLogHandler.prototype.sendToServer = function (value) {
        var submitStatus = function (status) {
            chrome.runtime.sendMessage({
                type: "submitLogStatus",
                value: status
            });
        };
        var addZero = function (x) {
            if (x < 10) {
                return x = '0' + x;
            }
            return x;
        };
        var date = new Date();
        var year = date.getFullYear();
        var month = addZero(date.getMonth() + 1);
        var day = addZero(date.getDate());
        var formattedDate = year + "-" + month + "-" + day;
        if (value.desc !== "" || value.desc === undefined) {
            $.post('http://hub.softwareseni.co.id/staff/s_attendance/add_task_log_shortcut', {
                attendance_date: formattedDate,
                projects_id: value.project,
                task_log_time: value.workingTime,
                task_log_description: value.desc,
                task_log_tomorrow: "",
                task_log_question: ""
            }, function (data) {
                submitStatus("success");
            });
        }
        else {
            submitStatus("error");
        }
    };
    SubmitLogHandler.prototype.listenToEvent = function () {
        var _this = this;
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            var value = request.value;
            switch (request.type) {
                case "sendLogDataToServer":
                    _this.sendToServer(value);
                    break;
            }
        });
    };
    return SubmitLogHandler;
}());
// Do checking
new SubmitLogHandler();
