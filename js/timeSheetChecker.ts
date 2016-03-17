const {chrome, $}: any = window;

class TimeSheetChecker {
  constructor() {
    this.sendState();
  }

  scrappingData() {
    const dataArr = [];
    $("#detail_report_per_day table tbody tr").each((i, o) => {
      const time = $(o).find("td:eq(1)").text();
      const desc = $(o).find("td:eq(2)").text();
      dataArr.push({
        time: time,
        desc: desc
      });
    });
    return dataArr;
  }

  // Send current state to background process
  sendState() {
    chrome.runtime.sendMessage({
      type: "sendTimeSheetData",
      value: this.scrappingData(),
      tabActive: true
    });
  }
}

// Do checking
new TimeSheetChecker();
