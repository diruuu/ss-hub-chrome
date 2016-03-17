var chrome = window.chrome, $ = window.$;
var TimeSheetChecker = (function () {
    function TimeSheetChecker() {
        this.sendState();
    }
    TimeSheetChecker.prototype.scrappingData = function () {
        var dataArr = [];
        $("#detail_report_per_day table tbody tr").each(function (i, o) {
            var time = $(o).find("td:eq(1)").text();
            var desc = $(o).find("td:eq(2)").text();
            dataArr.push({
                time: time,
                desc: desc
            });
        });
        return dataArr;
    };
    // Send current state to background process
    TimeSheetChecker.prototype.sendState = function () {
        chrome.runtime.sendMessage({
            type: "sendTimeSheetData",
            value: this.scrappingData(),
            tabActive: true
        });
    };
    return TimeSheetChecker;
}());
// Do checking
new TimeSheetChecker();
