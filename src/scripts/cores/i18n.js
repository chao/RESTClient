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
let i18n = {
  update: function(){
    var elements = document.querySelectorAll('[data-i18n]');
    for(let i = 0; i < elements.length; i++)
    {
      var element = elements[i];
      var i18nName = elements[i].getAttribute('data-i18n');
      var value = browser.i18n.getMessage(i18nName);
      if(!value)
      {
        continue;
      }
      if ( element.tagName != 'INPUT' && element.tagName != 'TEXTAREA' 
                    && !element.hasAttribute("data-i18n-target") )
      {
        element.innerHTML = value;
      }
      else
      {
        if (element.hasAttribute("data-i18n-target"))
        {
          var target = element.getAttribute("data-i18n-target");
          // console.log(`[i18n.js] element: ${i18nName}, target: ${target}`)
          if (element.hasAttribute(target))
          {
            // console.log(`[i18n.js] set attribute value ${value}`);
            element.setAttribute(target, value);
          }
        }
        else
        {
          // console.log(`[i18n.js] set placeholder ${value}`);
          element.setAttribute('placeholder', value);
        }
      }
      // console.log(`[i18n.js] update ${i18nName} to ${value}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', function onReady() {
  document.removeEventListener('DOMContentLoaded', onReady);
  i18n.update();
});