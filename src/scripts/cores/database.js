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
    _tags: [],
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
    
    saveRequest(name, request) {

    },

    async removeRequest(name) {
        let tx = this._db.transaction(['requests'], 'readwrite');
        let store = tx.objectStore('requests');
        store.delete(name);
        await this._transactionPromise(tx);
    },

    async init() {
        console.log(`[RESTClient][database.js]: initing database...`);
        if (this._db)
            return;
        let { storage } = await browser.storage.local.get({ storage: 'persistent' });
        console.log(`[RESTClient][database.js]: opening database in ${storage} storage`);
        let options = { version: this.DB_VERSION };
        if (storage === 'persistent') {
            options.storage = 'persistent';
        }
        console.log(`[RESTClient][database.js]: opening database ${this.DB_NAME}.`, options);
        let opener = indexedDB.open(this.DB_NAME, options);

        opener.onupgradeneeded = (event) => this._upgradeSchema(event);
        this._db = await this._requestPromise(opener);
        await this.loadRequests();
        console.log(`[RESTClient][database.js]: opened database with ${this._requests.length} requests`);
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
                    Database._tags = _.union(Database._tags, cursor.value.tags);
                }
                cursor.continue();
            } else {
            }
        };
        request.onerror = function (event) {
            console.error(`[RESTClient][database.js]: cannot read request objectstore`, event);
        };
        await Database._transactionPromise(tx);
    },

    async importRequests(data) {
        if (this._db === null) {
            return;
        }
        let tx = this._db.transaction(['requests'], 'readwrite');
        let imported = 0;
        console.log(`[RESTClient][database.js]: start to import favorite requests.`);
        if(!data.version)
        {
            console.log(`[RESTClient][database.js]: favorite requests from old RESTClient.`);
            for (let name in data) {
                let item = data[name];
                // item.name = name;
                item.tags = [];
                if (typeof item.overrideMimeType != 'undefined')
                {
                    delete item.overrideMimeType;
                }
                console.log(`[RESTClient][database.js]: processing ${imported}.`, item);
                if(item.headers)
                {
                    if(item.headers.length > 0)
                    {
                        var headers = [];
                        _.each(item.headers, function (header) {
                            headers.push({ name: header[0], value: header[1] });
                        })
                        item.headers = headers;
                    }
                    else
                    {
                        delete item.headers;
                    }
                }

                try {
                    tx.objectStore('requests').put(item, name);
                    imported++;
                }catch(e)
                {
                    console.error(e);
                }
            }
        }
        
        if(data.version && data.version == 1 && data.data)
        {
            console.log(`[RESTClient][database.js]: start to import from version: `, data.version);
            _.each(data.data, function(request, name) {
                tx.objectStore('requests').put(request, name);
                imported++;
            });
        }
        await this._transactionPromise(tx);
        console.log(`[RESTClient][database.js]: ${imported} requests imported.`);
        if(imported > 0)
        {
            this.loadRequests();
        }
    },
}
Database.init().then(function(){
    console.log('database inited');
    $(document).trigger('favorite-requests-loaded');
});