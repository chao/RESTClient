$(function () {
    console.log(`[RESTClient][204.js] start migrate 2.0.4`);
    storage.get('migration-2.0.4').then(
        (data) => {
            console.log(`[RESTClient][204.js] load 2.0.4 data`, data);
            var elem = document.getElementById('204-migrate-requests');
            elem.placeholder = elem.placeholder.replace(/\\n/g, '\n');
            if (typeof data == 'undefined' || typeof data['migration-2.0.4'] == 'undefined')
            {
                $('#modal-migrate-204').modal('show');
                $(document).trigger('show-migration-menu');
                return false;
            }
            if (data['migration-2.0.4'] == 'ignore')
            {
                return false;
            }
            
            $(document).trigger('show-migration-menu');
        }
    );

    $(document).on('show-migration-menu', function(){
        ext.tabs.getCurrent().then(function (tabInfo) {
            if (!tabInfo.incognito) {
                $('#nav-migration').show();
            }
        }, function (error) {
            console.log(`[204.js] Error: ${error}`);
        });
    });

    $(document).on('click', '#modal-migrate-204 .btn-ignore', function(e){
        $('#modal-migrate-204').modal('hide');
        storage.set({['migration-2.0.4']: 'ignore'}).then( () => { console.log('[RESTClient][204.js] migration 204 done'); } );
    });

    $(document).on('click', '#modal-migrate-204 .btn-migrate', function (e) {
        var headers = $('#204-migrate-headers').val();
        var urls = $('#204-migrate-urls').val();
        var requests = $('#204-migrate-requests').val();

        if (headers == "" && urls == "" && requests == '')
        {
            toastr.error('Please paste your perference value in the textarea.');
            return false;
        }
        console.log('[204.js] value pasted', headers, urls, requests);
        if (headers != '')
        {
            try{
                headers = JSON.parse(headers);
            }
            catch(e)
            {
                toastr.error('Invalid favorite headers value!');
                return false;
            }
            console.log('[204.js] headers', headers);
            if(!_.isArray(headers) || !_.isArray(headers[0]))
            {
                toastr.error('Favorite headers should be Array value.', 'Invalid headers');
                return false;
            }
            favoriteHeaders = _.isArray(favoriteHeaders) ? favoriteHeaders : [];
            _.each(headers, function(header) {
                var item = { 'name': header[0], 'value': header[1] };
                var idx = _.findIndex(favoriteHeaders, item);
                if(idx >= 0)
                {
                    return false;
                }
                favoriteHeaders.push(item);
            });
            $(document).trigger('init-favorite-headers-dropdown-items', true);
        }

        if (urls != '') {
            try {
                urls = JSON.parse(urls);
            }
            catch (e) {
                toastr.error('Invalid favorite urls value!');
                return false;
            }
            
            if (!_.isArray(urls) || !_.isString(urls[0])) {
                toastr.error('Favorite urls should be Array value.', 'Invalid urls');
                return false;
            }
            favoriteUrls = _.isArray(favoriteUrls) ? favoriteUrls : [];
            favoriteUrls = _.union(favoriteUrls, urls);
            console.log('[204.js] urls', favoriteUrls);
            $(document).trigger('init-favorite-url-dropdown-items', true);
        }

        if (requests != '') {
            try {
                requests = JSON.parse(requests);
            }
            catch (e) {
                toastr.error('Invalid favorite requests value!');
                return false;
            }
            Database.importRequests(requests, null, ['RESTClient2']).then(function (e) {
                toastr.success("RESTClient2 requests imported");
                $(document).trigger('favorite-requests-loaded');
            });
        }

        $('#modal-migrate-204').modal('hide');
        storage.set({ ['migration-2.0.4']: 'imported' }).then(() => { console.log('[RESTClient][204.js] migration 204 done'); });
    });
});