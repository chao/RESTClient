export function onXhrMessage(oEvent)
{
  var request = oEvent.data;
  console.log(`[onXhrMessage]`, oEvent);

  if (request.action == "update-progress-label")
  {
    $('.current-request-status').html(browser.i18n.getMessage(request.data));
    return false;
  }

  if (request.action == "update-progress-bar") {
    $('[role="progressbar"]')
      .addClass('progress-bar-animated')
      .attr('aria-valuenow', request.data)
      .css('width', request.data + '%');
    return false;
  }

  if (request.action == "set-progress-bar-animated") {
    $('[role="progressbar"]').addClass('progress-bar-animated')
      .attr('aria-valuenow', '100')
      .css('width', '100%');
    $('.current-request-status').html(browser.i18n.getMessage(request.data));
    return false;
  }

  if (request.action == "hide-overlay") {
    $(document).trigger("hide-fullscreen");
    return false;
  }


  if (request.action == "http-request-load") {
    var mime = false;
    $(document).trigger("hide-fullscreen");
    $('#response-headers ol').empty();
    if (request.data && request.data.headers) {
      _.each(request.data.headers, function (header) {
        var span = $('<span class="d-flex"></span>');
        span.append($('<span class="header-name"></span>').text(header['key']));
        span.append($('<span class="header-split">: </span>'));
        span.append($('<span class="header-value"></span>').text(header['value']));
        var li = $('<li></li>').append(span);
        $('#response-headers ol').append(li);

        if (header['key'].toLowerCase() == 'content-type') {
          mime = header['value'];
        }
      });
    }

    var body = request.data.body || '';
    $(document).trigger('update-response-body', [mime, body]);
    return false;
  }

  if (request.action == "abort-http-request") {
    toastr.warning(
      browser.i18n.getMessage("jsMessageAbortRequest", [$('#request-method').val(), $('#request-url').val()])
    );
    return false;
  }

  if (request.action == "http-request-timeout") {
    $(document).trigger("hide-fullscreen");
    toastr.error(
      browser.i18n.getMessage("jsMessageTimeOut", [$('#request-method').val(), $('#request-url').val()])
    );
    return false;
  }

  if (request.action == "http-request-error") {
    $(document).trigger("hide-fullscreen");
    let url = $('#request-url').val();
    if (typeof request.data.readyState !== 'undefined' && request.data.readyState == 4
      && typeof request.data.status != 'undefined' && request.data.status == 0
      && url.toLowerCase().indexOf('https://') == 0) {
      $('#modal-https').data('url', url).modal('show');
      return false;
    }
    let title = typeof request.data.title == 'undefined' ? browser.i18n.getMessage("jsMessageError") : request.data.title;
    let content = typeof request.data.detail == 'undefined' ? browser.i18n.getMessage("jsMessageErrorDetail") : request.data.detail;
    toastr.error(content, title);
    return false;
  }

  if (request.action == "start-counting") {
    $(document).trigger('start-counting');
    return false;
  }
}