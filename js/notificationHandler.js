var toastr = window.toastr, chrome = window.chrome;
var NotificationHandler = (function () {
    function NotificationHandler() {
        this.listenBackgroundEvent();
    }
    NotificationHandler.prototype.initNotification = function (text) {
        if (text === void 0) { text = 'Are you the 6 fingered man?'; }
        toastr.options.closeButton = true;
        toastr.options.showMethod = 'slideDown';
        toastr.options.hideMethod = 'slideUp';
        toastr.options.closeMethod = 'slideUp';
        toastr.options.positionClass = 'toast-bottom-right';
        toastr.options.preventDuplicates = true;
        toastr.info(text);
    };
    NotificationHandler.prototype.listenBackgroundEvent = function () {
        var _this = this;
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            switch (request.type) {
                case "showNotification":
                    _this.initNotification(request.value);
                    break;
                default:
                    break;
            }
            // Send request response
            sendResponse({ request: request, sender: sender });
        });
    };
    return NotificationHandler;
}());
new NotificationHandler();
