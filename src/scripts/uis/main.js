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

$(function () {


    /**********************FULL Screen Function ********************************/
    $(document).on('start-counting', function (evt, initCount) {
        window.counting = initCount || 0;
        window.timeoutCounting = setInterval(function () {
            window.counting += 0.1;
            $(".div-seconds").text(numeral(window.counting).format("000.0"));
        }, 100);
    });

    $(document).on("show-fullscreen", function () {
        if (window.timeoutCounting) {
            clearInterval(window.timeoutCounting);
        }
        window.counting = 0;
        $(".current-request-basic").text($('#request-method').text() + ' ' + $('request-url').text());
        $(".current-request-status").text(browser.i18n.getMessage("jsMainInitialized"));
        $("#fullscreen-progressbar").show();
    });

    $(document).on("hide-fullscreen", function () {
        if (window.timeoutCounting) {
            clearInterval(window.timeoutCounting);
        }
        $("#fullscreen-progressbar").hide();
    });

    $(document).on('click', "#btn-abort-request", function () {
        $(document).trigger('abort-current-ajax');
        $(document).trigger("hide-fullscreen");
        requestWorker.postMessage("abort-http-request");
    });
    
    /*********************** Toggle REQUEST, RESPONSE, CURL Panel ***************************/
    $(document).on('click', '.btn-toggle-panel', function () {
        var text = $(this).find('span').text();
        if (text == '-') {
            $(this).parents('.row').next().hide();
            $(this).find('span').text('+');
        }
        else {
            $(this).parents('.row').next().show();
            $(this).find('span').text('-');
        }
    });
    $(document).on('click', '[data-action="toggle"]', function () {
        var target = $(this).data('target');
        if (target == '') {
            $('.request-container, .response-container').show();
        }
        else {
            $('.' + target).toggle();
        }
    });

    /******************** Back to Top *************************/
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('#scroll').fadeIn();
        } else {
            $('#scroll').fadeOut();
        }
    });
    $('#scroll').click(function () {
        $("html, body").animate({ scrollTop: 0 }, 600);
        return false;
    });
});