var Request = {
    get() {
        var headers = [];

        $(".list-request-headers .badge").each(function (idx, item) {
            var name = $(item).data('name');
            var value = $(item).data('value');
            headers.push({ 'name': name, 'value': value });
        });
        var request = {
            'method': $('#request-method').val(),
            'url': $('#request-url').val(),
            'headers': headers,
            'body': $('#request-body').val(),
            'form': $('#request-body').data('form-data')
        }
        return request;
    }
}