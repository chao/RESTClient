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
var Misc = {
    random(size, range) {
        var size = size || 5;
        var result = "";
        var range = range || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < size; i++)
            result += range.charAt(Math.floor(Math.random() * range.length));

        return result;
    },
    timestamp() {
        return Math.floor((new Date()).getTime() / 1000);
    },
    getDateFromTimestamp(unix_timestamp) {
        return new Date(unix_timestamp * 1000);
    },
    insertParam(url, queryVars)
    {
        var firstSeperator = (url.indexOf('?') == -1 ? '?' : '&');
        var queryStringParts = new Array();
        for (var key in queryVars) {
            queryStringParts.push(key + '=' + queryVars[key]);
        }
        var queryString = queryStringParts.join('&');
        return url + firstSeperator + queryString;
    },
    shellescape(a) {
        // function from https://github.com/xxorax/node-shell-escape
        var ret = [];

        a.forEach(function (s) {
            if (/[^A-Za-z0-9_\/:=-]/.test(s)) {
                s = "'" + s.replace(/'/g, "'\\''") + "'";
                s = s.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
                    .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
            }
            ret.push(s);
        });

        return ret.join(' ');
    },
};