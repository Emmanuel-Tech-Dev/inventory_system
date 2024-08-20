const axios = require('axios');
const Model = require('../model/model');
const Builder = require('../helper/builder');
const fetch = require('node-fetch');
// const tf = require('@tensorflow/tfjs-node');
const logger = require('morgan');
const sw = require('stopword');
const natural = require('natural');
const aposToLexForm = require('apos-to-lex-form');
const SpellCorrector = require('spelling-corrector');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { response } = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Settings = require('../helper/settings');
const bcrypt = require('bcryptjs');


var Utilities = {
    async getCredentialsMeta(){
        const settings = await Utilities.getSettings(['credentialsMeta']);
        const parsedCredentialsMeta = Object.keys(settings).length ? JSON.parse(settings?.credentialsMeta || "{}") : {};
        return parsedCredentialsMeta;
    },
    transformFieldTo2DArray(data, keyFieldName, propFieldName, valueFieldName) {
        if (data.length === 0) return [];
        const grouped = Utilities.groupBy(data, keyFieldName);
        let result = [];
        let keyValuePairs = {};
        for (let item in grouped) {
            const entries = grouped[item];
            for (let i = 0; i < entries.length; i++) {
                if (i == 0) {//the first row has the fields that are common to all other rows therefore copy those field and delete the items for the first row
                    keyValuePairs = { ...entries[i] };
                    delete keyValuePairs[propFieldName];
                    delete keyValuePairs[valueFieldName];
                }
                keyValuePairs[entries[i][propFieldName]] = entries[i][valueFieldName];
            }
            result.push(keyValuePairs);
        }
        return result;
    },
    async hasPermission(request, response, next) {
        try {
            let table = null;
            if (request?.body?.endpoint?.tbl) {
                table = request?.body?.endpoint?.tbl?.trim()
            } else if (request?.body?.endpoint?.tableName) {
                table = request?.body?.endpoint?.tableName?.trim()
            }
            const endpoint = request.originalUrl.replace('/', '');
            const token = Utilities.extractToken(request);
            const settings = await Utilities.getSettings(['openedEndpoints']);
            if (settings?.openedEndpoints?.split(',')?.includes(endpoint)) {
                next();
                return;
            }
            if (token) {
                const credentialsMeta = await Utilities.getSettings(['credentialsMeta']);
                const parsedCredentialsMeta = Object.keys(credentialsMeta).length ? JSON.parse(credentialsMeta?.credentialsMeta || "{}") : {};
                const keyType = parsedCredentialsMeta?.keyType;

                let adminId = { valid: false, msg: 'Token verification failed' };
                if (keyType == 'asymmetric') {
                    const pubKeyPath = Settings.JWTKEYPATHPUBLIC || Settings.JWTKEYPATH;
                    adminId = Utilities.verifyToken(token, undefined, pubKeyPath);
                } else {
                    const symKey = Settings.JWTSYMKEY;
                    adminId = Utilities.verifyToken(token, symKey);
                }

                if (adminId?.valid) {
                    const res = await Utilities.getAssignedPerms(adminId?.username, endpoint, table ?? null);
                    if (res?.protected?.length >= 1 || res?.opened?.length >= 1) {
                        next();
                        return;
                    } else {
                        response.json({ status: 'Error', msg: `Permission (${endpoint}) not allowed for (${table})` }).end();
                    }
                } else {
                    response.json({ status: 'Error', msg: adminId?.msg }).end();
                    return;
                }
            } else {
                
                response.json({ status: 'Error', msg: `Token not found` }).end();
            }
        } catch (err) {
            response.json({ status: 'Error', msg: err }).end();
        }
    },
    createDir(path = '') {
        fs.mkdirSync(path, { recursive: true });
    },
    generateRSAKeyPair(keysPath = '', publicKeyName = '', privateKeyName = '', modLength = 2048) {
        const publicKeyPath = `${keysPath}/${publicKeyName}`;
        const privateKeyPath = `${keysPath}/${privateKeyName}`;
        if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {//generate if keys not found
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: modLength,  // Length of your key in bits
                publicKeyEncoding: {
                    type: 'spki',//Recommended to use 'spki' for the public key
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',//Recommended to use 'pkcs8' for the private key
                    format: 'pem'
                }
            });
            if (publicKeyPath && privateKeyPath) {
                Utilities.createDir(keysPath);//create folder if not exist
                // Create the public key file
                fs.writeFileSync(publicKeyPath, publicKey);
                // Create the private key file
                fs.writeFileSync(privateKeyPath, privateKey);
            }
            return { publicKey, privateKey };
        } else {
            const publicKey = Utilities.readFileContent(publicKeyPath);
            const privateKey = Utilities.readFileContent(privateKeyPath);
            return { publicKey, privateKey };
        }
    },
    RSAObjectEncrypt(plainObject, publicKey) {
        let result = {};
        for (let key in plainObject) {
            const value = plainObject[key]?.toString() || '';
            result[key] = Utilities.RSAEncrypt(publicKey, value);
        }
        return result;
    },
    RSAObjectDecrypt(encryptedObject, privateKey) {
        let result = {};
        for (let key in encryptedObject) {
            const value = encryptedObject[key]?.toString() || '';
            result[key] = Utilities.RSADecrypt(privateKey, value);
        }
        return result;
    },
    RSAEncrypt(publicKey, data, encoding = 'base64') {
        const res = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(data)
        )
        return res.toString(encoding);
    },
    RSADecrypt(privateKey, encryptedData, cypherTextEncoding = 'base64', plainTextEncoding = 'utf-8') {
        const res = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(encryptedData, cypherTextEncoding)
        )
        return res.toString(plainTextEncoding);
    },

    generateUuid: function () {
        let s = [];
        let hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23];

        let uuid = s.join("");
        return uuid;
    }, //end of function 
    truncateText(text, numChars = 20) {
        let t = text.trim();
        let truncated = t.substring(0, numChars);
        return truncated = `${t.length >= numChars ? truncated + '...' : t} `;
    },
    async generatePasswordHash(password, saltRounds) {
        const salt = await bcrypt.genSalt(parseInt(saltRounds));
        const hash = await bcrypt.hash(password, salt);
        return hash
    },

    readFileContent(path, encoding = '') {
        if (path && fs.existsSync(path)) {
            const res = Buffer.from(fs.readFileSync(path));
            if (encoding) {
                return res.toString(encoding);
            } else {
                return res.toString();
            }
        }
        return '';
    },
    generateUniqueNumericId(prefix = '', length = 6) {
        let id = `${prefix}`;
        const characters = '0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            id += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return id;
    },

    generatePassword(pwdLen = 10, pwdChars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") {
        return randPassword = new Array(pwdLen).fill(0).map(x =>
            (function (chars) {
                let umax = Math.pow(2, 32);
                let r = new Uint32Array(1);
                let max = umax - (umax % chars.length);
                do {
                    crypto.randomFillSync(r);
                } while (r[0] > max);
                return chars[r[0] % chars.length];
            })(pwdChars)).join('');
    },

    async mnotifySms(recipients = [], message) {
        try {
            const endPoint = `${Settings.mnotifySmsHost}${Settings.mnotifySmsKey}`;
            const data = {
                recipient: recipients,
                sender: Settings.mnotifySmsSender,
                message: message,
                is_schedule: false,
                schedule_date: ""
            }
            const headers = {
                'Content-Type': 'application/json',
            }
            const rs = await Utilities.axiosRequest('post', endPoint, data, headers);
            return rs;
        } catch (e) {
            console.log(e);
        }
    },

    async addOrUpdate(table, data, keys, fieldsToRemoves = [], newVals = {}) {
        for (let d of data) {
            for (let i of fieldsToRemoves) {
                delete d[i];
            }

            for (let key in newVals) {
                d[key] = newVals[key];
            }

            let whereCriteria = [];
            if (Array.isArray(keys)) {
                for (let key of keys) {
                    whereCriteria.push({ [key]: d[key] });
                }
            }

            const res = await new Model().select(table, ['id'])
                .where(null, whereCriteria.length ? whereCriteria : [{ [keys]: d[keys] }], '=', whereCriteria.length ? 'AND' : null)
                .query();

            let vals = [];

            for (let v in d) {
                vals.push({ [v]: d[v] });
            }

            if (res.length) {
                if (vals.length) {
                    await new Model().update(table, vals).where(null, [{ id: res[0]?.id }], '=', null).query();
                }
            } else {
                if (vals.length) {
                    const b = Utilities.arrayOfObjectsToSingleObject(vals);
                    const res1 = await new Model().insertSome(table, b).query();
                }
            }
        }
    },

    // Function to merge objects
    arrayOfObjectsToSingleObject(array) {
        // Initialize an empty object
        const mergedObject = {};
        // Iterate over each object in the array
        array.forEach(obj => {
            // Merge properties of current object into the mergedObject
            Object.assign(mergedObject, obj);
        });

        return mergedObject;
    },

    async sendMail(receiver, sender, senderPass, fromCaption, subject, body, callback, type = 'text', host = '') {
        const transporter = nodemailer.createTransport({
            host: host,
            auth: {
                user: sender,
                pass: senderPass
            }
        });

        let mailOptions = {
            from: fromCaption,
            to: receiver,
            subject: subject,
        };

        switch (type) {
            case 'html': {
                mailOptions = { ...mailOptions, html: body };
                break;
            }
            case 'text': {
                mailOptions = { ...mailOptions, text: body }
                break;
            }
        }
        transporter.sendMail(mailOptions, callback);
    },
    getBase64String(str) {
        const a = str.split(';base64,');
        const mime = a[0];
        const base64 = a[1];
        return { mime, base64 };
    },
    async getTotalCount(table, rowId, where = '') {
        let sql = `Select count(${rowId}) as counter from ${table}`;
        if (where) {
            sql += ` WHERE ${where}`;
        }
        const res = await new Model().setSql(sql).query();
        return res;
    },
    getPageRange(current, pageSize, order = 'asc') {
        if (order == 'asc') {
            const end = current * pageSize;
            const start = (end - pageSize) + 1;
            return { start, end };
        } else {
            const start = current * pageSize;
            const end = (start - pageSize) + 1;
            return { start, end };
        }
    },
    diffInMillSeconds(future, present = new Date().getTime(), absolute = true) {
        //  absolute value added incase you just want the diff but don't care which came first
        return absolute ? (Math.abs(future - present)) / 1000 : future - present
    },
    async getAssignedPerms(adminId, permission, table) {
        try {
            const rs = await new Model().multiSelect(['admin', 'admin_perm', 'admin_role', 'admin_role_perm'],
                [
                    ['name', 'staff_id'],
                    ['id', 'permission', 'table_name', 'restricted'],
                    ['custom_id', 'role'],
                    ['role_id', 'permission_id']
                ], null, true)
                .join('admin_role_perm', 'admin_perm', 'permission_id', 'alias', 'INNER JOIN')
                .join('admin_role', 'admin_role_perm', 'custom_id', 'role_id', 'INNER JOIN')
                .join('admin_role_link', 'admin_role', 'role_id', 'custom_id', 'INNER JOIN')
                .join('admin', 'admin_role_link', 'staff_id', 'admin_id', 'INNER JOIN')
                .where(null, [{ 'admin_perm.permission': permission }, { 'admin_perm.table_name': table }, { 'admin.staff_id': adminId }, { 'admin_role_perm.ar_link_restricted': 0 }, { 'admin_perm.restricted': 0 }], '=', "AND")
                .overrideReloperators(['=', '<=>', '=', '=', '='])
                .query();
            const rs1 = await new Model().select('admin_perm', ['permission']).where(null, [{ is_open: 1 }, { permission }], '=', "AND").query();
            return { protected: rs, opened: rs1 };
        } catch (err) {
            console.log(err);
            // res.json({ status: 'Error', msg: 'Operation failed' });
        }
    },
    getDependentsInArrayObject(data, chidIdKey, parentIdKey) {
        let tree = data?.map((r) => {
            r['children'] = [];
            return r;
        });
        //get children
        for (let i = 0; i < tree.length; i++) {
            const child = tree[i][chidIdKey];
            for (let j = 0; j < tree.length; j++) {
                if (j == i) continue;//skip if it's the same category
                if (tree[j][parentIdKey] === child) {//if the i'th category's id happens to a the super_type id of the j'th category. then j depends on i so i is a branch                    
                    tree[i]?.children?.push(tree[j]);
                }
            }
        }
        const newTree = tree.filter((r) => {
            if (!r[parentIdKey]) {
                return r;
            }
        });
        return newTree;
    },
    generateSQLIn(item) {
        let v = item;
        if (Array.isArray(item)) {
            v = '';
            item.forEach((curr, i) => {
                v += `'${curr}'`;
                if (i < item.length - 1) {
                    v += ',';
                }
            });
        }
        return v;
    },

    async getSettings(properties) {
        const res = await Utilities.getRows('settings', ['*'], 'prop', Utilities.generateSQLIn(properties));
        let obj = {};
        res.forEach(v => {
            obj[v?.prop] = v?.value;
        });
        return obj;
    },

    createArrayFromSingleObjectKey(item, key) {
        return item?.map(v => {
            return v[key];
        });
    },

    async getRows(table, columns, where, value) {
        const res = await new Model().setSql(`SELECT ${columns.join(',')} FROM ${table} WHERE ${where} IN (${value})`).query();
        return res;
    },

    getDateTime() {
        const date = new Date();
        const today = `${Utilities.formatDate(date, 'yymmdd', '-')} ${Utilities.getTime(date)}`;
        return today;
    },

    async request(method, url, endpoint, data = {},
        headers = {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`           
        }) {
        try {
            data['endpoint'] = endpoint;
            let params = headers ? {
                method: method.toUpperCase(),
                cache: 'no-cache',
                body: JSON.stringify(data),
                headers: headers,
            } : {
                method: method.toUpperCase(),
                cache: 'no-cache',
                body: JSON.stringify(data),
            };
            if (method.toLowerCase() == 'get') {
                delete params['body'];
            }
            let res = await fetch(url, params);
            // return await res.json();
            return await Utilities.safeParseJSON(res);
        } catch (e) {
            console.error(e);
        }
    },

    async safeParseJSON(response) {
        const body = await response.text();
        try {
            return JSON.parse(body);
        } catch (err) {
            return { response, error: err.message };
        }
    },

    getFilters(filters, filterTypes, customFilter) {
        let like = ``;
        const f = Object.keys(filters);
        f.forEach((prop, i) => {
            if (filters[prop]) {
                const ft = filterTypes ? filterTypes[prop] : '';//use prop in filters to get its filter type 
                const values = filters[prop];
                if (ft === 'IN') {
                    let v = '';
                    values.forEach((curr, i) => {
                        v += `'${curr}'`;
                        if (i < values.length - 1) {
                            v += ',';
                        }
                    });
                    like += ` ${prop} IN (${v})`
                } else {
                    like += ` ( `;
                    values.forEach((v, i) => {
                        like += ` ${prop} LIKE '%${v}%' `;
                        if (i < values.length - 1) {
                            like += ' OR ';
                        }
                    });
                    like += ` ) `;
                }
            }
            if (i < f.length - 1) {
                like += ' AND '
            }
        });
        if (like) {
            if (customFilter) {
                like += ` AND ${customFilter}`;//append custom filter if like and customFilter aren't empty
            }
        } else {
            if (customFilter) {
                like += ` ${customFilter} `;//use custom filter if like is empty and customFilter isn't empty
            }
        }
        return like;
    },
    removeNullFiltersMutated(filters) {
        for (const f in filters) {
            if (!filters[f])
                delete filters[f];
        }
    },
    removeNullFiltersNonMutated(filters) {
        let ff = { ...filters };
        for (const f in ff) {
            if (!ff[f])
                delete ff[f];
        }
        return ff;
    },
    renameFilters(filters, newNames) {
        let newFilters = {};
        for (let filter in filters) {
            const theNewName = newNames[filter];
            if (theNewName) {
                newFilters[theNewName] = filters[filter];
                delete filters[filter];
            }
        }
        return { ...newFilters, ...filters };
    },
    mode(a) {
        a = a.slice().sort((x, y) => x - y);
        var bestStreak = 1;
        var bestElem = a[0];
        var currentStreak = 1;
        var currentElem = a[0];
        for (let i = 1; i < a.length; i++) {
            if (a[i - 1] !== a[i]) {
                if (currentStreak > bestStreak) {
                    bestStreak = currentStreak;
                    bestElem = currentElem;
                }
                currentStreak = 0;
                currentElem = a[i];
            }
            currentStreak++;
        }
        return currentStreak > bestStreak ? currentElem : bestElem;
    },
    signDataWithJWT(data, expires, key, keyOnFile = true, algo = 'RS256') {
        try {
            let token = '';
            if (keyOnFile) {
                key = Utilities.readFileContent(key);
                if (key) {
                    token = jwt.sign(data, key, { expiresIn: expires, algorithm: algo });;
                } else {
                    return { status: false, msg: 'Key not found', token: '' };
                }
            } else {
                token = jwt.sign(data, key, { expiresIn: expires, algorithm: algo });
            }
            return { status: true, msg: 'Operation succesful', token };
        } catch (err) {
            return { status: false, msg: err.message, token: '' };
        }
    },

    extractToken(req, scheme = 'Bearer') {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === scheme) {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    },

    async getDetailsFromToken(req, key, keyOnFile = true) {
        try {
            const token = Utilities.extractToken(req);
            let v = { username: '', valid: false };
            if (token) {
                if (keyOnFile) {
                    v = Utilities.verifyToken(token, undefined, key);
                } else {
                    v = Utilities.verifyToken(token, key);
                }
            }
            return v;
        } catch (err) {
            return { ...v, msg: err.message };
        }
    },
    verifyToken(token, key, keyPath, usernameKey = 'username', algo = 'RS256') {
        try {

            // let cert = key;
            if (keyPath && fs.existsSync(keyPath)) {
                let cert = fs.readFileSync(keyPath);  // get public key
                const j = jwt.verify(token, cert, { algorithms: algo });
                return { valid: true, username: j[usernameKey], ...j }
            } else if (key) {
                const j = jwt.verify(token, key);
                return { valid: true, username: j[usernameKey], ...j }
            } else {
                return { valid: false, msg: 'key not found', username: '' };
            }
        } catch (err) {
            return { valid: false, msg: err.message, username: '' };
        }
    },
    areOverlapping(A, B) {
        if (
            (B.start >= A.start && B.start <= A.end) ||
            (B.end >= A.start && B.end <= A.end) ||
            (A.start >= B.start && A.start <= B.end) ||
            (A.end >= B.start && A.end <= B.end)
        ) {
            return true;
        }
        return false;
    },
    trimChar(str, chars) {//this function was initially called removeComma
        if (str.startsWith(chars) && str.endsWith(chars)) {
            return str.slice(1, -1);
        }
        if (str.startsWith(chars)) {
            return str.slice(1);
        }
        if (str.endsWith(chars)) {
            return str.slice(0, -1);
        }
        return str;
    },
    removeLeadingChar(str, char) {
        if (str.startsWith(char))
            str = str.substring(1);
        return str;
    },
    removeDuplicateObjectsFromArray(rs, key) {
        return rs.filter((v, i, a) => a.findIndex(v2 => (v2[key] === v[key])) === i);
    },
    removeDuplicatesFromArray(arr) {
        return [...new Set(arr)];
    },
    hasDuplicateObjects(array, key) {
        const seen = new Set();
        for (const item of array) {
            const keyValue = key ? item[key] : JSON.stringify(item);
            if (seen.has(keyValue)) {
                return true;
            }
            seen.add(keyValue);
        }
        return false;
    },
    sleep(ms) { return new Promise(r => setTimeout(r, ms)) },
    axiosRequest(method, url, data, header = { 'Accept': 'application/json' }) {
        return new Promise(async (resolve, reject) => {
            try {
                const config = {
                    method: method,
                    url: url,
                    headers: header,
                    data: data
                };
                const res = await axios(config);
                resolve(res);
            } catch (e) {
                reject(e);
            }
        });
    },
    groupArrayObjectByASelectedKey(arrayObject, key) {
        let array = [];
        let visited = [];//used to keep track of visisted keys
        for (let i = 0; i < arrayObject.length; i++) {
            let subArray = [];
            let firstKey = arrayObject[i][key];
            if (!visited.includes(firstKey)) {
                for (let j = 0; j < arrayObject.length; j++) {
                    let newKey = arrayObject[j][key];
                    if (firstKey == newKey) {
                        subArray.push(arrayObject[j]);
                    }
                }
                visited.push(firstKey);
            }
            if (subArray.length != 0)
                array.push(subArray);
        }
        return array;
    },

    zeroPad(num, places) {
        let zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    },
    // function getMonth with 1 parameter expecting date
    // This function returns a string of type MM (example: 05 = May)
    getMonth(d) {
        //get the month
        var month = d.getMonth();

        //increment month by 1 since it is 0 indexed
        //converts month to a string
        //if month is 1-9 pad right with a 0 for two digits
        month = (month + 1).toString().padStart(2, '0');

        return month;
    },
    // function getDay with 1 parameter expecting date
    // This function returns a string of type dd (example: 09 = The 9th day of the month)
    getDay(d) {
        //get the day
        //convert day to string
        //if day is between 1-9 pad right with a 0 for two digits
        var day = d.getDate().toString().padStart(2, '0');;

        return day;
    },
    // function getYear with 1 parameter expecting date
    // This function returns the year in format yy (example: 21 = 2021)
    getYear(d) {
        //get the year
        var year = d.getFullYear();

        //pull the last two digits of the year
        year = year.toString().substr(-2);

        return year;
    },

    //A function for formatting a date to MMddyy
    formatDate(d, format, delimeter) {
        switch (format) {
            case 'mmddyy':
                return `${Utilities.getMonth(d)}${delimeter || ''}${Utilities.getDay(d)}${delimeter || ''}${Utilities.getYear(d)}`;
            case 'yymmdd':
                return `${Utilities.getYear(d)}${delimeter || ''}${Utilities.getMonth(d)}${delimeter || ''}${Utilities.getDay(d)}`;
            case 'ddmmyy':
                return `${Utilities.getDay(d)}${delimeter || ''}${Utilities.getMonth(d)}${delimeter || ''}${Utilities.getYear(d)}`;
            case 'yymm':
                return `${Utilities.getYear(d)}${delimeter || ''}${Utilities.getMonth(d)}`;
            case 'mmyy':
                return `${Utilities.getMonth(d)}${delimeter || ''}${Utilities.getYear(d)}`;
            case 'mmdd':
                return `${Utilities.getMonth(d)}${delimeter || ''}${Utilities.getDay(d)}`;
            case 'ddmm':
                return `${Utilities.getDay(d)}${delimeter || ''}${Utilities.getMonth(d)}`;
        }

    },

    getTime(date) {
        return date.toLocaleTimeString();
    },

    async genRegId(ym, currentEntityNumber) {
        let id = null;
        currentDate = new Date();
        const currentYm = Utilities.formatDate(currentDate, 'yymm');
        const yymmdd = Utilities.formatDate(currentDate, 'yymmdd');
        if (currentYm == ym) {
            let cen = parseInt(currentEntityNumber) + 1;
            id = yymmdd + Utilities.zeroPad(cen, 6);
            await new Model().update('settings', [{ value: cen }]).where(null, [{ prop: 'ad_number' }], '=', null).query();
        } else {
            let cen = 1;
            id = yymmdd + Utilities.zeroPad(cen, 6);
            await new Model().update('settings', [{ value: cen }]).where(null, [{ prop: 'ad_number' }], '=', null).query();
            await new Model().update('settings', [{ value: currentYm }]).where(null, [{ prop: 'year_month' }], '=', null).query();
        }
        return id;
    },

    toObject(data) {
        return JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));
    },


    sentimentRemark(r) {
        let remarks = 'neutral';
        if (r > 0) {
            remarks = 'good';
        } else if (r < 0) {
            remarks = 'bad';
        }
        return remarks;
    },

    sentiment(review) {
        return new Promise((resolve, reject) => {
            try {
                const lexedReview = aposToLexForm(review);
                const casedReview = lexedReview.toLowerCase();
                const alphaOnlyReview = casedReview.replace(/[^a-zA-Z\s]+/g, '');
                const spellCorrector = new SpellCorrector();

                const { WordTokenizer } = natural;
                const tokenizer = new WordTokenizer();
                const tokenizedReview = tokenizer.tokenize(alphaOnlyReview);
                tokenizedReview.forEach((word, index) => {
                    tokenizedReview[index] = spellCorrector.correct(word);
                })
                const filteredReview = sw.removeStopwords(tokenizedReview);
                const { SentimentAnalyzer, PorterStemmer } = natural;
                const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
                const result = analyzer.getSentiment(filteredReview);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    },

    getMetaData: async () => {
        try {
            const metadata = await fetch("https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json");
            return metadata.json();
        } catch (e) {
            console.log(e);
        }
    },
    loadModel: async () => {
        try {
            const url = `https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json`;
            const model = await tf.loadLayersModel(url);
            return model;
        } catch (e) {
            console.log(e);
        }
    },
    predict: (text, model, metadata) => {
        const trimmed = text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
        const sequence = trimmed.map(word => {
            const wordIndex = metadata.word_index[word];
            if (typeof wordIndex === 'undefined') {
                return 2; //oov_index
            }
            return wordIndex + metadata.index_from;
        });
        const paddedSequence = padSequences([sequence], metadata);
        const input = tf.tensor2d(paddedSequence, [1, metadata.max_len]);
        const predictOut = model.predict(input);
        const score = predictOut.dataSync()[0];
        predictOut.dispose();
        return score;
    },
    padSequences: (sequences, metadata) => {
        try {
            return sequences.map(seq => {
                if (seq.length > metadata.max_len) {
                    seq.splice(0, seq.length - metadata.max_len);
                }
                if (seq.length < metadata.max_len) {
                    const pad = [];
                    for (let i = 0; i < metadata.max_len - seq.length; ++i) {
                        pad.push(0);
                    }
                    seq = pad.concat(seq);
                }
                return seq;
            });
        } catch (e) {
            console.log(e)
        }
    },
    getSentiment: (score) => {
        if (score > 0.66) {
            return `Score of ${score} is Positive`;
        }
        else if (score > 0.4) {
            return `Score of ${score} is Neutral`;
        }
        else {
            return `Score of ${score} is Negative`;
        }
    },
    run: async (text, sw) => {
        try {
            text = text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
            text = sw.removeStopwords(text)

            const model = await loadModel();
            const metadata = await getMetaData();

            let sum = 0;

            text.forEach(function (prediction) {
                perc = predict(prediction, model, metadata);
                sum += parseFloat(perc, 10);
            })
            console.log(getSentiment(sum / text.length));
        } catch (e) {
            console.log(e);
        }
    },
    //project specific functions
    getValuesBy: (data, searchKey, value) => {//returns an array         
        const record = data;
        let val = record.filter((v) => {
            if (v[searchKey] === value) {
                return v;
            }
        });
        return val;
    },
    groupBy: function (xs, key) {
        return xs?.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    },

    getArrayObjectsValue: (data, searchKey, value) => {//returns a single item        
        const record = data;
        let val = {};
        record.forEach((v) => {
            if (v[searchKey] === value) {
                val = v;
            }
        });
        return val;
    },

    getDistricts(location, districts, reg_dist) {//a recursive function to extract district 
        let regions = [];
        let loc = Utilities.getArrayObjectsValue(reg_dist, 'alias', location);
        let id = loc.id;
        if (!loc.branch) {
            return [loc.alias];
        }
        let children = Utilities.getValuesBy(reg_dist, 'super_type', id);
        children = children.filter((child) => {
            if (child.id !== id) {
                return child;
            }
        });
        children.forEach((child) => {
            if (child.branch) {
                regions.push(child);
            } else {
                districts.push(child.alias);
            }
        });
        if (regions.length > 0) {
            regions.forEach((region) => {
                Utilities.getDistricts(region.alias, districts, reg_dist);
            });
        }
        return districts;
    },

    async makePayment(settings, email, px, subscriptionType) {
        try {
            const endPoint = settings.paystackUrl;
            const host = settings.clientHost;
            const paymentData = {
                "email": `${email}`,
                "amount": `${px * 100}`,
                "currency": "GHS",
                "callback_url": `http://${host}/vpayment/${subscriptionType}`,
                "metadata": {
                    "cancel_action": `http://${host}`
                }
            }
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.paystackKey}`,
                // 'Cookie': 'sails.sid=s%3Am3s4lwzX9DsSvfqqsNclTj4XrWa1YifE.fq1pliZgTH2bGP54errnwjklmDL%2FfNsixIU3zEo8R2A'
            }
            const rs = await Utilities.axiosRequest('post', endPoint, paymentData, headers);
            return rs;
        } catch (e) {
            console.log(e);
        }
    },

    async verifyPayment(settings, reference) {
        try {
            const endPoint = settings.paystackVerifyUrl + '/' + reference;
            const paymentData = undefined
            const headers = {
                'Authorization': `Bearer ${settings.paystackKey}`,
            }
            const rs = await Utilities.axiosRequest('get', endPoint, paymentData, headers);
            return rs;
        } catch (e) {
            console.log(e);
        }
    },

    markLeafs: (cat) => {
        for (let i = 0; i < cat.length; i++) {
            const id = cat[i].id;
            let counter = 0;
            for (let j = 0; j < cat.length; j++) {
                counter++;
                if (j == i) continue;//skip if it's the same category
                if (cat[j].super_type === id) {//if the i'th category's id happens to a the super_type id of the j'th category. then j depends on i so i is a branch
                    cat[i]['branch'] = true;
                    break;
                }
            }
            if (counter === cat.length && cat[i].type > 1 && !cat[i]['branch']) {//conditions that qualifies a category as leaf (no dependency)
                cat[i]['leaf'] = true;
            }
        }
    },

}



module.exports = Utilities;