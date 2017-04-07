$('.global-nav').hide();
$('.ProfileCanopy').hide();
$('.ProfileSidebar').hide();
$('.stream-item-footer').hide();
var direction = 1;
function go() {
    scrollBy(0, direction);
    if ((scrollY || pageYOffset) === 0 && direction < 0) {
        direction = 1;
    }
    if ((scrollY || pageYOffset) >= 50000 && direction > 0) {
        direction = -1;
    }
}
var interval = setInterval(go, 60);
var interval2 = setInterval(function() { $('.stream-item-footer').hide(); }, 5000);
