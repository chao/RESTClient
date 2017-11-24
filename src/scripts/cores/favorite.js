var dropzone;
var onFavoriteFileDropped = function(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;
    console.log(files);
    var filetypes = [];
    var filesizes = [];
    _.each(files, function(file) {
        if (file.type != "application/json")
        {
            filetypes.push(file.name);
        }
        if (file.size > 5 * 1024 * 1024) {
            filesizes.push(file.name);
        }
    });
    var errors = '';
    if (filesizes.length > 0)
    {
        var isOrAre = filesizes.length == 1 ? ' is' : ' are';
        errors += "File: " + filesizes.join(', ') + isOrAre + " too large. ";        
    }
    if (filetypes.length > 0) {
        var isOrAre = filetypes.length == 1 ? ' is' : ' are';
        errors = errors === '' ? errors : errors + '<br />';
        errors += "File: " + filetypes.join(', ') + isOrAre + " not JSON format. ";
    }
    if(errors !== '')
    {
        $('#modal-file-import').modal('hide');
        toastr.error(errors, 'Cannot import favorite files', { "timeOut": "15000" });
        return false;
    }
}

dropzone = document.getElementById("dropzone-import");
dropzone.addEventListener("dragend", function (e) { e.stopPropagation(); e.preventDefault(); }, false);
dropzone.addEventListener("dragover", function (e) { e.stopPropagation(); e.preventDefault(); }, false);
dropzone.addEventListener("drop", onFavoriteFileDropped, false);