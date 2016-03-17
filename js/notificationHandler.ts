const {toastr, chrome}: any = window;

class NotificationHandler {
  constructor() {
    this.listenBackgroundEvent();
  }
  initNotification(text = 'Are you the 6 fingered man?') {
    toastr.options.closeButton = true;
    toastr.options.showMethod = 'slideDown';
    toastr.options.hideMethod = 'slideUp';
    toastr.options.closeMethod = 'slideUp';
    toastr.options.positionClass = 'toast-bottom-right';
    toastr.options.preventDuplicates = true;
    toastr.info(text);
  }

  listenBackgroundEvent() {
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        switch (request.type) {
          case "showNotification":
            this.initNotification(request.value);
            break;
          default:
            break;
        }
        // Send request response
        sendResponse({ request: request, sender: sender });
      });
  }
}

new NotificationHandler();
