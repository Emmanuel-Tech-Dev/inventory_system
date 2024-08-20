
import React, { useState, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import utils from '../../dependencies/custom/react-utilities';
import { Space, Button, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import Settings from '../../dependencies/custom/settings';


const Login = (props) => {
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const navigate = useNavigate();
    const [btnLoading, setBtnLoading] = useState(false);
    useMemo(() => {

    }, []);

    async function login() {
        setBtnLoading(true);
        await utils.login(username, password, navigate, '../admin/landing');
        setBtnLoading(false);
    }

    return (
        <>
            <div className='container'>
                <div className='row'>
                    <div className='col-sm-12 col-md-6 col-lg-3 mx-auto mb-2 border  cyan darken-4 special-colorx rounded p-3' style={{ marginTop: '15%' }}>
                        <Space className='w-100' direction='vertical'>
                            <div className='d-flex justify-content-center rounded' >
                                <img className='mx-auto mb-3' width={190} height={150} src={`${Settings.backend}/fav.png`} />
                            </div>
                            <Input onPressEnter={e => login()} className='mb-2x rounded' type='text' prefix={<UserOutlined className="site-form-item-icon" />} placeholder='Username' value={username} onChange={e => setUsername(e.target.value)} />
                            <Input.Password onPressEnter={e => login()} className='rounded' prefix={<LockOutlined className="site-form-item-icon" />} placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} />
                            <Space wrap>
                                <Button loading={btnLoading} className='btn-success border-0' onClick={e => login()}><i className='fas fa-unlock me-2' />Login</Button>
                                <Button className='btn-success border-0' onClick={e => navigate('../../init_psd_recovery')}><i className='fas fa-unlock me-2' />Forgot Password</Button>
                            </Space>
                        </Space>
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(Login);