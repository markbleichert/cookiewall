(function() {
    window.cookiewall.init({
        "container": document.body, // not really necessary - this already default
        "type": "popup",
        onStatusChange: function (status) {
            console.log('onStatusChange handler fired with status:  ', status);
        },
        onWallClose: function() {
            console.log('onWallClose handler called..');
        }
    });
})();