$("#navBar").load("/templates.html #navBar > *");
$("#browseMaps").load("/templates.html #browseMaps > *", () => {
    $("#map0").load("/templates.html .map-item", () => {
        $("#map1").load("/templates.html .map-item", () => {
            $("#map2").load("/templates.html .map-item", () => {
                $("#map3").load("/templates.html .map-item");
            });
        });
    });
});