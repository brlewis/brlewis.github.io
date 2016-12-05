var lastNotification = 0;
var watchID = navigator.geolocation.watchPosition(function(pos) {
    var date = new Date();
    if (date.getTime() - lastNotification > 15000) {
        lastNotification = date.getTime();
        self.registration.showNotification(pos.coords.latitude + ' ' + pos.coords.longitude);
    }
});
