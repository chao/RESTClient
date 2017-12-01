$(function () {
    console.log(`[RESTClient][204.js] start migrate 2.0.4`);
    storage.get('migration-2.0.4').then(
        (data) => {
            console.log(`[RESTClient][204.js] load 2.0.4 data`, data);
            if(data && data.migrated )
            {
                return false;
            }
            $('#nav-migration').show();
        }
    );


});