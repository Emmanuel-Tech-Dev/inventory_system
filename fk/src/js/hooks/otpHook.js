

import { useState, useMemo } from 'react';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import ValuesStore from '../store/values-store';
import { Input, notification, Drawer, Dropdown, Avatar, Tabs, Button, Alert, Modal, Badge } from 'antd';
import IndexedDB from '../dependencies/custom/indexeddb';

export default function useOTP(authHook) {
    const valuesStore = ValuesStore();
    const [otpShowModal, setOtpShowModal] = useState(false);
    const [otpMsgGuide, setOtpMsgGuide] = useState('Please note that a verification code will be sent as SMS to you after submitting your phone number. Please enter that verification code into the verification code field');
    const [otpPhone, setOtpPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [verifyPhoneLoading, setVerifyPhoneLoading] = useState(false);
    const [verifyBtnText, setVerifyBtnText] = useState('Send'/*'Verify'*/);
    const [verificationComplete, setVerificationComplete] = useState(true);
    const [country, setCountry] = useState('+233');
    const [extraInitData, setExtraInitData] = useState({});
    const [extraVerifyData, setExtraVerifyData] = useState({});
    const [initializationEndpoint, setInitializationEndpoint] = useState(undefined);
    const [verificationEndpoint, setVerificationEndpoint] = useState(undefined);
    const [modalTitle, setModalTitle] = useState(undefined);

    useMemo(() => {

    }, []);

    const countryCodes = (<select onChange={e => setCountry(e.target.value)} value={country} data-name='country_code' data-required data-validator='validateEmptyString'>
        <option value="+233">+233</option>
    </select>);

    function showNotification(msg, description, placement = 'bottomRight') {
        notification.open({
            message: <label className="fw-bolder text-danger"><i className='fas fa-exclamation-circle'></i> {msg}</label>,
            description: description,
            placement: placement
        });
    }
    // {firstName}, .

    function otpModal(title = 'Phone number verification', initEndpoint = 'init_verify_phone', verifyEndpoint = 'verify_phone') {
        return <Modal open={otpShowModal} title={modalTitle || title} footer={null} onCancel={e => setOtpShowModal(false)}>
            <p className='fw-bolder blue-textx'>{otpMsgGuide}</p>
            <label className='fw-bolder'>Telephone</label>
            <Input className='mb-3' onChange={e => setOtpPhone(e.target.value)} value={otpPhone} type='text' size='large' addonBefore={countryCodes} placeholder='Enter your phone number eg 241231234' />

            <label className='fw-bolder'>Verification Code </label>
            <Input onChange={e => setOtpCode(e.target.value)} value={otpCode} type='text' size='large' placeholder='Enter your verifcation code' />
            <div>
                <Button className='btn btn-success btn-block rounded-pill mt-3 h-100' loading={verifyPhoneLoading} onClick={e => initVerifyPhone(initEndpoint, verifyEndpoint)}><i className='fas fa-check'></i>&nbsp; {verifyBtnText} </Button>
            </div>
        </Modal>
    }

    async function initVerifyPhone(initEndpoint = 'init_verify_phone', verifyEndpoint = 'verify_phone') {
        initEndpoint = initializationEndpoint || initEndpoint;
        verifyEndpoint = verificationEndpoint || verifyEndpoint;
        valuesStore.setValue('loggedIn', false);
        valuesStore.setValue('loggedInUser', '');
        switch (verifyBtnText.toLowerCase()) {
            case 'send': {
                setVerifyPhoneLoading(true);
                const p = otpPhone.trim();
                if (p === '' || p === 'N/A' || p.length < 9) {
                    setVerifyPhoneLoading(false);
                    showNotification('Error', 'Invalid phone number');
                    return;
                }
                const data = { phone: otpPhone, country, ...extraInitData };
                const res = await utils.requestWithReauth('POST', `${Settings.backend}/${initEndpoint}`, null, data);
                if (res.status === 'Ok') {
                    setVerifyBtnText('verify');
                } else {
                    showNotification('Error', res.msg);
                }
                setVerifyPhoneLoading(false);
            } break;
            case 'verify': {
                setVerifyPhoneLoading(true);
                const code = otpCode.trim();
                if (code === '') {
                    setVerifyPhoneLoading(false);
                    showNotification('Error', 'Invalid verification code');
                    return;
                }
                const data = { otp: otpCode, ...extraVerifyData };
                const res = await utils.requestWithReauth('POST', `${Settings.backend}/${verifyEndpoint}`, null, data);
                if (res.status === 'Ok') {
                    utils.addItemsToIndexedDB(res.insertedData, 0, 'user', 'user');
                    setVerifyBtnText('send');
                    setOtpShowModal(false);
                    setVerificationComplete(true);
                    valuesStore.setValue('loggedIn', true);
                    valuesStore.setValue('loggedInUser', res.insertedData.telephone);                    
                    if (authHook) {                         
                        authHook.setUserMenuOnLogin();
                        // console.log(authHook);
                    }
                } else {
                    if (authHook) {
                        authHook.setUserMenuOnLogout();
                    }
                    showNotification('Error', res.msg);
                }
                setVerifyPhoneLoading(false);
            }
        }
    }



    return { otpModal, setOtpShowModal, setOtpMsgGuide, verificationComplete, setExtraInitData, setExtraVerifyData, setOtpPhone, setCountry, setModalTitle };
};




