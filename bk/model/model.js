

const Connection = require('../config/config');
const Builder = require('../helper/builder');
let mariadb = require('mariadb');
class Model extends Builder {
    constructor(close) {
        super();
        // this.pool = new Connection().getConnectionPool(5);
        this.con = null;
        this.close = true;
        // if (close) this.close = false;
        // this.connectPool();
    }

    async connectPool() {
        this.con = await this.pool.getConnection().catch(e => {});//get connection from connection pool
    }
    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async query() {        
        return new Promise(async (resolve, reject) => {
            let con = null;
            try {
                con = await new Connection().getConnection();                                
                let res = await con.query(this.sql, this.values);                
                resolve(res);
                con.end().then(() => {
                    // console.log('connection closed properly in finally');
                }).catch(err => {
                    // console.log('connection was closed but not due of current end command in finally');
                });
                
            } catch (e) {
                // console.log(e);
                reject(e);
                while (!con) {
                    await this.sleep(3000);
                    this.query();
                }
            } finally {
                con.end();
            }
        });
    }

    async poolQuery() {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    let res = await this.con.query(this.sql, this.values);
                    resolve(res);
                } catch (e) {
                    while (!this.con || !Connection.con) {
                        await this.sleep(3000);
                        this.connectPool();
                        this.query();
                    }
                } finally {
                    if (this.con || Connection.con) {
                        Connection.con.end().then(() => {
                            console.log('static connection closed properly in finally');
                        }).catch(err => {
                            console.log('static connection was closed but not due of current end command in finally');
                        });
                        this.con.end().then(() => {
                            console.log('this connection closed properly in finally');
                        }).catch(err => {
                            console.log('this connection was closed but not due of current end command in finally');
                        });
                    }
                }
            }, 1000);
        });
    }
}//END CLASS
module.exports = Model;