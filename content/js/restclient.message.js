/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

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

"use strict";

restclient.message = {
  show: function(arg) {
    //restclient.log(arg);
    var container = $('<div class="alert alert-block fade in"></div>'),
        id = (arg.id) ? arg.id : (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    container.attr('id', id);
    if(arg.class)
      container.addClass(arg.class);

    if(arg.type)
      container.addClass('alert-' + arg.type);
    container.append($('<a class="close" data-dismiss="alert" href="#"></a>').text('x'));

    if(arg.title)
      container.append($('<h4 class="alert-heading" style="margin-bottom: 10px; font-size: 120%;"></h4>').text(arg.title));

    if(typeof arg.message == 'string')
      container.append($('<p style="font-size: 110%;"></p>').text(arg.message));

    if(typeof arg.message == 'object' && arg.message.length > 0)
      for(var i=0, m; m = arg.message[i]; i++)
        container.append($('<p style="font-size: 110%;"></p>').text(m));

    if(arg.buttons){
      var p = $('<div class="btn-toolbar" style="margin-top: 15px; margin-bottom:0px; text-align:right;"></div>');
      for(var i=0, button; button = arg.buttons[i]; i++) {
        if(button instanceof Array)
        {
          var b = $('<div class="btn-group" style="margin-right: 5px;"></div>');
          b.append($('<button class="btn"></button>').addClass(button[0].class).text(button[0].title).bind('click', button[0].callback));
          b.append($('<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>').addClass(button[0].class));
          var ul = $('<ul class="dropdown-menu pull-right"></ul>');
          for(var j=1, but; but = button[j]; j++)
          {
            ul.append($('<li></li>').append($('<a href="#"></a>').text(but.title).bind('click', but.callback)));
          }
          b.append(ul);
          p.append(b);
        }
        else
        {
          var b = $('<button class="btn" style="margin-top: -20px;margin-right: 5px;"></button>');
          b.text(button.title);
          if(button.class)
            b.addClass(button.class);
          if(button.callback)
            b.bind('click', button.callback);
          if(button.timeout)
            b.timedExecute(button.timeout, function() { b.click(); });
          p.append(b);
        }
      }
      container.append(p);
    }
    //restclient.log(container);
    
    if(arg.parent)
    {
      if(arg.exclude === true)
        arg.parent.find('.alert').alert('close').remove();
      
      if(arg.prepend)
        container.prependTo(arg.parent);
      else
        container.appendTo(arg.parent);
    }
    else{
      $('.messages-overlay').show();
      container.appendTo('.messages-overlay .container');
      $('#' + id).bind('closed', function () {
        if($('.messages-overlay .container').find('.alert').length == 1) {
          $('.messages-overlay').hide();
        }

        if(typeof arg.closed == 'function')
          arg.closed.apply(restclient.main, []);
      });
    }
    
    if(typeof arg.timeout === 'number') {
      setTimeout(function(){ container.hide(); }, arg.timeout);
    }
    var animate = arg.animate || 'shake';
    container.addClass('animated ' + animate);
    return container;
  },

  appendMessage: function(alert, message) {
    alert.find('p:last').after($('<p></p>').text(message));
  },

  appendCode: function(alert, code) {
    alert.find('p:last').after($('<p></p>').append($('<pre></pre>').text(code)));
  },

  appendButton: function(alert, button) {
    var p = $('<p></p>'),
        b = $('<a class="btn" style="margin: 5px 5px;"></a>');
    b.text(button.title);
    if(button.class)
      b.addClass(button.class);
    if(button.callback)
      b.bind('click', button.callback);

    if(button.href)
      b.attr('href', button.href).attr('target', '_blank');

    p.append(b);
    alert.find('p:last').after(p);
  }
}

$.fn.timedExecute = function(time, callback) {
  time = time || 3000;
  var seconds = Math.ceil(time / 1000);  // Calculate the number of seconds
  return $(this).each(function() {
    var disabledElem = $(this);
    $(this).data('original-text', $(this).text());
    $(this).text( $(this).text() + ' (' + seconds + ')'); 
    $(this).data('countdown-seconds', seconds);
    
    var interval = setInterval(function() {
      var seconds = disabledElem.data('countdown-seconds'),
          originalText = disabledElem.data('original-text');
      seconds--;
      disabledElem.data('countdown-seconds', seconds);
      disabledElem.text( originalText + ' (' + seconds + ')');  
      if (seconds === 0) {  // once seconds is 0...
        disabledElem.text(originalText);   //reset to original text
        clearInterval(interval);  // clear interval
        if (typeof callback === 'function')
          callback.apply(restclient.main, []);
      }
    }, 1000);
  });
};