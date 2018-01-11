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

var requestHeaders = {
  "Accept": ["application/json", "application/xml", "text/plain", "text/html", "image/jpeg"],
  "Accept-Language": ["en-US", "fr"],
  "Access-Control-Request-Method": ["GET", "POST", "PUT", "DELETE"],
  "Access-Control-Request-Headers": ["Content-Length, Content-Type"],
  "Authorization": [],
  "Cache-Control": ["no-cache"],
  "Connection": ["close", "keep-alive", "Upgrade"],
  "Cookie": [],
  "Content-Length": [],
  "Content-Type": ["application/x-www-form-urlencoded", "text/plain", "text/html", "application/json", "application/javascript", "application/xml", "text/csv", "image/png", "image/jpeg", "image/gif", "multipart/form-data"],
  "Date": [],
  "Expect": ["100-continue"],
  "Forwarded": [],
  "From": [],
  "Host": [],
  "If-Match": [],
  "If-Modified-Since": [],
  "If-None-Match": [],
  "If-Range": [],
  "If-Unmodified-Since": [],
  "Max-Forwards": [],
  "Origin": [],
  "Pragma": ["no-cache"],
  "Proxy-Authorization": [],
  "Range": [],
  "TE": [],
  "User-Agent": [
            "Mozilla/5.0 (Linux; U; Android-4.0.3; en-us; Galaxy Nexus Build/IML74K) AppleWebKit/535.7 (KHTML, like Gecko) CrMo/16.0.912.75 Mobile Safari/535.7",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko",
            "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:48.0) Gecko/20100101 Firefox/48.0",
            "Mozilla/5.0 (iPad; CPU OS 10_0_2 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A456 Safari/602.1",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_2 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A456 Safari/602.1"
        ],
  "Via": [],
  "X-Requested-With": ["XMLHttpRequest"],
  "X-Do-Not-Track": [1],
  "DNT": ["0", "1"],
  "X-Forwarded-For": [],
  "X-Forwarded-Host": [],
  "X-Forwarded-Proto": [],
  "X-Http-Method-Override": ["GET", "POST", "PUT", "DELETE"],
  "X-Csrf-Token": [],
  "X-XSRF-TOKEN": [],
  "X-CSRFToken": [],
  "X-Request-ID": [],
  "X-Correlation-ID": []
};

var bannedHeaders = [
  'referer', 'accept-charset', 'accept-encoding', 'access-control-request-headers', 
  "access-control-request-method", "connection", "content-length", "cookie", "cookie2", 
  "date", "dnt", "expect", "host", "keep-alive", "origin", 
  "referer", "te", "trailer", "transfer-encoding", "upgrade", "via"
];

