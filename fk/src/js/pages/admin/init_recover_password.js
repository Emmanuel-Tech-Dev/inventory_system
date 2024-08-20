
import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import ValuesStore from '../../store/values-store';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import utils from '../../dependencies/custom/react-utilities';
import { Space, Button, Avatar, message, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons'

import Settings from '../../dependencies/custom/settings';


const InitPasswordRecovery = (props) => {
    const valuesStore = ValuesStore();
    const [staffId, setStaffId] = useState();
    const [usernamePhone, setUsernamePhone] = useState();


    const navigate = useNavigate();
    const [btnLoading, setBtnLoading] = useState(false);
    useMemo(() => {

    }, []);

    async function init() {
        setBtnLoading(true);
        await recoverPassword(staffId, usernamePhone)
        setBtnLoading(false);
    }

    function goBackToLogin() {
        navigate('../../login');
    }

    async function recoverPassword(staffId, usernamePhone) {
        const res1 = await utils.request('post', `${Settings.backend}/get_initial_urls`, null, {});
        if (!res1?.urls?.passwordRecoveryInitUrl) {            
            utils.showNotification(undefined, 'Password recovery request could not be placed. URL not found');
            return;
        }
        const res = await utils.request('post', res1?.urls?.passwordRecoveryInitUrl, null, { staffId, usernamePhone, origin: `${window.location.origin}${res1?.urls?.basedir}` });
        if (res?.status == 'Ok') {            
            utils.showNotification(undefined, 'Operation succesful. An email has been sent to your inbox','text-success');
        } else {            
            utils.showNotification(undefined, res.details);
        }
    }

    return (
        <>
            <div className='container'>
                <div className='row'>
                    <div className='col-sm-12 col-md-6 col-lg-3 mx-auto mb-2 border special-color rounded p-3' style={{ marginTop: '15%' }} >
                        <Space className='w-100' direction='vertical'>
                            <div className='d-flex justify-content-center special-colorx rounded' >
                                <img className='mx-auto mb-3' width={190} height={150} src={`${Settings.backend}/fav.png`} />
                            </div>
                            <Input onPressEnter={e => init()} className='rounded' type='text' prefix={<UserOutlined className="site-form-item-icon" />} placeholder='Staff ID' value={staffId} onChange={e => setStaffId(e.target.value)} />
                            <Input onPressEnter={e => init()} className='rounded' prefix={<UserOutlined className="site-form-item-icon" />} placeholder='Username or Telephone' value={usernamePhone} onChange={e => setUsernamePhone(e.target.value)} />
                            <Space wrap>
                                <Button loading={btnLoading} className='btn-success border-0' onClick={e => init()}><i className='fas fa-unlock me-2' />Recover</Button>
                                <Button className='btn-success border-0' onClick={e => goBackToLogin()}><i className='fas fa-unlock me-2' />Login</Button>
                            </Space>
                        </Space>
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(InitPasswordRecovery);