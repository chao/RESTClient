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
    DB_VERSION: 2,
    DB_NAME: 'restclient',

    _db: null,
    _requests: {},
    _tags: {},
    _migrationNeeded: false,

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
        if (this._migrationNeeded)
        {
            this._requests = await this._migration(this._requests);
        }
        return this._requests;
    },

    _upgradeSchema(event) {
        console.log(`[database.js][_upgradeSchema]: upgrade from version ${event.oldVersion}`);
        let { result: db, transaction: tx } = event.target;
        let requests;
        switch (event.oldVersion) {
            case 0:
                requests = db.createObjectStore("requests");
                requests.createIndex("idxTagName", "tags", { multiEntry: true });
                break;
            default:
                Database._migrationNeeded = true;
                console.log(`[database.js][_upgradeSchema]: set data migration to true`);
        }
    },

    async _migration(result)
    {
        console.log(`[database.js][_migration] Start to migration`, result);
        var requests = {};
        for (let name in result) {
            console.log(`[database.js][_migration] Start to migration: ${name}`, result[name]);
            var request = Schema._v3001(result[name]);
            console.log(`[database.js][_migration] transformed`, request);
            requests[name] = request;
        }
        console.log(`[database.js][_migration] all migrated`, requests);
        let tx = Database._db.transaction(['requests'], 'readwrite');
        var store = tx.objectStore('requests');
        for (let name in requests) {
            console.log(`[database.js][_migration] updating`, name, requests[name]);
            store.put(requests[name], name);
        }
        await this._transactionPromise(tx);
        // Database._backup(requests);
        return requests;
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
        console.log(`[database.js][importRequests]: start to import favorite requests.`, data, filename, tags);

        var requests, func;
        switch (Schema._version(data)) {
            case 'v1001':
                var request = Schema._v1001(data, tags);
                console.log(`[database.js][importRequests]: from version v1001`, request);
                // use filename as request name
                var ext = filename.lastIndexOf(".");
                var name = (ext > 0) ? filename.substr(0, ext) : filename;
                try {
                    store.put(request, name);
                    imported++;
                } catch (e) {
                    console.error(`[database.js][importRequests] from v1001`, e);
                }
                break;
            case 'v2001':
                requests = data;
                func = '_v2001';
            case 'v3001':
                requests = requests || data.data;
                func = func || '_v3001';
                console.trace(`[database.js][importRequests]: from version ${func}`, requests, data);
                for (let name in requests) {
                    var request = Schema[func](requests[name], tags);
                    console.log(`[database.js][importRequests]: from version ${func}`, request);
                    try {
                        store.put(request, name);
                        imported++;
                    } catch (e) {
                        console.error(`[database.js][importRequests] ${func}`, e);
                    }
                }
                break;
            default:
                requests = data.data;
                for (let name in requests) {
                    try {
                        store.put(requests[name], name);
                        imported++;
                    } catch (e) {
                        console.error(`[database.js][importRequests] default`, e);
                    }
                }
                break;
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
    if (tabInfo.incognito == false) {
        Database.init().then(
            function (value) {
                console.log('[database.js] database inited');
                $(document).trigger('favorite-requests-loaded');
            }, function (reason) {
                console.error('[database.js] database cannot inited', reason);
            }
        );
    }
    else
    {
        console.warn('[database.js] You are running in incognito mode.');
    }
}, function (error) {
    console.error(`[database.js] Error: ${error}`);
});