(function() {
    document.write('<div id="inline-cookiewall-container"></div>');

    window.cookiewall.init({
        "container": document.getElementById('inline-cookiewall-container'),
        "type": "inline",
        onStatusChange: function (status) {
            console.log('onStatusChange handler fired with status: ', status);
        }
    });
})();
