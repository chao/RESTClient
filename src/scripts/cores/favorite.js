/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2017, Chao ZHOU (chao@zhou.fr). All rights reserved.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */
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
            errors += browser.i18n.getMessage("jsFavoriteFileTooLarge", [filetypes.join(', '), isOrAre]);
        }
        if (filetypes.length > 0) {
            var isOrAre = filetypes.length == 1 ? ' is' : ' are';
            errors = errors === '' ? errors : errors + '<br />';
            errors += browser.i18n.getMessage("jsFavoriteFileNotJsonFormat", [filetypes.join(', '), isOrAre]);
        }
        if (errors !== '') {
            toastr.error(errors, browser.i18n.getMessage("jsFavoriteCannotImport"), { "timeOut": "15000" });
            return false;
        }
        _.each(files, function (file) {
            toastr.info(browser.i18n.getMessage("jsFavoriteStartToImport"), file.name);
            Favorite.favoriteReader.onloadend = (function (file) {
                return function (e) {
                    console.log(e);
                    console.log(file);
                    var content = this.result;
                    try{
                        var data = JSON.parse(content);
                        Database.importRequests(data, file.name).then(function(e){
                            toastr.success(browser.i18n.getMessage("jsFavoriteImportSuccess"), file.name);
                            $(document).trigger('favorite-requests-loaded');
                        });
                    }
                    catch(e)
                    {
                        toastr.error(browser.i18n.getMessage("jsFavoriteFormatError"), file.name);
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