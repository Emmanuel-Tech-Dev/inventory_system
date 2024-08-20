const Utilities = require('./functions');
const Model = require('../model/model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const crypto = require("crypto");
const Settings = require('./settings');
const cheerio = require('cheerio');
const ms = require('millisecond');
// const TableModels = require('./table_models');
const CommonTableModels = require('./common_table_models');
class CommonEndpoints {
    constructor(app, uploader) {
        this.app = app;
        this.uploader = uploader;
        this.changeAdminPassword(app);
        this.addWithFiles(app);
        this.adminLogin(app);
        this.bootstrap(app);
        this.bootstrapOthers(app);
        this.delFileAndUpdateTbl(app);
        this.add(app);
        this.delete(app);
        this.edit(app);
        this.editWithFiles(app);
        this.getColFilters(app);
        this.getData(app);
        this.getExtraMetaOptions(app);
        this.renewToken(app);
        this.uploadFile(app);
        this.verifyToken(app);
        this.getAssignedPages(app);
        this.getAssignedPermissions(app);
        this.tinyMCECoontent(app);
        this.delFileAndDelRow(app);
        this.authURL(app);
        this.createUserAccount(app);
        this.getAdminDept(app)
        this.getAdminRoleFilesLink(app)
        this.getAdminRoleLink(app)
        this.getAssignedPagesByUser(app)
        // this.saltRounds = 10;
        this.jwtExpirySeconds = '1d';//'9d' for 9 days
        this.jwtRefreshTokenExpirySeconds = '60d';
        this.fileToUploadIsImage = true;
        return this;
    }

    authURL(app) {
        app.post('/get_auth_url', async (request, response) => {
            try {
                const res = await Utilities.getSettings(['authUrl']);
                response.json({ status: 'Ok', msg: 'Operation successful', result: res });
            } catch (err) {
                response.json({ status: 'Error', msg: 'Operation failed', msg2: err.message });
            }
        });
    }

    setFileToUploadIsImage(isImage) {
        this.uploadIsImage = isImage;
    }

    tinyMCECoontent(app) {
        app.post('/tinymce_content', async (req, res, next) => {
            try {
                const { content, container, baseUrl, data, operation, rowKey, table, editorField } = req.body;
                const $ = cheerio.load(content);
                if (!!$('body').find('img').length) {
                    $('body').find('img').each(async function () {
                        const src = $(this).prop('src');
                        if (Utilities.isBase64(src)) {
                            const { base64 } = Utilities.getBase64String(src);
                            const buffer = Buffer.from(base64, 'base64');
                            const randomBytes = crypto.randomBytes(16).toString("hex");
                            const generatedName = `${randomBytes}.png`;
                            const path = `resources/${container}/${generatedName}`;
                            $(this).prop('src', `${baseUrl}/${generatedName}`).addClass('img-fluid');
                            await sharp(buffer).png().toFile(path);
                        }
                        const d = { ...data, [editorField]: $.html() };
                        if (operation === 'insert') {
                            const values = await new Model().genInsertSomeFields(Model, table, d);
                            await new Model().insertSome(table, values).query();
                        } else if (operation === 'update') {
                            let v = [];
                            let id = '';
                            for (let key in d) {
                                if (key !== rowKey) {
                                    v.push({ [key]: d[key] });
                                }
                                if (key === rowKey) {
                                    id = d[key];
                                }
                            }
                            // console.log(v);
                            // v.push({ body: content })                
                            await new Model().update(table, v).where(null, [{ id }], '=', null).query()
                        }
                    });
                } else {
                    const d = { ...data, [editorField]: $.html() };
                    if (operation === 'insert') {
                        const values = await new Model().genInsertSomeFields(Model, table, d);
                        await new Model().insertSome(table, values).query();
                    } else if (operation === 'update') {
                        let v = [];
                        let id = '';
                        for (let key in d) {
                            if (key !== rowKey) {
                                v.push({ [key]: d[key] });
                            }
                            if (key === rowKey) {
                                id = d[key];
                            }
                        }
                        await new Model().update(table, v).where(null, [{ id }], '=', null).query()
                    }
                }
                res.json({ status: 'Ok', msg: 'Operation successful' });
            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    createUserAccount(app) {
        app.post("/create_user_account", async (request, response, next) => {
            try {
                let { name, username, password, email, telephone, block, is_root, to_reset, primary_role, staff_id, dept_id } = request.body;

                const token = await Utilities.getDetailsFromToken(request, Settings.JWTKEYPATHPUBLIC);

                if (!token?.valid) {
                    response.json({ status: 'Error', msg: 'Token not found' });
                    return;
                }
                const adminId = token?.username;

                const settings = await Utilities.getSettings(['INSTITUTION_DETAILS', 'credentialsMeta', 'emailAccountUsername', 'emailAccountPassword', 'domain', 'emailCallBackURL', 'smtpHost']);
                const parsedCredentialsMeta = Object.keys(settings).length ? JSON.parse(settings?.credentialsMeta || "{}") : {};
                const table = parsedCredentialsMeta?.table;
                const emailAccountUsername = settings?.['emailAccountUsername'];
                const emailAccountPassword = settings?.['emailAccountPassword'];
                const usernameColName = parsedCredentialsMeta?.username;
                // const domain = settings?.['domain'];
                // const emailCallBackURL = settings?.['emailCallBackURL'];
                const smtpHost = settings?.['smtpHost'];
                const INSTITUTION_DETAILS = JSON.parse(settings?.['INSTITUTION_DETAILS'] || "{}");
                const instName = INSTITUTION_DETAILS?.name;
                const sender = { address: emailAccountUsername, name: `${instName} Account` };
                const usr = username || staff_id || '';
                const res = await new Model().select(table, ['*']).where(null, [{ [usernameColName]: usr }], '=').query();
                if (res.length <= 0) {
                    if (password == '' || password == undefined || password == null) {
                        password = Utilities.generatePassword(10, 'ZXCVBNMASDFGHJKLQWERTYUIP987654321');
                    }
                    const pwdHash = await Utilities.generatePasswordHash(password, 12);
                    await new Model().insert(table, [name, usr, null, null, adminId, new Date(), pwdHash, email || null, telephone || null, is_root || 0, block || 0])
                        .query();
                    if (email) {
                        const body = `Hi ${name}. Please use ${username} as your USERNAME and ${password} as your PASSWORD. You are recommended to change this password when you log in`;
                        Utilities.sendMail(email, emailAccountUsername, emailAccountPassword, sender, `${instName} Create New User`, body, function (error, info) {
                            if (info) {
                                response.json({ status: 'Ok', msg: `Operation successful, Credentials have been sent to user's email!` });
                            } else {
                                response.json({ status: 'Error', msg: 'Email failed to send. Details have been save' });
                            }

                        }, 'text', smtpHost);
                    } else {
                        response.json({ status: 'Ok', msg: `Operation successful, User's account has been created` });
                    }
                } else {
                    if (to_reset == 1) {
                        password = Utilities.generatePassword(10, 'ZXCVBNMASDFGHJKLQWERTYUIP987654321');
                        if (email) {
                            const body = `Hi ${name}. Please use ${username} as your USERNAME and ${password} as your PASSWORD. You are recommended to change this password when you log in`;
                            Utilities.sendMail(email, emailAccountUsername, emailAccountPassword, sender, `${instName} Create New User`, body, function (error, info) {
                                if (info) {
                                    response.json({ status: 'Ok', msg: `Operation successful, Credentials have been sent to user's email!` });
                                } else {
                                    response.json({ status: 'Error', msg: 'Email failed to send. Details have been save' });
                                }

                            }, 'text', smtpHost);
                        } else {
                            response.json({ status: 'Ok', msg: `Operation successful, User's account has been created` });
                        }
                    } else {
                        response.json({ status: 'Ok', msg: `Operation successful, User's account has already been created. Nothing to do!` });
                    }
                }


            } catch (err) {
                console.log(err)
                response.json({ status: 'Error', msg: 'Operation failed', err: err.message });
            }
        });
    }

    changeAdminPassword(app) {
        app.post('/change_admin_password', async function (req, response) {
            try {
                const token = Utilities.extractToken(req);
                let { c_password, new_password, old_password, oldPassword, confPassword, password } = req.body;

                if (c_password && new_password && (c_password !== new_password)) {
                    res.json({ status: 'Error', msg: 'New password mismatch', verified });
                    return;
                } else if (confPassword && password && (confPassword !== password)) {
                    res.json({ status: 'Error', msg: 'New password mismatch', verified });
                    return;
                }

                old_password = oldPassword;
                new_password = password;
                const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
                const usernameColName = parsedCredentialsMeta?.username;
                const passwordColName = parsedCredentialsMeta?.password;
                const table = parsedCredentialsMeta?.table;
                const keyType = parsedCredentialsMeta?.keyType

                let verified = false;
                if (keyType == 'asymmetric') {
                    const pubKeyPath = Settings.JWTKEYPATHPUBLIC || Settings.JWTKEYPATH;
                    verified = Utilities.verifyToken(token, undefined, pubKeyPath);
                } else {
                    const symKey = Settings.JWTSYMKEY;
                    verified = Utilities.verifyToken(token, symKey);
                }
                if (verified?.status) {
                    const adminId = verified?.adminId;
                    const res = await new Model().select(table, [passwordColName]).where(null, [{ id: adminId }, { [usernameColName]: verified?.username }], '=', 'OR').query();
                    const passwordHash = res[0].passwordHash;
                    const passwordValid = await bcrypt.compare(old_password, passwordHash);
                    if (passwordValid) {
                        const saltRounds = 10;
                        const salt = await bcrypt.genSalt(saltRounds);
                        const hash = await bcrypt.hash(new_password, salt);
                        const res1 = await new Model().update(table, [{ [passwordColName]: hash }]).where(null, [{ id: adminId }, { [usernameColName]: verified?.username }], '=', 'OR').query();
                        if (res1?.affectedRows) {
                            response.json({ status: 'Ok', msg: 'Operation successful' });
                        } else {
                            response.json({ status: 'Error', msg: 'Your password could not be updated' });
                        }
                    } else {
                        response.json({ status: 'Error', msg: 'Your old password is incorrect' });
                    }
                } else {
                    response.json({ status: 'Error', msg: 'Invalid token' });
                }
            } catch (err) {
                console.log(err.message);
                response.json({ status: 'Error', msg: err.message });
            }
        });
    }

    verifyToken(app) {//only access tokens
        app.post('/verify_token', async function (req, res) {
            try {

                const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
                const keyType = parsedCredentialsMeta?.keyType

                const token = Utilities.extractToken(req);

                let verified = false;
                if (keyType == 'asymmetric') {
                    const pubKeyPath = Settings.JWTKEYPATHPUBLIC || Settings.JWTKEYPATH;
                    verified = Utilities.verifyToken(token, undefined, pubKeyPath);
                } else {
                    const symKey = Settings.JWTSYMKEY;
                    verified = Utilities.verifyToken(token, symKey);
                }
                res.json({ status: 'Ok', msg: 'Operation successful', verified });
            } catch (err) {
                console.log(err.message);
                res.json({ status: 'Error', msg: err.message });
            }
        });
    }

    renewToken(app) {
        app.post('/renew_token', async function (req, res) {
            //token brought here for renewal are active refresh tokens
            try {
                const token = Utilities.extractToken(req);
                const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
                const refreshTokenExpires = parsedCredentialsMeta?.refreshTokenExpires || this.jwtRefreshTokenExpirySeconds;
                const expires = parsedCredentialsMeta?.expires || this.jwtExpirySeconds;
                const keyType = parsedCredentialsMeta?.keyType

                const key = Settings.JWTREFRESHTOKENKEY;
                const verified = jwt.verify(token, key);//verify refresh token
                if (verified?.status) {
                    let data = {
                        time: Date(),
                        adminId: verified?.adminId,
                        username: verified?.username,
                        name: verified?.name,
                        status: true
                    }

                    if (keyType == 'asymmetric') {
                        const keyPath = Settings.JWTKEYPATHPRIVATE || Settings.JWTKEYPATH;
                        const t = Utilities.signDataWithJWT(data, expires, keyPath, true, 'RS256');
                        token = t.status ? t.token : '';
                    } else {
                        const key = Settings.JWTSYMKEY;
                        const t = Utilities.signDataWithJWT(data, expires, key, false, 'HS256');
                        token = t.status ? t.token : '';
                    }

                    const key = Settings.JWTREFRESHTOKENKEY;
                    const r = Utilities.signDataWithJWT(data, refreshTokenExpires, key, false, 'HS256');
                    const refreshToken = r.status ? r.token : '';

                    response.json({
                        status: 'Ok',
                        msg: 'Operation successful',
                        data: { usr, name },
                        access_token: {
                            token,
                            exp: ms(expires)
                        },
                        refreshToken: {
                            token: refreshToken,
                            exp: ms(refreshTokenExpires)
                        }
                    });
                } else {
                    res.json({ status: 'Error', msg: 'Invalid refresh token' });
                }
            } catch (err) {
                console.log(err.message);
                res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });

    }

    adminLogin(app) {
        app.post('/admin_login', async (request, response) => {
            try {
                const usernamePassword = Utilities.extractToken(request, 'Basic');

                const usrPass = atob(usernamePassword || '')?.split(':');

                let usr = undefined;
                let pwd = undefined;
                if (usrPass.length == 2) {
                    usr = usrPass[0];
                    pwd = usrPass[1];
                }
                let { username, password } = request.body || {};

                if (!username) {
                    username = usr;
                }
                if (!password) {
                    password = pwd;
                }

                if ((!username || username == 'undefined' || username || 'null') && (!password || password == 'undefined' || password == 'null')) {
                    response.json({ status: 'Error', msg: 'Wrong credentials' });
                    return;
                }

                const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
                const usernameColName = parsedCredentialsMeta?.username;
                const passwordColName = parsedCredentialsMeta?.password;
                const nameColName = parsedCredentialsMeta?.name;
                const table = parsedCredentialsMeta?.table;
                const keyType = parsedCredentialsMeta?.keyType;

                const refreshTokenExpires = parsedCredentialsMeta?.refreshTokenExpires || this.jwtRefreshTokenExpirySeconds;
                const expires = parsedCredentialsMeta?.expires || this.jwtExpirySeconds;
                let res = await new Model()
                    .select(table, ["*"])
                    .where(null, [{ [usernameColName || '']: username }], '=', null)
                    .query();
                if (!!res.length) {
                    const usr = res[0]?.[usernameColName];
                    const psd = res[0]?.[passwordColName];
                    const name = res[0]?.[nameColName];
                    if (psd) {
                        const passwordValid = await bcrypt.compare(password, psd);
                        if (passwordValid) {
                            let data = {
                                time: Date(),
                                adminId: res[0]?.['id'],
                                username: res[0][usernameColName],
                                name: res[0][nameColName],
                                status: true
                            }
                            let token = '';

                            if (keyType == 'asymmetric') {
                                const keyPath = Settings.JWTKEYPATHPRIVATE;
                                const t = Utilities.signDataWithJWT(data, expires, keyPath, true, 'RS256');
                                token = t.status ? t.token : '';
                            } else {
                                const key = Settings.JWTSYMKEY;
                                const t = Utilities.signDataWithJWT(data, expires, key, false, 'HS256');
                                token = t.status ? t.token : '';
                            }

                            const key = Settings.JWTREFRESHTOKENKEY;
                            const r = Utilities.signDataWithJWT(data, refreshTokenExpires, key, false, 'HS256');
                            const refreshToken = r.status ? r.token : '';

                            response.json({
                                status: 'Ok',
                                msg: 'Operation successful',
                                data: { usr, name },
                                scopes: [],
                                access_token: {
                                    token,
                                    exp: ms(expires)
                                },
                                refresh_token: {
                                    token: refreshToken,
                                    exp: ms(refreshTokenExpires)
                                }
                            });
                        } else {
                            response.json({ status: 'Error', msg: 'Your password is incorrect' });
                        }
                    } else {
                        response.json({ status: 'Error', msg: 'Your password is incorrect' });
                    }
                } else {
                    response.json({ status: 'Error', msg: 'Invalid username' });
                    return;
                }
            } catch (err) {
                console.log(err);
                response.json({ status: 'Error', msg: 'Operation failed' });
            }
        });

    }

    getColFilters(app) {
        app.post('/get_col_filters', async (request, response) => {
            try {
                const { data } = request.body;
                const dd = data.map(async (d) => {
                    return { res: await new Model().setSql(d.sql).query(), filter: d.filter, key: d.key, value: d.value };
                });
                const res = await Promise.all(dd);
                // console.log(dd);
                response.json({ result: res });
            } catch (err) {
                console.log(err);
                response.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    uploadFile(app, isImage) {
        app.post('/upload_file', this.uploader.array('uploadedImages', 10), async (req, res, next) => {
            try {
                const { operation, table, filePathDBField, container } = req.body;
                const files = req.files;
                let rs = null;
                // let filenames = [];        
                switch (operation) {
                    case 'update': {
                        const { rowIdFieldName, rowIdFieldValue } = req.body;
                        const fss = files.map(async file => {
                            return new Promise(async (resolve, rejects) => {
                                const randomBytes = crypto.randomBytes(16).toString("hex");
                                const filename = file.originalname;
                                const nameSplit = filename.split('.');
                                const ext = nameSplit[nameSplit.length - 1];
                                const buffer = file.buffer;
                                const generatedName = `${randomBytes}.${ext}`;
                                const path = `resources/${container}/${generatedName}`;
                                if (this.fileToUploadIsImage) {
                                    await sharp(buffer)
                                        /*.resize(imgWidth, imgHeight, { fit: 'inside' })*/
                                        .png().toFile(path);
                                } else {
                                    fs.writeFileSync(path, buffer);
                                }
                                resolve(generatedName);
                            });
                        });
                        //do insertion here with the path               
                        const rs1 = await new Model().select(table, [filePathDBField])
                            .where(null, [{ [rowIdFieldName]: rowIdFieldValue }], '=', null)
                            .query();

                        if (rs1.length <= 0) {
                            res.json({ status: 'Error', msg: 'No such record found' });
                            return;
                        }
                        const filenames = await Promise.all(fss);
                        const union = rs1[0][filePathDBField]?.split(',')?.concat(filenames)?.join().replace(/(^,)|(,$)/g, '');
                        rs = await new Model().update(table, [{ [filePathDBField]: union }])
                            .where(null, [{ [rowIdFieldName]: rowIdFieldValue }], '=', null)
                            .query();

                        break;
                    }
                    case 'insert': {
                        const { record } = req.body;
                        //to be developed later
                        // console.log(table, record, filePathDBField);
                        break;
                    }
                }

                if (rs?.affectedRows) {
                    res.json({ status: 'Ok', msg: 'Operation successful' });
                } else {
                    res.json({ status: 'Error', msg: 'Operation failed' });
                }

            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });

    }

    delFileAndUpdateTbl(app) {
        app.post('/del_file_update_tbl', async (req, res, next) => {
            try {
                const { tableName, name, sysname, filePath, fileDelRowIDFieldName, fileDelRowIDValue, filePathDBField, container } = req.body;
                if (!name) {
                    res.json({ status: 'Error', msg: 'File not found' });
                    return;
                }
                let path = `resources/${container}/${name}`;


                const rs = await new Model().select(tableName, [filePathDBField])
                    .where(null, [{ [fileDelRowIDFieldName]: fileDelRowIDValue }], '=', null)
                    .query();

                let fileNotExist = false;
                if (!fs.existsSync(path)) {//if file doesn't exist delete row and return
                    path = `resources/${container}/${sysname}`;
                    if (!fs.existsSync(path)) {//if file doesn't exist delete row and return
                        fileNotExist = true;
                    }
                }

                if (fileNotExist) {
                    if (rs.length > 0) {
                        let f = rs[0][filePathDBField]?.split(',')?.filter(filename => (filename !== name)).join().replace(/(^,)|(,$)/g, '');
                        await new Model().delete(tableName)
                            .where(null, [{ [fileDelRowIDFieldName]: fileDelRowIDValue }], '=', null)
                            .query();
                    }
                    res.json({ status: 'Error', msg: 'File not found' });
                    return;
                }

                //delete file and update row
                fs.unlinkSync(path);
                if (rs.length > 0) {
                    let f = rs[0][filePathDBField]?.split(',')?.filter(filename => (filename !== name)).join().replace(/(^,)|(,$)/g, '');
                    const rs1 = await new Model().update(tableName, [{ [filePathDBField]: f }])
                        .where(null, [{ [fileDelRowIDFieldName]: fileDelRowIDValue }], '=', null)
                        .query();
                }
                res.json({ status: 'Ok', msg: 'Operation successful' });

            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: err });
            }
        });
    }

    delFileAndDelRow(app) {
        app.post('/del_file_del_row', async (req, res, next) => {
            try {
                const { tableName, name, sysname, filePath, fileDelRowIDFieldName, fileDelRowIDValue, filePathDBField, container } = req.body;
                if (!name) {
                    res.json({ status: 'Error', msg: 'File not found' });
                    return;
                }
                let path = `resources/${container}/${name}`;


                const rs = await new Model().select(tableName, [filePathDBField])
                    .where(null, [{ [fileDelRowIDFieldName]: fileDelRowIDValue }], '=', null)
                    .query();

                let fileNotExist = false;
                if (!fs.existsSync(path)) {//if file doesn't exist delete row and return
                    path = `resources/${container}/${sysname}`;
                    if (!fs.existsSync(path)) {//if file doesn't exist delete row and return
                        fileNotExist = true;
                    }
                }

                if (fileNotExist) {
                    if (rs.length > 0) {
                        let f = rs[0][filePathDBField]?.split(',')?.filter(filename => (filename !== name)).join().replace(/(^,)|(,$)/g, '');
                        await new Model().delete(tableName)
                            .where(null, [{ [fileDelRowIDFieldName]: fileDelRowIDValue }], '=', null)
                            .query();
                    }
                    res.json({ status: 'Error', msg: 'File not found' });
                    return;
                }

                //delete file and row
                fs.unlinkSync(path);
                if (rs.length > 0) {
                    let f = rs[0][filePathDBField]?.split(',')?.filter(filename => (filename !== name)).join().replace(/(^,)|(,$)/g, '');
                    await new Model().delete(tableName)
                        .where(null, [{ [fileDelRowIDFieldName]: fileDelRowIDValue }], '=', null)
                        .query();
                }
                res.json({ status: 'Ok', msg: 'Operation successful' });

            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: err });
            }
        });
    }


    delete(app) {
        app.post("/delete", async (req, res, next) => {
            try {
                const { endpoint } = req.body;
                const newBody = { ...req.body };
                const table = endpoint.tableName;
                const whr = endpoint.where;
                const whrType = endpoint.whereType;
                const filePathDBField = endpoint?.filePathDBField;//name of the column that holds file path
                const container = endpoint?.container;
                const whrVal = newBody[whr];

                if (filePathDBField) {
                    let rs = await new Model().select(table, [filePathDBField])
                        .where(null, [{ [whr]: whrVal }], '=', null).query();
                    if (rs.length > 0) {
                        const filenames = rs[0][filePathDBField]?.split(',')?.filter(f => f !== '');
                        filenames?.forEach((filename) => {
                            const path = `resources/${container}/${filename}`;
                            if (fs.existsSync(path)) {
                                fs.unlinkSync(path);
                            }
                        });
                    }
                }

                if (whrType === 'closed') {
                    let rs = await new Model().delete(table).where(null, [{ [whr]: whrVal }], '=', null).query();
                } else {
                    let rs = await new Model().delete(table).where(whr).query();
                }
                // await new Model().setSql("SET @var:=0").query();
                await new Model().setSql(`SET @var:=0; UPDATE ${table} SET id = (@var:=@var+1) ORDER BY id`).query(); //reindex id field
                await new Model().setSql(`ALTER TABLE ${table} AUTO_INCREMENT = 1`).query();


                res.json({ status: 'Ok', msg: 'Operation successful' });
            } catch (err) {
                console.log(err);
                // res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    edit(app) {
        app.post("/edit", async (req, res) => {
            try {
                const { endpoint } = req.body;
                const newBody = { ...req.body };
                const table = endpoint.tbl;
                const whr = endpoint.where;
                const whrType = endpoint.whereType;
                const whrVal = newBody[whr];
                delete newBody['endpoint'];
                delete newBody[whr];
                const values = Object.keys(newBody).map(key => ({ [key]: newBody[key] }));
                if (whrType === 'closed') {
                    let rs = await new Model().update(table, values).where(null, [{ [whr]: whrVal }], '=', null).query();
                } else {
                    let rs = await new Model().update(table, values).where(whr).query();
                }
                res.json({ status: 'Ok', msg: 'Operation successful' });
            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: err.text });
            }
        });
    }

    editWithFiles(app) {
        app.post('/edit_with_files', async (req, response, next) => {
            try {
                let { endpoint, files, record } = req.body;
                const table = endpoint.tbl;
                const multipleInsert = endpoint.multipleInsert;
                const filePathDBField = endpoint.filePathDBField;
                record = JSON.parse(record);
                files = JSON.parse(files);
                if (Object.keys(record) <= 0) {
                    response.json({ status: 'Error', msg: 'No record to add' });
                }

                if (multipleInsert) {
                    files.forEach(async file => {
                        const ext = file.fileType;
                        const { base64 } = Utilities.getBase64String(file.result);
                        const buffer = Buffer.from(base64, 'base64');
                        const randomBytes = crypto.randomBytes(16).toString("hex");
                        const generatedName = `${randomBytes}.${ext}`;
                        const path = `resources/images/${generatedName}`;
                        record[filePathDBField] = generatedName;
                        const values = await new Model().genInsertSomeFields(Model, table, record);
                        // await sharp(buffer).png().toFile(path);
                        //do update here with the path                
                        // await new Model().insertSome(table, values).query();
                    });
                } else {
                    const fss = files.map(async file => {
                        return new Promise(async (resolve, rejects) => {
                            const ext = file.fileType;
                            const { base64 } = Utilities.getBase64String(file.result);
                            const buffer = Buffer.from(base64, 'base64');
                            const randomBytes = crypto.randomBytes(16).toString("hex");
                            const generatedName = `${randomBytes}.${ext}`;
                            const path = `resources/images/${generatedName}`;
                            // await sharp(buffer)
                            /*resize(imgWidth, imgHeight, { fit: 'inside' }).*/
                            // .png().toFile(path);                    
                            resolve(generatedName);
                        });
                    });

                    const filenames = await Promise.all(fss);
                    if (!!filenames.length)
                        record[filePathDBField] = filenames.join().replace(/(^,)|(,$)/g, '');
                    const values = await new Model().genInsertSomeFields(Model, table, record);
                    //do update here with the path            
                    // await new Model().insertSome(table, values).query();
                }

                response.json({ status: 'Ok', msg: 'Operation successful' });
            } catch (err) {
                console.log(err);
                response.json({ status: 'Error', msg: err.text });
            }
        });
    }

    add(app) {
        app.post("/add", async (req, res, next) => {
            try {
                const { endpoint } = req.body;
                const newBody = { ...req.body };
                const table = endpoint.tbl;
                delete newBody['endpoint'];
                const values = await new Model().genInsertSomeFields(Model, table, newBody);
                const r = await new Model().insertSome(table, values).query();
                res.json({ status: 'Ok', msg: 'Operation successful' });
            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: err.text.replace('key', '') });
            }
        });
    }

    addWithFiles(app) {
        app.post('/add_with_files', async (req, response, next) => {
            try {
                let { endpoint, files, record } = req.body;
                const table = endpoint.tbl;
                const multipleInsert = endpoint.multipleInsert;
                const filePathDBField = endpoint.filePathDBField;
                const container = endpoint.container;
                record = JSON.parse(record);
                files = JSON.parse(files);
                if (Object.keys(record) <= 0) {
                    response.json({ status: 'Error', msg: 'No record to add' });
                    return;
                }

                if (multipleInsert) {
                    files.forEach(async file => {
                        const ext = file.fileType;
                        const { base64 } = Utilities.getBase64String(file.result);
                        const buffer = Buffer.from(base64, 'base64');
                        const randomBytes = crypto.randomBytes(16).toString("hex");
                        const generatedName = `${randomBytes}.${ext}`;
                        const path = `resources/${container}/${generatedName}`;
                        record[filePathDBField] = generatedName;
                        const values = await new Model().genInsertSomeFields(Model, table, record);
                        try {
                            await sharp(buffer).png().toFile(path);
                        } catch (e) {
                            fs.writeFileSync(path, buffer);
                        }
                        //do insertion here with the path                
                        await new Model().insertSome(table, values).query();
                    });
                } else {
                    //uploads all files and return paths a single csv
                    const fss = files.map(async file => {
                        return new Promise(async (resolve, rejects) => {
                            const ext = file.fileType;
                            const { base64 } = Utilities.getBase64String(file.result);
                            const buffer = Buffer.from(base64, 'base64');
                            const randomBytes = crypto.randomBytes(16).toString("hex");
                            const generatedName = `${randomBytes}.${ext}`;
                            const path = `resources/${container}/${generatedName}`;
                            try {
                                await sharp(buffer)
                                    ./*resize(imgWidth, imgHeight, { fit: 'inside' }).*/
                                    png().toFile(path);
                            } catch (e) {
                                fs.writeFileSync(path, buffer);
                            }
                            resolve(generatedName);
                        });
                    });

                    const filenames = await Promise.all(fss);
                    if (!!filenames.length)
                        record[filePathDBField] = filenames.join().replace(/(^,)|(,$)/g, '');

                    const values = await new Model().genInsertSomeFields(Model, table, record);
                    //do insertion here with the path            
                    await new Model().insertSome(table, values).query();
                }
                response.json({ status: 'Ok', msg: 'Operation successful' });
            } catch (err) {
                console.log(err);
                response.json({ status: 'Error', msg: err.text });
            }
        });
    }

    getExtraMetaOptions(app) {
        app.post('/get_extra_meta_options', async (req, response, next) => {
            try {
                const { sql } = req.body;
                const details = await new Model().setSql(sql)
                    .query();
                response.json({ status: 'Ok', msg: 'Operation successful', details: Utilities.toObject(details) });
            } catch (err) {
                response.json({ status: 'Error', msg: err });
            }
        });
    }

    getData(app) {
        app.post('/get_data', async (request, response, next) => {
            try {
                const { pagination, filters, filterTypes, endpoint, extraFetchParams } = request.body;
                const customFilter = extraFetchParams?.customFilter;
                const current = pagination.current;
                const pageSize = pagination.pageSize;
                const { start, end } = Utilities.getPageRange(current, pageSize);
                const table = endpoint?.table;
                const fields = endpoint?.fields.join(',');
                const orderBy = endpoint?.orderBy;
                let totalCount = 0;
                let res = [];
                if ((filters && Object.keys(filters).length > 0) || customFilter) {
                    let f = Utilities.removeNullFiltersNonMutated(filters);
                    let like = Utilities.getFilters(f, filterTypes, customFilter);
                    let sql = '';
                    if (like) {
                        sql = `Select ${fields} FROM ${table} WHERE 1 AND ${like} ${orderBy ? `ORDER BY ${orderBy}` : ''}`;
                    } else {
                        sql = `Select ${fields} FROM ${table}  ${orderBy ? `ORDER BY ${orderBy}` : ''}`;
                    }
                    res = await new Model().setSql(sql).query();
                    const r = await Utilities.getTotalCount(table, 'id', like);
                    if (r.length > 0) {
                        totalCount = r[0].counter;
                    }
                } else {
                    if (orderBy) {
                        res = await new Model().select(table, endpoint.fields)
                            .where(`1 ${customFilter ? `AND ${customFilter}` : ''}`)
                            .orderBy(orderBy)
                            .query();
                    } else {
                        res = await new Model().select(table, endpoint.fields)
                            .where(`1 ${customFilter ? `AND ${customFilter}` : ''}`)
                            .query();
                    }
                    const r = await Utilities.getTotalCount(table, 'id');
                    if (r.length > 0) {
                        totalCount = r[0].counter;
                    }
                }
                res = res?.slice(this.start - 1, this.end);
                response.json({ result: Utilities.toObject(res), totalCount: Utilities.toObject(totalCount) });
            } catch (err) {
                console.log(err);
                // response.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    bootstrapOthers(app) {
        app.post("/bootstrap_others", async (req, res, next) => {
            try {
                const { sql } = req.body;
                if (sql) {
                    let rs = await new Model().setSql(sql).query();
                    res.json(rs);
                } else {
                    res.json(null);
                }
            } catch (err) {
                console.log(err);
                // res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    bootstrap(app) {
        app.post("/bootstrap", async (req, res, next) => {
            try {
                const table = req.body?.table;
                const critfdx = req.body?.critfdx;
                const critval = req.body?.critval;
                const f = req.body?.fields;
                let where = [];
                let fields = ['*'];
                if (f) {//if fields are present
                    fields = f;
                }
                if (critfdx && Array.isArray(critfdx) && Array.isArray(critval) && critfdx.length == critval.length) {//if critfx are present
                    where = critfdx.map((v, index) => {
                        return { [v]: critval[index] };//generate an array object using critfx as key and critval as value. critfx[0] = critval[0]
                    });
                }
                let rs = [];
                if (where.length) {
                    rs = await new Model().select(table, fields).where(null, where, '=', null).query();
                } else {
                    rs = await new Model().select(table, fields).query();
                }

                res.json(rs);
            } catch (err) {
                console.log(err);
                // res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }
    getAdminDept(app) {
        app.post("/get_admin_dept", async (req, res, next) => {
            try {
                const tm = await new CommonTableModels(req).get_admin_dept();
                res.json({ result: Utilities.toObject(tm.res), totalCount: Utilities.toObject(tm.totalCount) });
            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }
    getAdminRoleFilesLink(app) {
        app.post("/get_admin_role_files_link", async (req, res, next) => {
            try {
                const tm = await new CommonTableModels(req).get_admin_role_files_link();
                res.json({ result: Utilities.toObject(tm.res), totalCount: Utilities.toObject(tm.totalCount) });
            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }
    getAdminRoleLink(app) {
        app.post("/get_admin_role_link", async (req, res, next) => {
            try {
                const tm = await new CommonTableModels(req).get_admin_role_link();
                res.json({ result: Utilities.toObject(tm.res), totalCount: Utilities.toObject(tm.totalCount) });
            } catch (err) {
                console.log(err);
                res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    getAssignedPagesByUser(app) {
        app.post("/get_assigned_pages_by_user", async (request, response, next) => {
            try {
                const { adminId } = request.body;
                const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
                const usernameColName = parsedCredentialsMeta?.username;

                const rs = await new Model().multiSelect(['admin', 'admin_files', 'admin_role', 'admin_role_files_link', 'admin_role_link'],
                    [
                        ['name', usernameColName],
                        ['id', 'path', 'description', 'icon'],
                        ['custom_id', 'role'],
                        ['id as arfl'],
                        ['id as arl']
                    ], null, true)
                    .join('admin', 'admin_role_link', usernameColName, 'admin_id', 'INNER JOIN')
                    .join('admin_role_files_link', 'admin_role_link', 'role_id', 'role_id', 'INNER JOIN')
                    .join('admin_files', 'admin_role_files_link', 'path', 'file_id', 'INNER JOIN')
                    .join('admin_role', 'admin_role_files_link', 'custom_id', 'role_id', 'INNER JOIN')
                    .where(null, [{ [`admin.${usernameColName}`]: adminId }, { 'admin_role_files_link.arf_link_restricted': 0 }, { 'admin_files.restricted': 0 }], '=', "AND")
                    .orderBy('description')
                    .query();
                const rs1 = await new Model().select('admin_files', ['id', 'path', 'description', 'icon']).where(null, [{ is_open: 1 }], '=', null).query();
                const final = [...rs, ...rs1];
                const uniq = Utilities.removeDuplicateObjectsFromArray(final, 'path');
                response.json(uniq);
            } catch (err) {
                console.log(err);
                response.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    getAssignedPermissions(app) {
        app.post("/get_assigned_permissions", async (request, response, next) => {
            try {
                const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
                const keyType = parsedCredentialsMeta?.keyType;
                const usernameColName = parsedCredentialsMeta?.username;
                let adminId = '';

                if (keyType == 'asymmetric') {
                    const keyPath = Settings.JWTKEYPATHPUBLIC || Settings.JWTKEYPATH;
                    const admin = await Utilities.getDetailsFromToken(request, keyPath, true);
                    adminId = admin.username || '';
                } else {
                    const key = Settings.JWTSYMKEY;
                    const admin = await Utilities.getDetailsFromToken(request, key, false);
                    adminId = admin.username || '';
                }

                const rs = await new Model().multiSelect(['admin', 'admin_perm', 'admin_role', 'admin_role_perm'],
                    [
                        ['name', usernameColName],
                        ['id', 'permission', 'table_name', 'restricted', 'alias'],
                        ['custom_id', 'role'],
                        ['role_id', 'permission_id']
                    ], null, true)
                    .join('admin_role_perm', 'admin_perm', 'permission_id', 'alias', 'INNER JOIN')
                    .join('admin_role', 'admin_role_perm', 'custom_id', 'role_id', 'INNER JOIN')
                    .join('admin_role_link', 'admin_role', 'role_id', 'custom_id', 'INNER JOIN')
                    .join('admin', 'admin_role_link', usernameColName, 'admin_id', 'INNER JOIN')
                    .where(null, [{ [`admin.${usernameColName}`]: adminId }, { 'admin_role_perm.ar_link_restricted': 0 }, { 'admin_perm.restricted': 0 }], '=', "AND")
                    .orderBy('alias')
                    .query();

                const rs1 = await new Model().select('admin_perm', ['permission', 'alias as permission_id', 'table_name'])
                    .where(null, [{ is_open: 1 }], '=', null)
                    .orderBy('permission_id')
                    .query();
                const final = [...rs, ...rs1];
                const uniq = Utilities.removeDuplicateObjectsFromArray(final, 'permission_id');
                response.json(uniq);
            } catch (err) {
                console.log(err.message);
                res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }

    getAssignedPages(app) {
        app.post("/get_assigned_pages", async (request, response, next) => {
            try {

                const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
                const keyType = parsedCredentialsMeta?.keyType;
                const usernameColName = parsedCredentialsMeta?.username;

                let adminId = '';

                if (keyType == 'asymmetric') {
                    const keyPath = Settings.JWTKEYPATHPUBLIC || Settings.JWTKEYPATH;
                    const admin = await Utilities.getDetailsFromToken(request, keyPath, true);
                    adminId = admin.username || '';
                } else {
                    const key = Settings.JWTSYMKEY;
                    const admin = await Utilities.getDetailsFromToken(request, key, false);
                    adminId = admin.username || '';
                }

                const rs = await new Model().multiSelect(['admin', 'admin_files', 'admin_role', 'admin_role_files_link', 'admin_role_link'],
                    [
                        ['name', usernameColName],
                        ['id', 'path', 'description', 'icon'],
                        ['custom_id', 'role'],
                        ['id as arfl'],
                        ['id as arl']
                    ], null, true)
                    .join('admin', 'admin_role_link', usernameColName, 'admin_id', 'INNER JOIN')
                    .join('admin_role_files_link', 'admin_role_link', 'role_id', 'role_id', 'INNER JOIN')
                    .join('admin_files', 'admin_role_files_link', 'path', 'file_id', 'INNER JOIN')
                    .join('admin_role', 'admin_role_files_link', 'custom_id', 'role_id', 'INNER JOIN')
                    .where(null, [{ [`admin.${usernameColName}`]: adminId }, { 'admin_role_files_link.arf_link_restricted': 0 }, { 'admin_files.restricted': 0 }], '=', "AND")
                    .orderBy('description')
                    .query();
                const rs1 = await new Model().select('admin_files', ['id', 'path', 'description', 'icon']).where(null, [{ is_open: 1 }], '=', null).query();
                const final = [...rs, ...rs1];
                const uniq = Utilities.removeDuplicateObjectsFromArray(final, 'path');
                response.json(uniq);
            } catch (err) {
                console.log(err);
                // res.json({ status: 'Error', msg: 'Operation failed' });
            }
        });
    }
}

module.exports = CommonEndpoints;