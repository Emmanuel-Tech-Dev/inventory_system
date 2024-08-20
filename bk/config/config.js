let mariadb = require('mariadb');

class Connection {
    static con = null;
    static singleConn = null;
    getConnectionPool(connectionLimit) {
        if (Connection.con == null) {
            console.log('conn created!!!');
            Connection.con = mariadb.createPool({
                host: "localhost",
                user: "root",
                password: "",
                database: "booking",
                connectionLimit: connectionLimit,
                multipleStatements: true
            });
        }
        return Connection.con;
    }

    getConnection() {
        return new Promise(async (resolve, reject) => {
            try {
                // if (!Connection.singleConn) {
                    let conn = await mariadb.createConnection({
                        host: 'localhost',
                        user: 'root',
                        password: '',
                        database: "booking",
                        multipleStatements: true
                    });
                    Connection.singleConn = conn;
                // }
                resolve(conn);
                // resolve(Connection.singleConn);
            } catch (e) {
                reject(e);
            }
        });
    }
}

module.exports = Connection;