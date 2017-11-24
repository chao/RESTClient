let Favorite = {
    dropzone: null,
    favoriteReader: null,

    _doNothing(e) {
        e.stopPropagation(); 
        e.preventDefault();
    },

    _fileDropped(e) {
        e.stopPropagation();
        e.preventDefault();

        var dt = e.dataTransfer;
        var files = dt.files;
        console.log(files);
        var filetypes = [];
        var filesizes = [];
        _.each(files, function (file) {
            if (file.type != "application/json") {
                filetypes.push(file.name);
            }
            if (file.size > 5 * 1024 * 1024) {
                filesizes.push(file.name);
            }
        });
        $('#modal-file-import').modal('hide');
        var errors = '';
        if (filesizes.length > 0) {
            var isOrAre = filesizes.length == 1 ? ' is' : ' are';
            errors += "File: " + filesizes.join(', ') + isOrAre + " too large. ";
        }
        if (filetypes.length > 0) {
            var isOrAre = filetypes.length == 1 ? ' is' : ' are';
            errors = errors === '' ? errors : errors + '<br />';
            errors += "File: " + filetypes.join(', ') + isOrAre + " not JSON format. ";
        }
        if (errors !== '') {
            toastr.error(errors, 'Cannot import favorite files', { "timeOut": "15000" });
            return false;
        }
        _.each(files, function (file) {
            toastr.info('Start to import...', file.name);
            Favorite.favoriteReader.onloadend = (function (file) {
                return function (e) {
                    console.log(e);
                    console.log(file);
                    var content = this.result;
                    try{
                        var data = JSON.parse(content);
                        Database.importRequests(data).then(function(e){
                            toastr.success("The file has been successfully imported", file.name);
                        });
                    }
                    catch(e)
                    {
                        toastr.error('Format error', file.name);
                    }
                };
            })(file);
            Favorite.favoriteReader.readAsText(file);
        });
    },

    init() {
        this.favoriteReader = new FileReader();

        this.dropzone = document.getElementById("dropzone-import");
        this.dropzone.addEventListener("dragend", this._doNothing, false);
        this.dropzone.addEventListener("dragover", this._doNothing, false);
        this.dropzone.addEventListener("drop", this._fileDropped, false);
    },
}
Favorite.init();