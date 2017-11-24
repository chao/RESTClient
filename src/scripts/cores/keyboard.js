$(document).keyup(function (e) {
    
    if (e.keyCode == 27) { 
        console.log(e.keyCode);
        if ($("#btn-abort-request:visible").length > 0)
        {
            $("#btn-abort-request").click();
        }
    }
});

