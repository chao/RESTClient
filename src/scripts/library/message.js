export function onXhrMessage(oEvent)
{
  let eventData = oEvent.data;
  let action = eventData.action;
  let data = eventData.data;

  if(!action)
  {
    console.error(`[message.js][onXhrMessage]no action`, oEvent);
    return false;
  }

  console.log(`[message.js][onXhrMessage]`, oEvent);

  if (action == "update-progress-label")
  {
    $('.current-request-status').html(browser.i18n.getMessage(data));
    return false;
  }

  if (action == "update-progress-bar") {
    $('[role="progressbar"]')
      .addClass('progress-bar-animated')
      .attr('aria-valuenow', data)
      .css('width', data + '%');
    return false;
  }

  if (action == "set-progress-bar-animated") {
    $('[role="progressbar"]').addClass('progress-bar-animated')
      .attr('aria-valuenow', '100')
      .css('width', '100%');
    $('.current-request-status').html(browser.i18n.getMessage(data));
    return false;
  }

  if (action == "hide-overlay") {
    $(document).trigger("hide-fullscreen");
    return false;
  }


  if (action == "http-request-load") {

    $(document).trigger("hide-fullscreen");
    let response = (data && data.response) ? data.response : false;
    let headers = (data && data.headers) ? data.headers : false;
    let timeCosted = (data && data.timeCosted) ? data.timeCosted : -1;

    let responseType = 'text';
    let mime = 'plain/text';
    if (data && data.responseType)
    {
      responseType = data.responseType;
    }

    if (Array.isArray(headers)) 
    {
      _.each(headers, function (header) {
        var span = $('<span class="d-flex"></span>');
        span.append($('<span class="header-name"></span>').text(header['key']));
        span.append($('<span class="header-split">: </span>'));
        span.append($('<span class="header-value"></span>').text(header['value']));
        var li = $('<li></li>').append(span);
        $('#response-headers ol').append(li);

        if (header['key'].toLowerCase() == 'content-type') {
          var contentType = header['value'].toLowerCase();
          mime = (contentType.indexOf(';') > 0) ? contentType.substr(0, contentType.indexOf(';')) : contentType;
        }
      });
    }

    toastr.success(browser.i18n.getMessage("jsMessageExecutionTime", timeCosted), null, { "positionClass": "toast-bottom-full-width" });
    // console.log(`[message.js][http-request-load]`, mime, responseType, response);
    $(document).trigger('update-response-body', [mime, responseType, response]);
    return false;
  }

  if (action == "abort-http-request") {
    toastr.warning(
      browser.i18n.getMessage("jsMessageAbortRequest", [$('#request-method').val(), $('#request-url').val()])
    );
    return false;
  }

  if (action == "http-request-timeout") {
    $(document).trigger("hide-fullscreen");
    toastr.error(
      browser.i18n.getMessage("jsMessageTimeOut", [$('#request-method').val(), $('#request-url').val()])
    );
    return false;
  }

  if (action == "http-request-error") {
    $(document).trigger("hide-fullscreen");
    let url = $('#request-url').val();
    if (typeof data.readyState !== 'undefined' && data.readyState == 4
      && typeof data.status != 'undefined' && data.status == 0
      && url.toLowerCase().indexOf('https://') == 0) {
      $('#modal-https').data('url', url).modal('show');
      return false;
    }
    let title = typeof data.title == 'undefined' ? browser.i18n.getMessage("jsMessageError") : data.title;
    let content = typeof data.detail == 'undefined' ? browser.i18n.getMessage("jsMessageErrorDetail") : data.detail;
    toastr.error(content, title);
    return false;
  }

  if (action == "start-counting") {
    $(document).trigger('start-counting');
    return false;
  }
}