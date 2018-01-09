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
var Database = {
    DB_VERSION: 1,
    DB_NAME: 'restclient',

    _db: null,
    _requests: {},
    _tags: {},
    db() {
        return this._db;
    },

    get requests() {
        return this._requests;
    },

    set requests(value) {
        this._requests = value;
    },

    get tags() {
        return this._tags;
    },

    set tags(value) {
        this._tags = value;
    },

    getRequest(name) {
        let request = this.requests.filter(f => f.name === name);
        if (request === undefined) {
            return undefined;
        }
        return Object.assign({}, request);
    },

    getRequestsByTag(tag) {
        return this._requests;
    },
    
    async saveRequest(name, request, skipBackup) {
        if (this._db === null) {
            return;
        }
        if (this._requests[name] && this._requests[name].created_at)
        {
            request.created_at = this._requests[name].created_at;
            request.updated_at = new Date();
        }
        else
        {
            request.created_at = new Date();
            request.updated_at = new Date();
        }
        let tx = this._db.transaction(['requests'], 'readwrite');
        let store = tx.objectStore('requests');
        let result = store.put(request, name);
        result.onsuccess = function() {
            console.log(`[RESTClient][Database.js][saveRequest] on success`, name, request);
            let requests = Database.requests;
            requests[name] = request;
            Database.requests = requests;
            if (request.tags && request.tags.length > 0) {
                _.each(request.tags, function (tag) {
                    Database._tags[tag] = Database._tags[tag] ? Database._tags[tag] + 1 : 1;
                });
            }
            
            console.log(`[RESTClient][Database.js][saveRequest] cache updated`, Database.requests, Database.tags);
        }
        await this._transactionPromise(tx);
        console.log(`[Database.js][saveRequest] new requests loaded`, this._requests);
        if (typeof skipBackup == 'undefined')
        {
            await this._backup(this._requests);
        }
    },

    async removeRequest(name) {
        if (this._db === null) {
            return;
        }
        if(!Database.requests[name])
        {
            return true;
        }
        var request = Database.requests[name];
        if (request.tags && request.tags.length > 0) {
            _.each(request.tags, function (tag) {
                if(Database._tags[tag] == 1)
                {
                    delete Database._tags[tag];
                }
            });
        }
        delete Database._requests[name];
        let tx = this._db.transaction(['requests'], 'readwrite');
        let store = tx.objectStore('requests');
        store.delete(name);
        await this._transactionPromise(tx);
        console.log(`[Database.js][removeRequest] new requests loaded`, this._requests);
        await this._backup(this._requests);
    },

    async init() {
        console.log(`[database.js][init]: initing database...`);
        if (this._db)
            return;
        let { storage } = await browser.storage.local.get({ storage: 'persistent' });
        console.log(`[database.js][init]: opening database in ${storage} storage`);
        let options = { version: this.DB_VERSION };
        if (storage === 'persistent') {
            options.storage = 'persistent';
        }
        console.log(`[database.js][init]: opening database ${this.DB_NAME}.`, options);
        let opener = indexedDB.open(this.DB_NAME, options);

        opener.onupgradeneeded = (event) => this._upgradeSchema(event);
        this._db = await this._requestPromise(opener);
        await this.loadRequests();
        await this._restore();

        var num = (typeof this._requests == 'object') ? Object.getOwnPropertyNames(this._requests).length : 0;
        console.log(`[database.js][init]: opened database with ${num} requests`);
        return this._requests;
    },

    _upgradeSchema(event) {
        console.log(`[RESTClient][database.js]: upgrade from version ${event.oldVersion}`);
        let { result: db, transaction: tx } = event.target;
        let requests;
        switch (event.oldVersion) {
            case 0:
                requests = db.createObjectStore("requests");
                requests.createIndex("idxTagName", "tags", { multiEntry: true });
        }
    },

    // Note: this is resolved after the transaction is finished(!!!) mb1193394
    _requestPromise(req) {
        return new Promise((resolve, reject) => {
            req.onsuccess = (event) => resolve(event.target.result);
            req.onerror = (event) => reject(event.target.error);
        });
    },

    // Note: this is resolved after the transaction is finished(!)
    _transactionPromise(tx) {
        return new Promise((resolve, reject) => {
            let oncomplete = tx.oncomplete;
            let onerror = tx.onerror;
            tx.oncomplete = () => { resolve(); if (oncomplete) oncomplete(); };
            tx.onerror = () => { reject(); if (onerror) onerror(); };
        });
    },

    async loadRequests() {
        if (this._db === null) {
            return;
        }
        this._requests = {};
        let tx = this._db.transaction(['requests'], 'readonly');
        let store = tx.objectStore('requests');
        let request = store.openCursor();
        request.onsuccess = function (event) {
            var cursor = event.target.result;
            // console.log(`[RESTClient][database.js]: Open cursor`, cursor);
            
            if (cursor) {
                Database._requests[cursor.key] = cursor.value;
                if (cursor.value && cursor.value.tags && Array.isArray(cursor.value.tags) && cursor.value.tags.length > 0) {
                    _.each(cursor.value.tags, function(tag) {
                        Database._tags[tag] = Database._tags[tag] ? Database._tags[tag]+1 : 1;
                    });
                }
                cursor.continue();
            } else {
            }
        };
        request.onerror = function (event) {
            console.error(`[database.js][loadRequests]: cannot read request objectstore`, event);
        };
        await Database._transactionPromise(tx);
    },

    async importRequests(data, filename, tags) {
        if (this._db === null) {
            return;
        }
        let tx = this._db.transaction(['requests'], 'readwrite');
        let store = tx.objectStore('requests');
        let imported = 0;
        console.log(`[RESTClient][database.js]: start to import favorite requests.`);
        if(!data.version)
        {
            tags = _.isArray(tags) ? tags : [];

            if (_.isObject(data) && typeof data['requestUrl'] == 'string' && typeof data['requestMethod'] == 'string' && typeof data['requestBody'] == 'string')
            {
                // import from RESTClient 1
                console.log(`[RESTClient][database.js]: saved request from old RESTClient.`, data);
                var request = {
                    "method":  data.requestMethod,
                    "url": data.requestUrl,
                    "body": data.requestBody,
                    "tags": tags,
                    "created_at": new Date(),
                    "updated_at": new Date(),
                };

                if(_.isArray(data.headers))
                {
                    var headers = [];
                    for(var i = 0; i < data.headers.length; i = i + 2)
                    {
                        headers.push({"name": data.headers[i], "value": data.headers[i+1]});
                    }
                    request.headers = headers;
                }
                var ext = filename.lastIndexOf("."); 
                
                var name = (ext > 0) ? filename.substr(0, ext) : filename;
                try {
                    store.put(request, name);
                    imported++;
                } catch (e) {
                    console.error(e);
                }
            }
            else
            {
                // import from RESTClient 2
                console.log(`[RESTClient][database.js]: favorite requests from old RESTClient.`);
                for (let name in data) {
                    let item = data[name];
                    // item.name = name;
                    item.tags = tags;
                    if (typeof item.overrideMimeType != 'undefined') {
                        delete item.overrideMimeType;
                    }
                    console.log(`[RESTClient][database.js]: processing ${imported}.`, item);
                    if (item.headers) {
                        if (item.headers.length > 0) {
                            var headers = [];
                            _.each(item.headers, function (header) {
                                headers.push({ name: header[0], value: header[1] });
                            })
                            item.headers = headers;
                        }
                        else {
                            delete item.headers;
                        }
                    }
                    item.created_at = new Date();
                    item.updated_at = new Date();
                    try {
                        store.put(item, name);
                        imported++;
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

        }
        
        if(data.version && data.version == 1 && data.data)
        {
            console.log(`[RESTClient][database.js]: start to import from version: `, data.version);
            _.each(data.data, function(request, name) {
                item.updated_at = new Date();
                store.put(request, name);
                imported++;
            });
        }
        await this._transactionPromise(tx);
        console.log(`[RESTClient][database.js]: ${imported} requests imported.`);
        if(imported > 0)
        {
            await this.loadRequests();
        }

        console.log(`[Database.js][importRequests] new requests loaded`, this._requests);
        await this._backup(this._requests);
    },

    async _backup(requests) {
        if (typeof requests != 'object')
        {
            console.error('[database.js] Cannot backup database.', requests);
            return false;
        }
        console.debug('[database.js] Backup database now.', requests);
        await browser.storage.local.set({ 'backup': requests });
    },

    async _restore()
    {
        if (typeof this._requests == 'object' && Object.getOwnPropertyNames(this._requests).length > 0) 
        {
            return false;
        }
        console.log(`[database.js][_restore] the database looks empty, testing backups`);
        var result = await browser.storage.local.get({ "backup": [] });
        if (result && result.backup) {
            var keys = Object.getOwnPropertyNames(result.backup);
            console.log(`[database.js][_restore]: ${keys.length} requests found in local storage`);
            for (let key in result.backup)
            {
                if (!result.backup.hasOwnProperty(key)) {
                    continue;
                }
                await this.saveRequest(key, result.backup[key], true);
            }
        }
    }
}

ext.tabs.getCurrent().then(function (tabInfo) {
    if (!tabInfo.incognito) {
        Database.init().then(function () {
            console.log('[database.js] database inited');
            $(document).trigger('favorite-requests-loaded');
        });
    }
}, function (error) {
    console.log(`[database.js] Error: ${error}`);
});