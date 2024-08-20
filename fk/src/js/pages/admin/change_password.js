
import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import ValuesStore from '../../store/values-store';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import utils from '../../dependencies/custom/react-utilities';
import { Space, Button, Avatar, message, Input } from 'antd';
import { UserOutlined,AntDesignOutlined, LockOutlined } from '@ant-design/icons'

import Settings from '../../dependencies/custom/settings';


const ChangePassword = (props) => {
    const valuesStore = ValuesStore();
    const [oldPassword, setOldPassword] = useState();
    const [password, setPassword] = useState();
    const [confPassword, setConfPassword] = useState();

    const navigate = useNavigate();
    const [btnLoading, setBtnLoading] = useState(false);
    useMemo(() => {

    }, []);

    async function change() {
        setBtnLoading(true);
        await utils.changePassword(oldPassword, password, confPassword, navigate, '../../login')        
        setBtnLoading(false);
    }

    return (
        <>
            <div className='container'>
                <div className='row'>
                    <div className='col-sm-12 col-md-6 col-lg-3 mx-autox mb-2 borderx special-colorx rounded p-3' >
                        <Space className='w-100' direction='vertical'> 
                            <Input.Password onPressEnter={e => change()} className='rounded' type='text' prefix={<LockOutlined className="site-form-item-icon" />} placeholder='Old Password' value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                            <Input.Password onPressEnter={e => change()} className='rounded' prefix={<LockOutlined className="site-form-item-icon" />} placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} />
                            <Input.Password onPressEnter={e => change()} className='rounded' prefix={<LockOutlined className="site-form-item-icon" />} placeholder='Confirm Password' value={confPassword} onChange={e => setConfPassword(e.target.value)} />
                            <Button loading={btnLoading} className='' onClick={e => change()}><i className='fas fa-unlock me-2' />Change</Button>
                        </Space>
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(ChangePassword);