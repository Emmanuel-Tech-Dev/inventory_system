
export default function MyIndexedDB(dbName, version, tables) {
    this.db = null;
    this.connection = null;
    this.isSupported = () => {
        if (window.indexedDB) {
            return true;
        } else {
            return false;
        }
    }

    if (!this.isSupported()) {
        console.log('IndexedDB Feature not supported');
        return;
    }

    this.createDB = () => {
        try {
            this.db = indexedDB.open(dbName, version);
            this.db.onupgradeneeded = (e) => {
                let dbRes = e.target.result;
                this.createTable(dbRes);
            }
            this.db.onsuccess = (e) => {
                let dbRes = e.target.result;
                this.connection = dbRes;
            }
            this.db.onerror = (e) => {
                let err = e.target.errorCode;
            }
            return this;
        } catch (e) {
            console.log(e);
        }
    }


    this.createTable = (dbRes) => {
        try {
            tables.forEach((table) => {
                let tbl = dbRes.createObjectStore(table.tblName, table.tblOpt);
                let indexes = table.tblIndexes;
                if (indexes != null || indexes != undefined) {
                    indexes.forEach((index) => {
                        tbl.createIndex(index.indexName, index.indexName, index.indexOpt);
                    });
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    this.insert = (tblName, mode, data) => {
        return new Promise((resolve, reject) => {
            let timer = setInterval(() => {
                try {
                    if (this.connection) {                        
                        const txn = this.connection.transaction(tblName, mode);
                        const tbl = txn.objectStore(tblName);
                        let query = tbl.put(data);
                        query.onsuccess = (evt) => {                            
                            resolve({ evt, inserted: true });
                        }
                        query.onerror = (evt) => {                            
                            reject(evt.target.errorCode);
                        }
                        query.oncomplete = (evt) => {
                            this.connection.close();
                        }
                        clearInterval(timer);
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 0);
        });
    }

    this.getById = (tblName, mode, id) => {
        return new Promise((resolve, reject) => {
            let timer = setInterval(() => {
                try {
                    if (this.connection) {
                        const txn = this.connection.transaction(tblName, mode);
                        const tbl = txn.objectStore(tblName);
                        let query = tbl.get(id);
                        query.onsuccess = (evt) => {
                            resolve({ data: evt.target.result, evt: evt });
                        }
                        query.onerror = (evt) => {
                            reject(evt.target.errorCode);
                        }
                        query.oncomplete = (evt) => {
                            this.connection.close();
                        }
                        clearInterval(timer);
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 0);
        });
    }

    this.getByIndex = (tblName, mode, index, indexValue) => {
        return new Promise((resolve, reject) => {
            let timer = setInterval(() => {
                try {
                    if (this.connection) {
                        const txn = this.connection.transaction(tblName, mode);
                        const tbl = txn.objectStore(tblName);
                        const indx = tbl.index(index);
                        let query = indx.get(indexValue);
                        query.onsuccess = (evt) => {
                            resolve({ data: evt.target.result, evt: evt });
                        }
                        query.onerror = (evt) => {
                            reject(evt.target.errorCode);
                        }
                        query.oncomplete = (evt) => {
                            this.connection.close();
                        }
                        clearInterval(timer);
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 0);
        });
    }

    this.getAll = (tblName, mode) => {
        let data = [];
        return new Promise((resolve, reject) => {
            let timer = setInterval(() => {
                try {
                    if (this.connection) {
                        const txn = this.connection.transaction(tblName, mode);
                        const tbl = txn.objectStore(tblName);
                        tbl.openCursor().onsuccess = (evt) => {
                            let cursor = evt.target.result;
                            if (cursor) {
                                let item = cursor.value;
                                data.push(item);
                                cursor.continue();
                            }
                        }
                        txn.oncomplete = (evt) => {
                            resolve({ data: data });
                            this.connection.close();
                        }
                        clearInterval(timer);
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 0);
        });
    }

    this.deleteById = (tblName, mode, id) => {
        return new Promise((resolve, reject) => {
            let timer = setInterval(() => {
                try {
                    if (this.connection) {
                        const txn = this.connection.transaction(tblName, mode);
                        const tbl = txn.objectStore(tblName);
                        let query = tbl.delete(id);
                        query.onsuccess = (evt) => {
                            resolve({ data: evt.target.result, evt: evt });
                        }
                        query.onerror = (evt) => {
                            reject(evt.target.errorCode);
                        }
                        query.oncomplete = (evt) => {
                            this.connection.close();
                        }
                        clearInterval(timer);
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 0);
        });
    }

    this.deleteByAny = (tblName, mode, indexName, indexValue) => {
        return new Promise((resolve, reject) => {
            let timer = setInterval(() => {
                try {
                    if (this.connection) {
                        const txn = this.connection.transaction(tblName, mode);
                        const tbl = txn.objectStore(tblName);
                        const index = tbl.index(indexName);
                        let query = index.openCursor(IDBKeyRange.only(indexValue))
                        query.onsuccess = (evt) => {
                            let cursor = query.result;
                            if (cursor) {
                                cursor.delete();
                                cursor.continue();
                            }
                            resolve({ evt: evt, ok: true });
                        }
                        query.onerror = (evt) => {
                            reject({ evt: evt.target.errorCode, ok: false });
                        }
                        query.oncomplete = (evt) => {
                            this.connection.close();
                        }
                        clearInterval(timer);
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 0);
        });
    }

    this.deleteDB = () => {
        return new Promise((resolve, reject) => {
            try {
                let con = indexedDB.deleteDatabase(dbName);
                con.onsuccess = () => {
                    resolve({ status: true });
                }
                con.onerror = (res) => {
                    reject({ status: false, res, msg: 'An error occured' });
                }
                con.onblocked = (res) => {
                    resolve({ msg: 'DB connection blocked', res, status: false });
                }
            } catch (e) {
                console.log(e);
            }
        });
    }

    // this.numRows = (tblName, mode) => {
    //     return new Promise((resolve, reject) => {
    //         let timer = setInterval(() => {
    //             if (this.connection) {
    //                 const txn = this.connection.transaction([tblName], mode);
    //                 const tbl = txn.objectStore(tblName);
    //                 let count = tbl.count();
    //                 count.onsuccess = (evt) => {
    //                     resolve({ data: count.result, evt: evt });
    //                 }
    //                 query.onerror = (evt) => {
    //                     reject(evt.target.errorCode);
    //                 }
    //                 query.oncomplete = (evt) => {
    //                     this.connection.close();
    //                 }
    //                 clearInterval(timer);
    //             }

    //         }, 0);
    //     });
    // }


}//end of function


// let dbName = 'mikee';
// let version = 1;
// let tables = [{
//     tblName: 'contacts',
//     tblOpt: { autoIncrement: true },
//     tblIndexes: [{ indexName: 'email', indexOpt: { unique: true } }, { indexName: 'tel', indexOpt: { unique: true } }]
// }];

// let f = new myIndexedDB(dbName, version, tables).createDB();
// f.insert(tables[0].tblName, 'readwrite', { email: 'sakappiahv@gmail.com', name: 'Michael', 'tel': 12344 }).then((e) => {
//     console.log(e)
// }).catch((e) => {
//     // console.log(e);
// });

// f.getById(tables[0].tblName, 'readonly', 1).then((e) => {
//     // console.log(e)
// });

// f.getByIndex(tables[0].tblName, 'readonly', tables[0].tblIndexes[0].indexName, 'sakappiahv@gmail.com').then((e) => {
//     // console.log(e)
// });



// f.getAll(tables[0].tblName, 'readonly').then((e) => {
//     // console.log(e.data)
// });

// f.deleteById(tables[0].tblName, 'readwrite', 1).then((e) => {
//     // console.log(e)
// });


