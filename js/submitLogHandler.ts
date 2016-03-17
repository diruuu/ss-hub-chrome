const {chrome, $}: any = window;

class SubmitLogHandler {
  constructor() {
    this.listenToEvent();
    this.sendState();
  }

  // Send current state to background process
  sendState() {
    chrome.runtime.sendMessage({
      type: "submitLogPageOpened",
      value: true
    });
  }

  sendToServer(value) {
    const submitStatus = (status) => {
      chrome.runtime.sendMessage({
        type: "submitLogStatus",
        value: status
      });
    }
    const addZero = (x) => {
      if (x < 10) {
        return x = '0' + x;
      }
      return x;
    }
    const date = new Date();
    const year = date.getFullYear();
    const month = addZero(date.getMonth() + 1);
    const day = addZero(date.getDate());
    const formattedDate = `${year}-${month}-${day}`;

    if (value.desc !== "" || value.desc === undefined) {
      $.post('http://hub.softwareseni.co.id/staff/s_attendance/add_task_log_shortcut',
        {
          attendance_date: formattedDate,
          projects_id: value.project,
          task_log_time: value.workingTime,
          task_log_description: value.desc,
          task_log_tomorrow: "",
          task_log_question: ""
        },
        function(data) {
          submitStatus("success");
        }
      );
    } else {
      submitStatus("error");
    }
  }

  listenToEvent() {
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        const {value} = request;
        switch (request.type) {
          case "sendLogDataToServer":
            this.sendToServer(value);
            break;
        }
      });
  }
}

// Do checking
new SubmitLogHandler();
