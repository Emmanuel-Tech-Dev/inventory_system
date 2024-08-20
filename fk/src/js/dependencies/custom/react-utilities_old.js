// import React from 'react';
import $ from 'jquery';
import { Buffer } from "buffer";
import { memo } from 'react';
import Settings from './settings';
import IndexedDB from './indexeddb';
import { notification, message } from 'antd';

const Utilities = {
    //CUSTOM UTILITY FUNCTIONS
    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            const covertedFileSize = Utilities.convertFileSize(file.size);
            const fileSize = Utilities.getFileSize(file.size);
            const fileName = file.name;
            reader.onload = () => resolve({ result: reader.result, covertedFileSize: covertedFileSize, fileSize: fileSize, fileType: Utilities.getBase64FileType(reader.result), fileName: fileName });
            reader.onerror = error => reject(error);
        });
    },
    //this fn puts all base64 files promises into promise.all
    async tobase64Handler(files) {
        const filePathsPromises = [];
        for (let i = 0; i < files.length; i++) {
            filePathsPromises.push(Utilities.toBase64(files[i]));
        }
        const filePaths = await Promise.all(filePathsPromises);
        return filePaths;
    },
    convertFileSize(size) {
        return Utilities.bytesConverter(size);
    },
    bytesConverter: function (bytes) {
        let unit = 1000;
        if (bytes < unit) return bytes;
        let exp = Math.floor(Math.log(bytes) / Math.log(unit));
        let pre = "kMGTPE".charAt(exp - 1);
        let result = bytes / Math.pow(unit, exp);
        if (result / 100 < 1)
            return (Math.round(result * 10) / 10) + pre;
        else
            return Math.round(result) + pre;
    },
    getFileSize(size) {
        return Math.round((size / 1024));
    },
    getBase64FileType(base64) {
        return base64.split(';')[0].split(":")[1].split("/")[1];
    },
    async formDataRequest(method, url, endpoint, data) {
        try {
            let params = {
                method: method.toUpperCase(),
                cache: 'no-cache',
                body: data,
            };
            if (method.toLowerCase() == 'get') {
                delete params['body'];
            }
            let res = await fetch(url, params);
            return await res.json();
        } catch (e) {
            console.error(e);
        }
    },

    async performDBAction(method, table, data, endpoint) {
        data['table'] = table;
        let url = 'http://localhost/aamusted_finance/backend/controllers/react_backend.php';
        let res = await Utilities.request(method, url, endpoint, data);
        if (res === undefined) return;
        if (res.status === 'Ok') {
            return res;
        } else {
            return res.msg;
        }
    },
    formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    },
    filterByDate(col, dateRange, table) {
        if (dateRange) {
            let startDate = dateRange[0]?.$d;
            let endDate = dateRange[1]?.$d;
            if (!startDate || !endDate) {
                message.error('Please set dates!');
                return;
            }
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            startDate = Utilities.formatDate(startDate);
            endDate = Utilities.formatDate(endDate);
            table.setExtraFetchParams({ customFilter: `${col} >= '${startDate}' AND ${col} <= '${endDate}'` });
            table.fetchData();
        } else {
            table.setExtraFetchParams(undefined);
            table.fetchData();
            message.error('Please set start and end date if you intend to filter by date range');
        }
    },
    hasPermission(p, table, valuesStore) {
        return new Promise((resolve, reject) => {
            const timer = setInterval(e => {
                const perms = valuesStore.getValue('permissions');
                if (Object.keys(perms).length) {
                    clearInterval(timer);
                    for (let i = 0; i < perms.length; i++) {
                        if (perms[i].permission === p && perms[i].table_name === table) {
                            resolve(true);
                        }
                    }
                    resolve(false);
                }
            }, 1000);
        });
    },
    displayMoney: (n) => {
        const numFormat = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        });

        return numFormat.format(n).split('.', 1);
    },
    calculateDiscount: (discountedPrice, originalPrice) => {
        const discountedPercent = (discountedPrice / originalPrice) * 100;

        return Math.round(discountedPercent);
    },
    // Calculate Total Amount
    calculateTotal: (arr) => {
        const total = arr.reduce((accum, val) => accum + val, 0);

        return total;
    },

    fromNow(date) {
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const MONTH = 30 * DAY;
        const YEAR = 365 * DAY;
        const units = [
            { max: 30 * SECOND, divisor: 1, past1: 'just now', pastN: 'just now', future1: 'just now', futureN: 'just now' },
            { max: MINUTE, divisor: SECOND, past1: 'a second ago', pastN: '# seconds ago', future1: 'in a second', futureN: 'in # seconds' },
            { max: HOUR, divisor: MINUTE, past1: 'a minute ago', pastN: '# minutes ago', future1: 'in a minute', futureN: 'in # minutes' },
            { max: DAY, divisor: HOUR, past1: 'an hour ago', pastN: '# hours ago', future1: 'in an hour', futureN: 'in # hours' },
            { max: WEEK, divisor: DAY, past1: 'yesterday', pastN: '# days ago', future1: 'tomorrow', futureN: 'in # days' },
            { max: 4 * WEEK, divisor: WEEK, past1: 'last week', pastN: '# weeks ago', future1: 'in a week', futureN: 'in # weeks' },
            { max: YEAR, divisor: MONTH, past1: 'last month', pastN: '# months ago', future1: 'in a month', futureN: 'in # months' },
            { max: 100 * YEAR, divisor: YEAR, past1: 'last year', pastN: '# years ago', future1: 'in a year', futureN: 'in # years' },
            { max: 1000 * YEAR, divisor: 100 * YEAR, past1: 'last century', pastN: '# centuries ago', future1: 'in a century', futureN: 'in # centuries' },
            { max: Infinity, divisor: 1000 * YEAR, past1: 'last millennium', pastN: '# millennia ago', future1: 'in a millennium', futureN: 'in # millennia' },
        ];
        const diff = Date.now() - (typeof date === 'object' ? date : new Date(date)).getTime();
        const diffAbs = Math.abs(diff);
        for (const unit of units) {
            if (diffAbs < unit.max) {
                const isFuture = diff < 0;
                const x = Math.round(Math.abs(diff) / unit.divisor);
                if (x <= 1) return isFuture ? unit.future1 : unit.past1;
                return (isFuture ? unit.futureN : unit.pastN).replace('#', x);
            }
        }
    },

    animateToElement(elem) {
        let offset = $(elem).offset();
        $('html, body').animate({
            scrollTop: offset.top + 1000,
            scrollLeft: offset.left + 1000
        }, 1000);
    },
    animateToElementGivenParentAndChild(parent, child) {
        let offset = $(child).offset();
        $(parent).animate({
            scrollTop: offset.top + 1000,
            scrollLeft: offset.left + 1000
        }, 1000);
    },
    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },
    //same as formNow. this uses Intl.RelativeTimeFormat
    // fromNowIntlRel(date, nowDate = Date.now(), rft = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })) {
    //     const SECOND = 1000;
    //     const MINUTE = 60 * SECOND;
    //     const HOUR = 60 * MINUTE;
    //     const DAY = 24 * HOUR;
    //     const WEEK = 7 * DAY;
    //     const MONTH = 30 * DAY;
    //     const YEAR = 365 * DAY;
    //     const intervals = [
    //         { ge: YEAR, divisor: YEAR, unit: 'year' },
    //         { ge: MONTH, divisor: MONTH, unit: 'month' },
    //         { ge: WEEK, divisor: WEEK, unit: 'week' },
    //         { ge: DAY, divisor: DAY, unit: 'day' },
    //         { ge: HOUR, divisor: HOUR, unit: 'hour' },
    //         { ge: MINUTE, divisor: MINUTE, unit: 'minute' },
    //         { ge: 30 * SECOND, divisor: SECOND, unit: 'seconds' },
    //         { ge: 0, divisor: 1, text: 'just now' },
    //     ];
    //     const now = typeof nowDate === 'object' ? nowDate.getTime() : new Date(nowDate).getTime();
    //     const diff = now - (typeof date === 'object' ? date : new Date(date)).getTime();
    //     const diffAbs = Math.abs(diff);
    //     for (const interval of intervals) {
    //         if (diffAbs >= interval.ge) {
    //             const x = Math.round(Math.abs(diff) / interval.divisor);
    //             const isFuture = diff < 0;
    //             return interval.unit ? rft.format(isFuture ? x : -x, interval.unit) : interval.text;
    //         }
    //     }
    // },
    showHideNavOnScroll(navbar, prev, curr, depth) {
        if (prev > curr) {
            document.querySelector(navbar).style.top = "0";
        } else {
            document.querySelector(navbar).style.top = depth;
        }
        prev = curr;
        return prev;
    },
    zeroPad(num, places) {
        let zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    },
    groupBy: function (xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    },
    crypt(salt, text) {
        const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
        const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
        const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);

        return text
            .split("")
            .map(textToChars)
            .map(applySaltToChar)
            .map(byteHex)
            .join("");
    },
    decrypt(salt, encoded) {
        const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
        const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
        return encoded
            .match(/.{1,2}/g)
            .map((hex) => parseInt(hex, 16))
            .map(applySaltToChar)
            .map((charCode) => String.fromCharCode(charCode))
            .join("");
    },
    getAge(dateString) {
        var ageInMilliseconds = new Date() - new Date(dateString);
        return Math.floor(ageInMilliseconds / 1000 / 60 / 60 / 24 / 365); // convert to years
    },

    setCookie(cname, cvalue, expDays, path = '/') {
        const d = new Date();
        d.setTime(d.getTime() + (expDays * 24 * 60 * 60 * 1000));
        let expires = `expires=${d.toUTCString()}`;
        let p = `path=${path}`;
        document.cookie = `${cname}=${cvalue};${expires};${p}`;
    },
    genSqlIn(b) {
        let a = '';
        b.forEach((v, i) => {
            a += `'${v}'`;
            if (i < b.length - 1) {
                a += ','
            }
        });
        return a;
    },
    getCookie(cname) {
        let name = `${cname}=`;
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
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

    async deleteFile(file) {
        try {
            const { name, url, extraData } = file;
            const { fileDelRowIDFieldName, fileDelRowIDValue, fileDelURL, tableName, filePathDBField, container } = extraData;
            const data = { name, filePath: url, fileDelRowIDFieldName, fileDelRowIDValue, tableName, filePathDBField, container };
            let res = await Utilities.request('post', fileDelURL, null, data);
            return res;
        } catch (err) {
            return err;
        }
    },

    async save(table, data = {}, crit = {}, logical = null, action, endpoint) {
        data['table'] = table;
        data['action'] = action;
        data['crit'] = crit;
        data['logical'] = logical;
        let url = 'http://localhost/aamusted_finance/backend/controllers/react_backend.php';
        let res = await Utilities.request('post', url, endpoint, data);
        return res;
    },

    async changeSheetStatus(details, type) {
        let url = '';
        switch (type) {
            case "approve": {
                url = `${Settings.backend}/save_approve_sheet`;
                break;
            }
            case "publish": {
                url = `${Settings.backend}/save_publish_sheet`;
                break;
            }
            case "unpublish": {
                url = `${Settings.backend}/save_unpublish_sheet`;
                break;
            }
            case "release": {
                url = `${Settings.backend}/save_release_sheet`;
                break;
            }
            default :
        }
        const data = details.map(v => (v.custom_id));
        let res = await Utilities.request('post', url, null, { data });
        if (res.status === 'Ok') {
            message.success('Operation successful');
        } else {
            message.error(res.msg);
        }
    },
    async setGradeStatus(details, type) {
        let url = '';
        switch (type) {
            case "approve": {
                url = `${Settings.backend}/save_approve_grade_change`;
                break;
            }
            case "decline": {
                url = `${Settings.backend}/save_decline_grade_change`;
                break;
            }
        }
        let res = await Utilities.request('post', url, null, { data: details });
        if (res.status === 'Ok') {
            message.success('Operation successful');
        } else {
            message.error(res.msg);
        }
    },
    getDistricts(location, districts, valuesStore) {//a recursive function to extract district 
        let regions = [];
        let loc = valuesStore.getArrayObjectsValue('reg_dist', 'alias', location);
        let id = loc.id;
        if (!loc.branch) {
            return [loc.alias];
        }
        let children = valuesStore.getValuesBy('reg_dist', 'super_type', id);
        children.forEach((child) => {
            if (child.branch) {
                regions.push(child);
            } else {
                districts.push(child.alias);
            }
        });
        if (regions.length > 0) {
            regions.forEach((region) => {
                Utilities.getDistricts(region.alias, districts, valuesStore);
            });
        }
        return districts;
    },
    populateForm(data, store, prefix) {
        data.map((v) => {
            let elem = document.querySelector(`[data-colname=${v[0]}]`);
            if ($(elem).prop('type') !== 'file') {
                if (elem !== null) {
                    store.setValue(prefix + v[0], v[1]);
                    elem.value = v[1];
                }
            }
        });
    },

    getParentCat: (parent, Category, getBy) => {
        for (let i = 0; i < Category.length; i++) {
            const cat = Category[i];
            const id = cat[getBy];
            if (parent === id) {
                return cat;
            }
        }
        return
    },


    updateParentCat: (cat) => {
        cat?.map((c) => {
            if (c.id === c.super_type) {
                c.super_type = 0;
                c['show'] = true;
            }
        });
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

    generateTreeData: (res, keys) => {
        const newArr = JSON.parse(JSON.stringify(res));
        let tree = [];
        newArr.forEach((r) => {
            let obj = {
                id: r[keys.id],
                super_type: r[keys.super_type],
                title: r[keys.title],
                value: r[keys.alias],
                children: [],
                disabled: true,
                key: r[keys.alias],
            };

            if (r.leaf) {
                obj.disabled = false;
            }
            tree.push(obj);
        });

        let searchFilterTree = JSON.parse(JSON.stringify(tree));//use for main location filtering. used by customers
        searchFilterTree.map((item) => {
            delete item['disabled'];
        })

        //get dependencies
        for (let i = 0; i < tree.length; i++) {
            const id = tree[i].id;
            for (let j = 0; j < tree.length; j++) {
                if (j == i) continue;//skip if it's the same category
                if (tree[j].super_type === id) {//if the i'th category's id happens to a the super_type id of the j'th category. then j depends on i so i is a branch                    
                    tree[i]['children'].push(tree[j]);
                    searchFilterTree[i]['children'].push(searchFilterTree[j]);
                }
            }
        }

        let finalTree = [];
        let finalSearchFilterTree = [];
        //remove all leafs and sub parents with children. make sure root parents are left
        for (let i = 0; i < tree.length; i++) {
            const super_type = tree[i].super_type;
            if (super_type === 0) {
                finalTree.push(tree[i]);
                finalSearchFilterTree.push(searchFilterTree[i]);
            }
        }

        return { finalTree, finalSearchFilterTree };
    },
    generateTableFilters(type = 'LIKE') {
        let filters = {};
        let filterTypes = {};
        const qstring = Utilities.getQString();
        for (let query in qstring) {
            filters[query] = [qstring[query]];
            filterTypes[query] = type;
        }
        return { filters, filterTypes };
    },
    getQString() {
        let sp = {};
        const search = window.location.search.replace('?', '').split('&');
        search.forEach((s) => {
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            });
            const sh = s.split('=');
            if (sh[0] && sh[1]) {
                sp[sh[0]] = params[sh[0]];
            }
        });
        return sp;
    },

    getHString() {
        let sp = {};
        const hash = window.location.hash.split('&');
        hash.forEach((s) => {
            const params = new Proxy(new URLSearchParams(window.location.hash), {
                get: (searchParams, prop) => searchParams.get(prop),
            });
            const sh = s.split('=');
            if (sh[0] && sh[1]) {
                sp[sh[0].replace('#', '')] = params[sh[0]];
            }
        });
        return sp;
    },

    async bookmark(path, bookmarkUrl, type, user, advert_id) {
        const res = await Utilities.request('POST', path, null, { bookmarkUrl, type, user, advert_id });
        return res;
    },

    async addItemsToIndexedDB(data, tblIndexVal, indexName, indexVal) {
        const tbl = Settings.dbTables[tblIndexVal].tblName;
        const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
        let d = await db.deleteByAny(tbl, 'readwrite', indexName, indexVal);
        let c = await db.insert(tbl, 'readwrite', { data: data, [indexName]: indexVal });
    },

    getLocation(loc, valuesStore) {
        const rd = valuesStore.getArrayObjectsValue('reg_dist', 'alias', loc);
        const dist = rd.name;
        const superType = rd.super_type;
        const reg = valuesStore.getArrayObjectsValue('reg_dist', 'id', superType);
        return `${reg.name ? `${reg.name},` : ''} ${dist}`;
    },

    fbLogin(settings, redirectUri) {
        let url = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${settings.facebookAppID}&redirect_uri=${redirectUri}&state=facebook`;
        window.location.href = url;
    },

    getMyHref() {
        return window.location.href.split('?')[0];
    },
    copyToClipBoard(text) {
        navigator.clipboard.writeText(text);
    },
    getSettings(valuesStore, key) {
        let p = valuesStore.getValue('userSettings');
        if (p) {
            const settings = p.settings;
            let value = false;
            if (settings) {
                let s = JSON.parse(settings);
                if (key in s) {
                    value = s[key] == 1 && true;
                }
            }
            return value;
        } else {
            // await Utilities.sleep(2000);
            Utilities.getSettings(valuesStore, key);
        }
    },
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    showFeedback(valuesStore, feedbackHook, message) {
        const on = Utilities.getSettings(valuesStore, 'Feedback');
        if (!on) {
            message.info('Feeback has been disabled by user');
            return;
        }
        feedbackHook.setFeedBackDrawer(true)
    },
    async bookmarkAd(e, valuesStore, Settings, bookmarkUrl, advert_id) {
        if (!valuesStore.getValue('loggedIn')) {
            valuesStore.setValue('showLoginModal', true);
            return;
        }
        const type = 'advert';
        const user = valuesStore.getValue('loggedInUser');
        let res = await Utilities.bookmark(`${Settings.backend}/add_to_bookmark`, bookmarkUrl, type, user, advert_id);
        const el = $(e.target).find('i');
        if (res.action === 'insert') {
            //apply color if bookmark
            $(e.target).closest('span').addClass(`${Settings.secondaryColor}`);
            //this is checking whether the span (parent) or the <i> (child) elem is clicked
            //if span (parent) is clicked use find to get <i> (child) and toggle these classes
            if (el.length == 1) {
                $(el).removeClass(`${Settings.textColor}`).addClass(`text-white`);
            } else {
                //if <i> (child) is clicked, toggle these classes direct without using find
                $(e.target).removeClass(`${Settings.textColor}`).addClass(`text-white`);
            }
        } else if (res.action === 'delete') {
            //remove color if bookmark is deleted
            $(e.target).closest('span').removeClass(`${Settings.secondaryColor}`);
            //refer to the explanations above
            if (el.length == 1) {
                $(el).removeClass(`text-white`).addClass(`${Settings.textColor}`);
            } else {
                $(e.target).removeClass(`text-white`).addClass(`${Settings.textColor}`);
            }
        }
    },
    getPhoneNumber(u) {
        let tel = u.telephone;
        if (u.telephone.charAt(0) == '0') {
            tel = Utilities.removeCharByIndex(u.telephone, 0);
        }
        return tel = u.country_code + tel;
    },

    createRuntimeTableMeta(props, metaKeyName, where, tbl, valuesStore) {
        const metadata = valuesStore.getValuesBy(metaKeyName, where, tbl);
        props.forEach((v) => {
            let exists = false;
            for (let b = 0; b < metadata.length; b++) {
                if (v.column_name == metadata[b].column_name) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                valuesStore.setValue(metaKeyName, [...metadata, v]);
            }
        });
    },

    getArrayObjectsDuplicates(data) {
        let visited = [];
        let duplicates = [];
        data.forEach(v => {
            const indexNo = v.index_no;
            if (!visited.includes(indexNo)) {
                visited.push(indexNo);
            } else {
                duplicates.push(indexNo);
            }
        });
        return { visited, duplicates }
    },

    bootstrapOthers: (valuesStore, fetchItems) => {
        fetchItems.map(async (params, i) => {
            let data = {
                sql: params.sql
            };
            let res = await Utilities.request(params.method, params.url, null, data);
            valuesStore.setValue(params.storeName, res);
        });
    },

    bootstrap: (valuesStore, settingsStore) => {
        const fetchItems = [settingsStore.tables_metadata, settingsStore.grade, settingsStore.course];
        fetchItems.forEach(async (params, i) => {
            let data = {
                critfdx: params.critfdx,
                critval: params.critval,
                logical: params.logical,
                table: params.table,
                getall: params.getall,
                fields: params.fields,
            };
            let res = await Utilities.request(params.method, params.url, null, data);
            // Utilities.updateParentCat(res);
            // Utilities.markLeafs(res);
            // let keys = null;
            // if (params.table === 'category' || params.table === 'reg_dist') {
            //     if (params.table === 'category') {
            //         keys = { id: 'id', super_type: 'super_type', title: 'category', alias: 'alias' };
            //     } else if (params.table === 'reg_dist') {
            //         keys = { id: 'id', super_type: 'super_type', title: 'name', alias: 'alias' };
            //     }
            //     const { finalTree, finalSearchFilterTree } = Utilities.generateTreeData(res, keys);//this function should always be called after markLeafs
            //     valuesStore.setValue(params.treeDataStoreName, finalTree);
            //     valuesStore.setValue(params.treeDataStoreNameNoDisabled, finalSearchFilterTree)
            // }
            valuesStore.setValue(params.storeName, res);
        });
    },
    renameKeys(data, newNames) {
        // let newData = {};
        for (let key in newNames) {
            const newKey = newNames[key];//use old key to get new key
            const value = data[key];//get old key value
            delete data[key];//delete old key
            if (value)//if old key value is valid set it as the value for the new key
                data[newKey] = value;
        }
        return { ...data };//merge the newData and data objects
    },
    //for disabling auto zoom in on iphone/ipad
    addMaximumScaleToMetaViewport: () => {
        const el = document.querySelector('meta[name=viewport]');
        if (el !== null) {
            let content = el.getAttribute('content');
            let re = /maximum\-scale=[0-9\.]+/g;
            if (re.test(content)) {
                content = content.replace(re, 'maximum-scale=1.0');
            } else {
                content = [content, 'maximum-scale=1.0'].join(', ')
            }
            el.setAttribute('content', content);
        }
    },

    checkIsIOS: () => (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream),

    // rowTemplate: (item,itemHeight,classes) => {
    //     if (item.length == 0) return;
    //     return (
    //         <div className={classes} style={{ height: `${itemHeight}px` }} key={item.key}>
    //             {item.text}
    //         </div>
    //     )
    // }

    rowTemplate: memo((item, itemHeight) => {
        if (item.length == 0) return;
        return (
            <div className="" style={{ height: `${itemHeight}px` }} key={item.key}>
                {item.text}
            </div>
        )
    }),

    // Item : memo(({ index }) => {
    //     return (
    //         <div className="row" key={index} style={
    //             {
    //                 height: 30,
    //                 lineHeight: '30px',
    //                 display: 'flex',
    //                 justifyContent: 'space-between',
    //                 padding: '0 10px'
    //             }}>
    //             <label> row index {index}</label>
    //         </div>
    //     )
    // }),

    //GENERAL UTILITY FUNCTIONS
    listAllEventListeners() {
        const allElements = Array.prototype.slice.call(document.querySelectorAll('*'));
        allElements.push(document);
        allElements.push(window);
        const types = [];
        for (let ev in window) {
            if (/^on/.test(ev)) types[types.length] = ev;
        }
        let elements = [];
        for (let i = 0; i < allElements.length; i++) {
            const currentElement = allElements[i];
            for (let j = 0; j < types.length; j++) {
                if (typeof currentElement[types[j]] === 'function') {
                    elements.push({
                        "node": currentElement,
                        "type": types[j],
                        "func": currentElement[types[j]].toString(),
                    });
                }
            }
        }
        return elements.sort(function (a, b) {
            return a.type.localeCompare(b.type);
        });
    },
    abbreviateNumber(number) {
        const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];
        // what tier? (determines SI symbol)
        const tier = Math.log10(Math.abs(number)) / 3 | 0;
        // if zero, we don't need a suffix
        if (tier == 0) return number;
        // get suffix and determine scale
        const suffix = SI_SYMBOL[tier];
        const scale = Math.pow(10, tier * 3);
        // scale the number
        const scaled = number / scale;
        // format number and add suffix
        return scaled.toFixed(1) + suffix;
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
    getTable(headers, data, tableClasses, headerClasses, trClasses, tdClasses, cols) {
        return <table key={Utilities.generateUuid()} className={tableClasses}>
            <tbody>
                <tr className={headerClasses}>
                    {headers.map((v, i) => {
                        if (v.length < cols) {
                            return <th key={i} colSpan={parseInt(cols / headers.length)}>{v}</th>;
                        } else {
                            return <th key={i}>{v}</th>;
                        }
                    })}
                </tr>
                {data.map((v, i) => {
                    return <tr key={i} className={trClasses}>
                        {v.map((v1, j) => {
                            if (v.length < cols) {
                                // (cols - v.length) + 1
                                return <td className={tdClasses} key={j} colSpan={parseInt(cols / v.length)}>{v1}</td>
                            } else {
                                return <td className={tdClasses} key={j}>{v1}</td>
                            }
                        })}
                    </tr>
                })}
            </tbody>
        </table>;
    },
    async request(method, url, endpoint, data = {},
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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
            return await res.json();
        } catch (e) {
            console.error(e);
        }
    },
    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            const covertedFileSize = Utilities.convertFileSize(file.size);
            const fileSize = Utilities.getFileSize(file.size);
            const fileName = file.name;
            reader.onload = () => resolve({ result: reader.result, covertedFileSize: covertedFileSize, fileSize: fileSize, fileType: Utilities.getBase64FileType(reader.result), fileName: fileName });
            reader.onerror = error => reject(error);
        });
    },
    //this fn puts all base64 files promises into promise.all
    async tobase64Handler(files) {
        const filePathsPromises = [];
        for (let i = 0; i < files.length; i++) {
            filePathsPromises.push(Utilities.toBase64(files[i]));
        }
        const filePaths = await Promise.all(filePathsPromises);
        return filePaths;
    },
    convertFileSize(size) {
        return Utilities.bytesConverter(size);
    },
    bytesConverter: function (bytes) {
        let unit = 1000;
        if (bytes < unit) return bytes;
        let exp = Math.floor(Math.log(bytes) / Math.log(unit));
        let pre = "kMGTPE".charAt(exp - 1);
        let result = bytes / Math.pow(unit, exp);
        if (result / 100 < 1)
            return (Math.round(result * 10) / 10) + pre;
        else
            return Math.round(result) + pre;
    },
    getFileSize(size) {
        return Math.round((size / 1024));
    },
    getBase64FileType(base64) {
        return base64.split(';')[0].split(":")[1].split("/")[1];
    },
    async formDataRequest(method, url, endpoint, data) {
        try {
            let params = {
                method: method.toUpperCase(),
                cache: 'no-cache',
                body: data,
            };
            if (method.toLowerCase() == 'get') {
                delete params['body'];
            }
            let res = await fetch(url, params);
            return await res.json();
        } catch (e) {
            console.error(e);
        }
    },

    removeCharByIndex(str, index) {
        return str.slice(0, index) + str.slice(index + 1);
    },

    dummyArr: new Array(10000).fill(null).map((v, i) => {
        return { key: i, text: `text${i}` };
    }),


    //BASED ON JQUERY BUT CUSTOM
    getElems: function (parentElem) {
        let data = [];
        $(parentElem).find('input,select,textarea').each((index, elem) => {
            if (($(elem).prop('type') !== 'checkbox' || ($(elem).prop('type') !== 'file')))
                data.push(elem);
        });
        return data;
    },

    //BASED ON JQUERY    
    extractData: function (parentElem, attr, strict) {
        let data = [];
        $(parentElem).find('input,select,textarea').each((index, elem) => {
            let val = $(elem).val();
            let colname = $(elem).data(attr);
            let required = $(elem).data("required");
            let validator = $(elem).data("validator");
            if (strict) {
                if (($(elem).prop('type') !== 'checkbox' || ($(elem).prop('type') !== 'file')) && colname !== "")
                    data.push({ [attr]: colname, value: val, required: required, validator: validator });
            } else {
                if (($(elem).prop('type') !== 'checkbox' || ($(elem).prop('type') !== 'file')))
                    data.push({ [attr]: colname, value: val, required: required, validator: validator });
            }
        });
        return data;
    },

    extractNestedData: function (parentElem, subParentClass, attr) {
        let data = [];
        $(parentElem).find(subParentClass).each((index, elem) => {
            const d = $(elem).data();
            const name = d[attr];
            const required = d.required;
            const validator = d.validator;
            const value = { [attr]: name, value: '', required: required, validator: validator, isOthers: false };
            $(elem).find('input,select,textarea').each((index, subElem) => {
                const subElemType = $(subElem).prop('type');
                const subElemVal = $(subElem).val();
                if (subElemType !== 'file' && name !== '') {
                    if (subElemType === 'radio' || subElemType === 'checkbox') {
                        if ($(subElem).prop('checked')) {
                            value.value = subElemVal;
                            if (subElemVal.toLowerCase() !== 'others')
                                return false;
                            else
                                value.isOthers = true;
                        }
                    } else {
                        value.value = subElemVal;
                        if (subElemVal.toLowerCase() !== 'others')
                            return false;
                        else
                            value.isOthers = true;
                    }
                }
            });
            data.push(value);
        });
        return data;
    },

    showNotification(msg, description, placement = 'bottomRight') {
        notification.open({
            message: <label className="fw-bolder text-danger"><i className='fas fa-exclamation-circle'></i> {msg}</label>,
            description: description,
            placement: placement
        });
    },
    //this is a react function
    clearFormData(data, setter) {
        for (let key in data) {
            setter({ [key]: '' });
        }
    },

    clearData(parentElem) {
        $(parentElem).find('input,select,textarea').each((index, elem) => {
            $(elem).val("");
            $(elem).prop("disabled", false);
            if ($(elem).prop('type') === 'checkbox')
                $(elem).prop("checked", false);
        });
    },

    validateForm: (required) => {
        let inputValues = [];
        let errorFields = [];
        let isValid = [];
        let boolValid = [];
        for (let i = 0; i < required.length; i++) {
            let rules = required[i].rules;
            let elem = required[i].elem;
            let key = required[i].key;
            let value = $(elem).val();
            boolValid = [];
            for (let j = 0; j < rules.length; j++) {
                //firing rules
                let valid = rules[j](value); // rule will return a boolean value.               
                boolValid.push(valid);
            }
            isValid.push({ valid: boolValid });
        }
        for (let i = 0; i < required.length; i++) {
            //checking if fields are valid after the rules have been invoked                                       
            let validCounter = 0;
            let elem = required[i].elem;
            let key = required[i].key;
            let value = $.trim($(elem).val());
            let currentFieldBoolsValid = isValid[i].valid;
            for (let j = 0; j < currentFieldBoolsValid.length; j++) {
                if (currentFieldBoolsValid[j]) {
                    //increase counter if field is true
                    validCounter++;
                }
            }
            //push field value to inputValues if all field are valid else push id of field to errorFields
            if (currentFieldBoolsValid.length === validCounter) {
                inputValues.push({ elem: elem, value: value, key: key });
            } else {
                errorFields.push(elem);
            }
        }
        //return true with inputValues if inputValues is equal to required else false with errorFields
        if (inputValues.length === required.length) {
            return { formValid: true, values: inputValues };
        } else {
            return { formValid: false, values: errorFields };
        }
    },

    validateData(data, attr, key) {
        let rules = [];
        let rule = null;
        for (let i = 0; i < data.length; i++) {
            let required = data[i].required;
            let validator = data[i].validator;
            if (required) {
                rule = {
                    key: data[i][key],
                    elem: document.querySelector(`[${attr}=${data[i][key]}]`),
                    rules: [
                        (val) => {
                            let valid = Utilities.ValidationFactory[validator](val);
                            if (!valid) {
                                // Utilities.notifyMsgRelativeToElem(data[i].id, 'Field Required');
                                // utils.toastMsg('Title is required', settings.toastErrorBg, settings.toastLoaderBg);
                                // Utilities.applyEffectToElem(data[i].id, 'highlight');
                            }
                            return valid;
                        } //FUNCTION 1
                    ]
                } //end rule
            } else {
                rule = {
                    key: data[i][key],
                    elem: document.querySelector(`[${attr}=${data[i][key]}]`),
                    rules: [
                        (val) => {
                            return true;
                        } //FUNCTION 1
                    ]
                }
            }
            rules.push(rule);
        }
        return Utilities.validateForm(rules);
    }, //end function

    validateSoftData(data) {
        const valids = [];
        for (let i = 0; i < data.length; i++) {
            const val = data[i].value;
            const name = data[i].name;
            const validator = data[i].validator.split('(');
            const args = validator[1]?.replace(')', '').split(',') || [];
            const extra = { ...data[i] };
            const required = data[i].required;
            if (required) {
                const valid = Utilities.ValidationFactory[validator](val, ...args);
                if (!valid) {
                    return { valid, name }
                } else {
                    valids.push({ ...data[i] });
                }
            } else {
                valids.push({ ...data[i] });
            }
        }
        return { data: valids, valid: true };
    },


    ValidationFactory: {
        //STRING VALIDATION  +(match one or more) *(match zero or more)  
        validateNotNullString: (val) => {
            if (val.trim() !== null) {
                return true;
            } else {
                return false;
            }
        },

        validateEmptyString: (val) => {
            if (val.trim() !== "") {
                return true;
            } else {
                return false;
            }
        },
        validateAlpha: (val) => {
            let pattern = /^[a-zA-Z]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaAllowSpace: (val) => {
            let pattern = /^[a-zA-Z ]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaMinCharLength: (val, requiredMinCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlpha(val);
            if (valid && val.trim().length >= requiredMinCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaMaxCharLength: (val, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlpha(val);
            if (valid && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaMinMaxCharLength: (val, requiredMinCharLength, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlpha(val);
            if (valid && val.trim().length >= requiredMinCharLength && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaMinCharLengthAllowSpace: (val, requiredMinCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaAllowSpace(val);
            if (valid && val.trim().length >= requiredMinCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaMaxCharLengthAllowSpace: (val, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaAllowSpace(val);
            if (valid && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaMinMaxCharLengthAllowSpace: (val, requiredMinCharLength, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaAllowSpace(val);
            if (valid && val.trim().length >= requiredMinCharLength && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },


        //NUMBER VALIDATION
        validateNumber: function (val) {
            let pattern = /^[\d]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateDecNumber: function (val) {
            let pattern = /^[\d.]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateNumberAllowSpace: function (val) {
            let pattern = /^[\d ]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateNumberMinCharLength: function (val, requiredMinCharLength) {
            let valid = Utilities.ValidationFactory.validateNumber(val);
            if (valid && val.trim().length >= requiredMinCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateNumberMaxCharLength: function (val, requiredMaxCharLength) {
            let valid = Utilities.ValidationFactory.validateNumber(val);
            if (valid && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateNumberMinMaxCharLength: function (val, requiredMinCharLength, requiredMaxCharLength) {
            let valid = Utilities.ValidationFactory.validateNumber(val);
            if (valid && val.trim().length >= requiredMinCharLength && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },

        validateNumberMinCharLengthAllowSpace: function (val, requiredMinCharLength) {
            let valid = Utilities.ValidationFactory.validateNumberAllowSpace(val);
            if (valid && val.trim().length >= requiredMinCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateNumberMaxCharLengthAllowSpace: function (val, requiredMaxCharLength) {
            let valid = Utilities.ValidationFactory.validateNumberAllowSpace(val);
            if (valid && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateNumberMinMaxCharLengthAllowSpace: function (val, requiredMinCharLength, requiredMaxCharLength) {
            let valid = Utilities.ValidationFactory.validateNumberAllowSpace(val);
            if (valid && val.trim().length >= requiredMinCharLength && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },

        //ALPHANUMERIC VALIDATION
        validateAlphaNumeric: (val) => {
            let pattern = /^[0-9a-zA-Z]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericAllowSpace: (val) => {
            let pattern = /^[0-9a-zA-Z ]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericAllowExtraChar: (val) => {
            let pattern = /^[0-9a-zA-Z.@$#_ ]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericMinCharLength: (val, requiredMinCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaNumeric(val);
            if (valid && val.trim().length >= requiredMinCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericMaxCharLength: (val, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaNumeric(val);
            if (valid && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericMinMaxCharLength: (val, requiredMinCharLength, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaNumeric(val);
            if (valid && val.trim().length >= requiredMinCharLength && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericMinCharLengthAllowSpace: (val, requiredMinCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
            if (valid && val.trim().length >= requiredMinCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericMaxCharLengthAllowSpace: (val, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
            if (valid && val.trim().length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },
        validateAlphaNumericMinMaxCharLengthAllowSpace: (val, requiredMinCharLength, requiredMaxCharLength) => {
            let valid = Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
            if (valid && val.trim().length >= requiredMinCharLength && $.trim(val).length <= requiredMaxCharLength) {
                return true;
            } else {
                return false;
            }
        },

        //EMAIL VALIDATION
        validateEmailWithUnicode: function (val) {
            let pattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateEmailNoUnicode: function (val) {
            let pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },
        validateSimpleEmail: function (val) {
            let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },

        //TELEPHONE NUMBER VALIDATION
        validateTelephoneNumber: function (val) {
            let pattern = /^$/;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        },

        //LOOSE VALIDATION
        looselyValidateNumber: (val) => {
            if (val.trim() === "") {
                //if the val is empty, don't check anything
                return true;
            } else {
                //if the val isn't empty, check if the value conforms to this pattern
                return Utilities.ValidationFactory.validateNumber(val);
            }
        },
        looselyValidateDecNumber: (val) => {
            if (val.trim() === "") {
                //if the val is empty, don't check anything
                return true;
            } else {
                //if the val isn't empty, check if the value conforms to this pattern
                return Utilities.ValidationFactory.validateDecNumber(val);
            }
        },
        looselyValidateAlphaNumericAllowSpace: (val) => {
            if (val.trim() === "") {
                //if the val is empty, don't check anything
                return true;
            } else {
                //if the val isn't empty, check if the value conforms to this pattern
                return Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
            }
        },
        looselyValidateEmailNoUnicode: (val) => {
            if (val.trim() === "") {
                //if the val is empty, don't check anything
                return true;
            } else {
                //if the val isn't empty, check if the value conforms to this pattern
                return Utilities.ValidationFactory.validateEmailNoUnicode(val);
            }
        },
        looselyValidateEmailWithUnicode: (val) => {
            if (val.trim() === "") {
                //if the val is empty, don't check anything
                return true;
            } else {
                //if the val isn't empty, check if the value conforms to this pattern
                return Utilities.ValidationFactory.validateEmailWithUnicode(val);
            }
        },
        looselyValidatePlainString: (val) => {
            if (val.trim() === "") {
                //if the val is empty, don't check anything
                return true;
            } else {
                //if the val isn't empty, check if the value conforms to this pattern
                return Utilities.ValidationFactory.validateAlpha(val);
            }
        },
        looselyValidateAlphaNumericAllowExtraChar: (val) => {
            if (val.trim() === "") {
                //if the val is empty, don't check anything
                return true;
            } else {
                //if the val isn't empty, check if the value conforms to this pattern
                return Utilities.ValidationFactory.validateAlphaNumericAllowExtraChar(val);
            }
        },
        noValidation: () => {
            return true;
        },
        validateYYYYMMDate: (val) => {
            let pattern = /^\d{4}\-(0[1-9]|1[012])$/gm;
            if (pattern.test(val.trim())) {
                return true;
            } else {
                return false;
            }
        }
        //IS SAME

    },

    getUrlFileName() {
        let url = window.location.pathname;
        let filename = url.substring(url.lastIndexOf('/') + 1);
        return filename;
    },

    renderToPrint(printable, css) {
        const myWindow = window.open('', '', 'width:1000,height:1000');
        const html = $(printable).html();
        myWindow.document.write(`<html><head>${css}</head><body>${html}</body></html>`);
        setTimeout(() => {
            myWindow.document.close();
            myWindow.focus();
            myWindow.print();
            myWindow.close();
        })
    },

    renderPrintablePage(printable, css) {
        const myWindow = window.open('', '', 'width:1000,height:1000');
        const html = $(printable).html();
        myWindow.document.write(`<html><head>${css}</head><body>${html}</body></html>`);
    }
}

export default Utilities;