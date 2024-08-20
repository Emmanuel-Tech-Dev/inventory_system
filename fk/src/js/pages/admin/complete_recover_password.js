
import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import ValuesStore from '../../store/values-store';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import utils from '../../dependencies/custom/react-utilities';
import { Space, Button, Spin, message, Input } from 'antd';
import { LoadingOutlined, LockOutlined } from '@ant-design/icons'

import Settings from '../../dependencies/custom/settings';


const CompletePasswordRecovery = (props) => {
    const valuesStore = ValuesStore();
    const [password, setPassword] = useState();
    const [confPassword, setConfPassword] = useState();
    const location = useLocation();
    const navigate = useNavigate();
    const [btnLoading, setBtnLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [token, setToken] = useState();
    const [urls, setUrls] = useState();
    useMemo(() => {
        // console.log(location.search);
        const qs = location.search.split('&');
        const token = qs[0]?.replace('?', '')?.split('=')[1];
        const callback = qs[1];
        verifyToken(token);
        getUrls();
    }, [JSON.stringify(urls)]);

    async function getUrls() {
        const res1 = await utils.request('post', `${Settings.backend}/get_initial_urls`, null, {});
        setUrls(res1?.urls);
    }

    async function verifyToken(token) {
        if (!urls) { return; }                
        const res = await utils.request('post', urls?.passwordRecoveryVerifyTokenUrl, null, { token });
        if (res?.status == 'Ok') {
            setTokenValid(true);
            setToken(token);
        } else {            
            utils.showNotification(undefined, 'It seems there is an issue with the password recovery link. Please try the password recovery process again');
            setTimeout(e => { navigate('../../init_psd_recovery') }, 2000);
        }
    }

    async function change() {
        setBtnLoading(true);
        if (!urls) { return; }        
        const res = await utils.request('post', urls?.passwordRecoveryCompleteUrl, null, { token, password, confPassword });
        if (res?.status == 'Ok') {            
            utils.showNotification(undefined, 'Operation succesful. Please login with your new credentials','text-success');
            navigate('../../login');
        }else{            
            utils.showNotification(undefined, res?.details);
        }
        setBtnLoading(false);
    }
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

    return (
        <>
            {tokenValid ?
                <div className='container'>
                    <div className='row'>
                        <div className='col-sm-12 col-md-6 col-lg-3 mx-auto mb-2 border special-color rounded p-3' style={{ marginTop: '15%' }} >
                            <Space className='w-100' direction='vertical'>
                                <div className='d-flex justify-content-center special-colorx rounded' >
                                    <img className='mx-auto mb-3' width={190} height={150} src={`${Settings.backend}/fav.png`} alt=''/>
                                </div>
                                <Input.Password onPressEnter={e => change()} className='rounded' prefix={<LockOutlined className="site-form-item-icon" />} placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} />
                                <Input.Password onPressEnter={e => change()} className='rounded' prefix={<LockOutlined className="site-form-item-icon" />} placeholder='Confirm Password' value={confPassword} onChange={e => setConfPassword(e.target.value)} />
                                <Button loading={btnLoading} className='' onClick={e => change()}><i className='fas fa-unlock me-2' />Change</Button>
                            </Space>
                        </div>
                    </div>
                </div>
                : <Spin indicator={antIcon} />
            }
        </>
    );
}

export default memo(CompletePasswordRecovery);