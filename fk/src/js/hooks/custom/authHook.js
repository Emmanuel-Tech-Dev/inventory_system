

import { useState, useMemo } from 'react';
import $ from 'jquery';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import ValuesStore from '../store/values-store';
import { Input, notification, Drawer, Dropdown, Avatar, Tabs, Button, Alert, Modal, Badge } from 'antd';
import LoadingOverlay from 'react-loading-overlay';
import Loader from "react-spinners/ScaleLoader";
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import IndexedDB from '../dependencies/custom/indexeddb';
import { MinusOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import { decodeToken } from 'react-jwt';



LoadingOverlay.propTypes = undefined;//fixing  a bug in LoadingOverlay

export default function useAuth() {
    const valuesStore = ValuesStore();
    const [registerLoading, setRegisterLoading] = useState(false);
    const [signinLoading, setSigninLoading] = useState(false);
    const [alertJSX, setAlertJSX] = useState(null);
    const [userMenu, setUserMenu] = useState([]);
    const navigate = useNavigate();
    const [avatar, setAvatar] = useState('https://joeschmoe.io/api/v1/random');
    const showLoginModal = valuesStore.getValue('showLoginModal');
    const [registerData, setRegisterData] = useState({});
    const [error, setError] = useState({});
    const [loginData, setLoginData] = useState({});
    const [loginComplete,setLoginComplete]= useState(false);

    useMemo(() => {
        loggedIn();        
    }, [loginComplete]);

    async function logout() {
        const tbl = Settings.dbTables[0].tblName;
        const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
        let d = await db.deleteByAny(tbl, 'readwrite', 'user', 'user');
        setUserMenu([
            {
                key: 'login_register',
                label: (
                    <a onClick={() => /*setShowLoginModal(true)*/ valuesStore.setValue('showLoginModal', true)}>
                        <i className='fas fa-user-plus'></i> Login|Register
                    </a>
                ),
                name: 'login_register'
            }
        ]);
        valuesStore.setValue('loggedIn', false);
        setAvatar('https://joeschmoe.io/api/v1/random');
    }

    async function loggedIn() {
        try {
            const tbl = Settings.dbTables[0].tblName;
            const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
            const data = await db.getByIndex(tbl, 'readwrite', 'user', 'user');
            if (!data.data || !data.data.data.logged_in) {//not logged in
                $.getScript(Settings.googleClientUrl).done(function () {
                    /* global google */
                    google.accounts.id.initialize({
                        client_id: Settings.googleClientID,
                        callback: responseGoogle
                    });
                    google.accounts.id.renderButton(
                        document.getElementById('googleDiv'),
                        { theme: 'outline', size: 'large' }
                    )
                    google.accounts.id.prompt();
                });
                setUserMenuOnLogout();
                valuesStore.setValue('loggedIn', false);
                valuesStore.setValue('loggedInUser', '');
            } else {//logged in                   
                setUserMenuOnLogin();
                valuesStore.setValue('loggedIn', true);
                valuesStore.setValue('loggedInUser', data.data.data.email);
                const pic = data.data.data.picture || 'https://joeschmoe.io/api/v1/random';
                setAvatar(data.data.data.picture);
                // show profile and set avatar
            }
        } catch (e) {
            console.log(e);
        }
    }

    function setUserMenuOnLogout() {
        setUserMenu([
            {
                key: utils.generateUuid(),
                label: (
                    <a onClick={() => valuesStore.setValue('showLoginModal', true)}>
                        <i className='fas fa-user-plus'></i> Login|Register
                    </a>
                ),
                name: 'login_register'
            }
        ]);
        setLoginComplete(false);
    }

    function setUserMenuOnLogin() {        
        //remove login_register from menu if the user has logged in
        let um = userMenu.filter((m) => {
            if (m.name !== 'login_register') {
                return m;
            }
        });
        //add logout and some other menu items for logged in users
        um = [
            {
                key: utils.generateUuid(),
                label: (
                    <a onClick={() => { navigate('../orders') }}>
                        <i className='fas fa-user'></i> My Orders
                    </a>
                ),
                name: 'my_account'
            },
            {
                key: utils.generateUuid(),
                label: (
                    <a onClick={() => logout()}>
                        <i className='fas fa-power-off'></i> Logout
                    </a>
                ),
                name: 'logout'
            },
            //add other menu items here when the user logs in 
        ]
        setUserMenu(um);
        setLoginComplete(true);
    }

    const countryCodes = (<select defaultValue="+233" data-name='country_code' data-required data-validator='validateEmptyString'>
        <option value="+233">+233</option>
    </select>);

    function setData(key, evt, name, data, setter) {
        const validator = $(evt.target).data('validator').split('(');
        const args = validator[1]?.replace(')', '').split(',') || [];
        const validatorName = validator[0];
        if (utils.ValidationFactory[validatorName](evt.target.value, ...args)) {
            setError({ ...error, [key]: '' });
        } else {
            setError({ ...error, [key]: <label className='text-danger'>{`Invalid ${name}`}</label> });
        }
        setter({ ...data, [key]: evt.target.value });
    }


    function getData(data, key) {
        return data[key] || undefined;
    }

    const RegisterForm = () => {
        return <>
            {alertJSX || ''}
            <div className='p-3 row row row-cols-1 row-cols-md-2' id='formRegister'>
                <div className='mb-3'>
                    <label className='fw-bolder'>First Name</label>
                    <Input status={error['fname'] && 'error'} value={getData(registerData, 'fname')} data-name='fname' onChange={e => setData('fname', e, 'First name', registerData, setRegisterData)} size='large' placeholder="Enter your first name" data-required data-validator='validateEmptyString' onClick={e => removeError(e)} />
                    {error['fname']}
                </div>

                <div className='mb-2'>
                    <label className='fw-bolder'>Other Names</label>
                    <Input status={error['oname'] && 'error'} value={getData(registerData, 'oname')} data-name='oname' onChange={e => setData('oname', e, 'Other names', registerData, setRegisterData)} size='large' placeholder="Enter your other names" data-required data-validator='validateEmptyString' onClick={e => removeError(e)} />
                    {error['oname']}
                </div>

                <div className='mb-2'>
                    <label className='fw-bolder'>Email</label>
                    <Input status={error['email'] && 'error'} value={getData(registerData, 'email')} data-name='email' onChange={e => setData('email', e, 'Email', registerData, setRegisterData)} size='large' placeholder="Enter your Email" data-required data-validator='validateSimpleEmail' onClick={e => removeError(e)} />
                    {error['email']}
                </div>

                <div className='mb-2'>
                    <label className='fw-bolder'>Telephone</label>
                    <Input type="number" status={error['telephone'] && 'error'} value={getData(registerData, 'telephone')} data-name='telephone' onChange={e => setData('telephone', e, 'Telephone', registerData, setRegisterData)} size='large' placeholder="Enter your Telephone" data-required data-validator='validateEmptyString' onClick={e => removeError(e)} />
                    {error['telephone']}
                </div>

                <div className='mb-2'>
                    <label className='fw-bolder'>Password</label>
                    <Input.Password value={getData(registerData, 'password')} onChange={e => setData('password', e, 'Password', registerData, setRegisterData)} data-name='password' size='large' placeholder="Enter your password" data-required data-validator='validateEmptyString' onClick={e => removeError(e)} />
                    {error['password']}
                </div>

                <div className='mb-2'>
                    <label className='fw-bolder'>Confirm Password</label>
                    <Input.Password value={getData(registerData, 'cpassword')} onChange={e => setData('cpassword', e, 'Password', registerData, setRegisterData)} data-name='cpassword' size='large' placeholder="Confirm your password" data-required data-validator='validateEmptyString' onClick={e => removeError(e)} />
                    {error['cpassword']}
                </div>
            </div>
            <div>
                <div>
                    <label className='fw-bolder'>Clicking on the Register button is an indication that you agree to the <a href='#'>Rules, Terms and Conditions</a> of {Settings.appName}</label>
                </div>
                <div>
                    <Button className='btn btn-success btn-block rounded-pill mt-3 h-100' loading={registerLoading} onClick={e => register()}><i className='fas fa-user-plus'></i>&nbsp; Register </Button>
                </div>
            </div>
        </>
    };


    async function register() {
        setAlertJSX('');
        setRegisterLoading(true);
        const data = utils.extractData('#formRegister', 'name');
        const v = utils.validateSoftData(data);
        if (!v.valid) {
            const elem = $(`[data-name='${v.name}']`);
            $(elem).addClass('error');
            setRegisterLoading(false);
            return;
        }
        const res = await utils.requestWithReauth('POST', `${Settings.backend}/self_registration`, null, registerData);
        if (res.status == 'Ok') {
            utils.addItemsToIndexedDB(res.insertedData[0], 0, 'user', 'user');
            utils.clearFormData(registerData, setRegisterData);
            valuesStore.setValue('loggedIn', true);
            valuesStore.setValue('showLoginModal', false);
            setUserMenuOnLogin();
        } else {
            const msg = res.msg;
            showAlert('Error', msg, 'error');
        }
        setRegisterLoading(false);
    }



    const tabItems = [
        { label: 'Sign in', key: 'signin-1', children: LoginForm() }, // remember to pass the key prop
        { label: 'Register', key: 'item-2', children: RegisterForm() }
    ];

    function responseFacebook(response) {
        const email = response.email;
        const fname = response.first_name;
        const lname = response.last_name;
        const mname = response.middle_name || '';
        const picture = response.picture.data.url;
        loginFG(email, fname, lname, mname, picture, 'facebook');
    }


    function responseGoogle(res) {
        const credentials = res.credential;
        const data = decodeToken(credentials);
        const email = data.email;
        const fname = data.given_name;
        const lname = data.family_name;
        const mname = '';
        const picture = data.picture;
        loginFG(email, fname, lname, mname, picture, 'google');

    }

    function showAlert(message, description, status, closable = false, showIcon = true) {
        setAlertJSX(<Alert
            message={message}
            description={description}
            type={status}
            closable={closable}
            showIcon={showIcon}
        />);
    }

    async function loginFG(email, fname, lname, mname, picture, origin) {
        try {
            setAlertJSX('');
            const data = { email, fname, lname, mname, picture, origin };
            const res = await utils.requestWithReauth('POST', `${Settings.backend}/other_registration`, null, data);
            if (res.status == 'Ok') {
                utils.addItemsToIndexedDB(res.insertedData, 0, 'user', 'user');
                valuesStore.setValue('loggedIn', true);
                valuesStore.setValue('showLoginModal', false);
                setUserMenuOnLogin();
            } else {
                const msg = res.msg;
                showAlert('Error', msg, 'error');
            }
            setAvatar(picture);
        } catch (e) {
            console.log(e);
        }
    }

    async function login() {
        setAlertJSX('');
        setSigninLoading(true);
        const data = utils.extractData('#formLogin', 'name');
        const v = utils.validateSoftData(data);
        if (!v.valid) {
            const elem = $(`[data-name='${v.name}']`);
            $(elem).addClass('error');
            setSigninLoading(false);
            return;
        }
        const res = await utils.requestWithReauth('POST', `${Settings.backend}/self_login`, null, loginData);
        if (res.status == 'Ok') {
            utils.addItemsToIndexedDB(res.insertedData, 0, 'user', 'user');
            utils.clearFormData(loginData, setLoginData);
            valuesStore.setValue('loggedIn', true);
            valuesStore.setValue('showLoginModal', false);
            setUserMenuOnLogin();
        } else {
            const msg = res.msg;
            showAlert('Error', msg, 'error');
        }
        setSigninLoading(false);
    }

    async function onFacebookLogin(renderProps) {
        const tbl = Settings.dbTables[0].tblName;
        const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
        const data = await db.getByIndex(tbl, 'readwrite', 'user', 'user');
        if (!data.data || !data.data.data.logged_in) {
            renderProps.onClick();
        }
    }

    function removeError(e) {
        const elem = $(e.target);
        $(elem).removeClass('error');
    }

    function LoginForm() {
        return <>
            {alertJSX || ''}
            <label className='fw-bolder h6 mt-2'>Sign in with:</label>
            <div className='row g-0 p-3'>
                <div className='col-md-6 mt-1 borderx'>
                    <div className='container'>
                        <div id='googleDiv' className='w-100' />
                    </div>
                </div>
                <div className='col-md-6 borderx'>
                    <div className='container'>
                        <FacebookLogin
                            appId={Settings.facebookAppID}
                            autoLoad={false}
                            fields="name,email,picture,first_name,last_name,middle_name"
                            callback={responseFacebook}
                            render={renderProps => (
                                <div onClick={e => onFacebookLogin(renderProps)} className='btn btn-primary w-100' style={{ height: '39px' }}><i className='fab fa-facebook me-2'></i>Facebook</div>
                            )}
                        />
                    </div>
                </div>
                <div className='col-md-12 borderx'>
                    <div className='container'>
                        <div className='mt-2' id='formLogin'>
                            <div className='mb-3'>
                                <label className='fw-bolder'>Email or Phone Number</label>
                                <Input value={getData(loginData, 'lgn_userId')} onChange={e => setData('lgn_userId', e, 'Email or Phone Number', loginData, setLoginData)} size='large' placeholder="Email or Phone number" data-name='login_email_phone' data-required data-validator='validateEmptyString' onClick={e => removeError(e)} />
                                {error['lgn_userId']}
                            </div>

                            <div className='mb-3'>
                                <label className='fw-bolder'>Password</label>
                                <Input.Password value={getData(loginData, 'lgn_password')} onChange={e => setData('lgn_password', e, 'Password', loginData, setLoginData)} size='large' placeholder="Enter your password" data-name='login_password' data-required data-validator='validateEmptyString' onClick={e => removeError(e)} />
                                {error['lgn_password']}
                            </div>

                            <Button className='btn btn-success btn-block rounded-pill mt-3 h-100' loading={signinLoading} onClick={e => login()}><i className='fas fa-toggle-on'></i>&nbsp; Login </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    };



    function forms() {
        return <Modal width={700} open={showLoginModal} zIndex={1002} header={null} onCancel={() => valuesStore.setValue('showLoginModal', false)} centered footer={null}>
            <Tabs defaultActiveKey='1' items={tabItems} />
        </Modal>
    }

    return { userMenu,loginComplete, forms, setUserMenuOnLogin, setUserMenuOnLogout };
};

