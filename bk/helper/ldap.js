const ldap = require('ldapjs');

// const emailSuffix = '@st.aamusted.edu.gh';
// const studentId = 'mike_test';
// const studentDataLDAP = {
//     uid: studentId,
//     cn: 'testing_ldap_add',
//     givenName: 'testing_ldap_add',
//     sn: 'testing_ldap_add',
//     userPassword: studentId,
//     mail: `${studentId}${emailSuffix}`,
//     objectClass: ['top', 'person', 'organizationalPerson', 'inetorgperson']
// };
// const studentDN = "uid=" + studentId + ",ou=Students,ou=People,dc=aamusted,dc=edu,dc=gh";

var LDAP = {
    ldapObject: ldap,
    connect() {
        return new Promise((resolve, reject) => {
            try {
                const client = ldap.createClient(
                    {
                        url: 'ldap://102.176.74.37',
                        reconnect: true
                    });
                client.on('connect', (e) => {
                    if (client.connected) {
                        resolve(client);
                    } else {
                        reject('LDAP client failed to connect to server')
                    }
                });
                client.on('error', (err) => {
                    reject(err);
                });
            } catch (ex) {
                reject(ex.message);
            }
        });
    },

    bind(client, dn = 'cn=Manager,dc=aamusted,dc=edu,dc=gh', password = 'redhat') {
        return new Promise((resolve, reject) => {
            try {
                client.bind(dn, password, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(client);
                    }
                });
            } catch (ex) {
                reject(ex.message);
            }
        });
    },

    // async init() {
    //     let client = await connect().catch(ex => console.log(ex.message));
    //     await bind(client);
    //     // const res = await addLDAP(client, studentDN, studentDataLDAP).catch(ex => console.log(ex.message));
    //     // console.log(res);
    //     // const d = await del(client, studentDN).catch(ex => console.log(ex.message));
    //     // console.log(d);
    //     // const found = await compare(client, studentDN, 'uid', 'test2').catch(ex => console.log(ex));
    //     // console.log('user found :', found);
    //     const up = await update(client, studentDN).catch(ex => console.log(ex));
    //     // console.log(up);
    //     const s = await search(client).catch(ex => console.log(ex.message));
    //     console.log(s.entry);
    //     client.unbind();
    // },

    addLDAP(client, dn, entry) {
        return new Promise((resolve, reject) => {
            try {
                client.add(dn, entry, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve('New person added');
                    }
                });
            } catch (ex) {
                reject(ex.message);
            }
        });
    },

    compare(client, dn, attr, value) {
        return new Promise((resolve, reject) => {
            try {
                client.compare(dn, attr, value, (err, matched) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(matched);
                    }
                });
            } catch (ex) {
                reject(ex.message);
            }
        });
    },

    del(client, dn) {
        return new Promise((resolve, reject) => {
            try {
                client.del(dn, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve('An entry deleted');
                    }
                });
            } catch (ex) {
                reject(ex.message);
            }
        });
    },

    update(client, dn, data = [], operation = 'replace') {
        return new Promise((resolve, reject) => {
            try {                
                client.modify(dn, data, (err) => {                    
                    if (err) {
                        reject(err);
                    } else {
                        resolve('An entry was updated');
                    }
                });
            } catch (ex) {
                reject(ex);
            }
        });
    },

    search(client, studentId, attr = ['cn', 'givenName', 'sn', 'mail', 'uid'], searchOptions = {
        filter: `(uid=${studentId})`,
        // filter:`&(mail=*${emailSuffix})`,
        scope: 'sub',
        attributes: attr
    }, useSearcResult = 1) {
        return new Promise((resolve, reject) => {
            try {
                client.search('dc=aamusted,dc=edu,dc=gh', searchOptions, async (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (useSearcResult) {
                            resolve(await LDAP.searchResult(res));
                        } else {
                            resolve(res);
                        }
                    }
                });
            } catch (ex) {
                reject(ex.message);
            }
        });
    },

    searchResult(res) {
        return new Promise((resolve, reject) => {
            // res.on('searchRequest', (searchRequest) => {
            //     // console.log('searchRequest: ', searchRequest.messageId);
            // });
            res.on('searchEntry', (entry) => {
                resolve({ status: 1, entry: JSON.stringify(entry.pojo) });
            });
            res.on('searchReference', (referral) => {
                // console.log('referral: ' + referral.uris.join());
            });
            res.on('error', (err) => {
                reject(err.message);
            });
            res.on('end', (result) => {
                resolve({
                    status: result.status,
                    matchedDN: result.matchedDN,
                    diagnosticMessage: result.diagnosticMessage,
                    referrals: result.referrals
                });
            });
        });
    },
    async updatePassword(indexNo, newPassword) {
        const client = await LDAP.connect().catch(ex => console.log(ex.message));
        await LDAP.bind(client);
        const change = new LDAP.ldapObject.Change({
            operation: 'replace',
            modification: {
                type: 'userPassword',
                values: [newPassword]
            }
        });
        const studentDN = "uid=" + indexNo + ",ou=Students,ou=People,dc=aamusted,dc=edu,dc=gh";
        const up = await LDAP.update(client, studentDN, [change]).catch(ex => console.log(ex));
        return up;
    },
    async insertLDAPDATA(indexNo, studentDataLDAP) {
        const client = await LDAP.connect().catch(ex => console.log(ex.message));
        await LDAP.bind(client);
        const studentDN = "uid=" + indexNo + ",ou=Students,ou=People,dc=aamusted,dc=edu,dc=gh";
        await LDAP.addLDAP(client, studentDN, studentDataLDAP).catch(ex => console.log(ex.message));
        const s = await LDAP.search(client, indexNo).catch(ex => console.log(ex.message));
        return s;
    },
    async exist(indexNo){
        const client = await LDAP.connect().catch(ex => console.log(ex.message));
        await LDAP.bind(client);
        const s = await LDAP.search(client, indexNo).catch(ex => console.log(ex.message));
        return s;
    },
    async deleteLDAPDATA(indexNo) {
        const client = await LDAP.connect().catch(ex => console.log(ex.message));
        await LDAP.bind(client);
        const studentDN = "uid=" + indexNo + ",ou=Students,ou=People,dc=aamusted,dc=edu,dc=gh";
        const d = await LDAP.del(client, studentDN).catch(ex => console.log(ex.message));
        return d;
    }
}

module.exports = LDAP;
// init();