// function getAccessToken(params)
// {
//     var req = {
//         'client_id': params.client_id,
//         'client_secret': params.client_secret,
//         'grant_type': 'authorization_code'
//     };
//     var url = window.location.href;
//     var code = url.match(/[&\?]code=([^&]+)/)[1];
//     console.log(`[content.js] Get code ${code}`);
//     if (typeof code !== 'string') {
//         alert('Cannot get code from url:' + url);
//         return false;
//     }
//     req['code'] = code;
//     var state = url.match(/[&\?]state=([^&]+)/)[1];
//     console.log(`[content.js] Get state ${state}`);
//     if (typeof state !== 'string') {
//         if(typeof params.result.state == 'string')
//         {
//             state = params.result.state;
//         }
//         else
//         {
//             if (typeof params.state == 'string') {
//                 state = params.state;
//             }
//             else
//             {
//                 state = false;
//             }
//         }
//     }

//     if(state !== false)
//     {
//         req['state'] = state;
//     }

//     if (params.redirection_endpoint)
//     {
//         req['redirect_uri'] = params.redirection_endpoint;
//     }

//     console.log(`[content.js] ready to get access token`, req);

//     var xhr = new XMLHttpRequest();
//     xhr.addEventListener('readystatechange', function (event) {
//         if (xhr.readyState == 4) {
//             if (xhr.status == 200) {
//                 var result = {}, response = xhr.responseText;
//                 result.timestamp = Date.now() / 1000 | 0;
//                 try {
//                     var parsedResponse = JSON.parse(response);
//                     console.log.log(`[content.js] get result from server`, parsedResponse);
//                     if (typeof parsedResponse.access_token === 'string')
//                         result.access_token = parsedResponse.access_token;
//                     if (typeof parsedResponse.refresh_token === 'string')
//                         result.refresh_token = parsedResponse.refresh_token;
//                     if (typeof parsedResponse.expires_in !== 'undefined')
//                         result.expires_in = parsedResponse.expires_in;
//                     if (typeof parsedResponse.token_type !== 'undefined')
//                         result.token_type = parsedResponse.token_type;
//                 } catch (e) {
//                     console.error(e);
//                     result.access_token = response.match(/access_token=([^&]*)/) ? response.match(/access_token=([^&]*)/)[1] : false;
//                     result.refresh_token = response.match(/refresh_token=([^&]*)/) ? response.match(/refresh_token=([^&]*)/)[1] : false;
//                     result.expires_in = response.match(/expires_in=([^&]*)/) ? response.match(/expires_in=([^&]*)/)[1] : false;
//                     result.token_type = response.match(/token_type=([^&]*)/) ? response.match(/token_type=([^&]*)/)[1] : false;
//                 }
//                 console.log(`[content.js] access token get!`, result);
//                 return;
//             }
//         }
//     });
//     if (params.request_method == 'post') {
//         xhr.open('POST', params.token_endpoint, true);
//         xhr.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded;charset=UTF-8');
//         xhr.send($.param(req));
//     } else {

//         var url = params.token_endpoint;
//         if(url.indexOf('?') == -1)
//         {
//             url += '?';
//         }
//         url += $.param(req);
//         xhr.open('GET', url, true);
//         xhr.send();
//     }
// }

function makeRequest(opts) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(opts.method, opts.url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        if (opts.headers) {
            Object.keys(opts.headers).forEach(function (key) {
                xhr.setRequestHeader(key, opts.headers[key]);
            });
        }
        var params = opts.params;
        // We'll need to stringify if we've been given an object
        // If we have a string, this is skipped.
        if (params && typeof params === 'object') {
            params = Object.keys(params).map(function (key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&');
        }
        xhr.send(params);
    });
}
(function () {
    browser.runtime.onMessage.addListener(request => {
        console.log("Get parameters from RESTClient", request.opts);
        return makeRequest(request.opts);
    });
})();
undefined;