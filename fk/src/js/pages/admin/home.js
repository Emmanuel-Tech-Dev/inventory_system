

import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UploadOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import { googleLogout } from '@react-oauth/google';
import { Layout, Menu, message, theme, Avatar, Dropdown, Space, Image, } from 'antd';
import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import utils from '../../dependencies/custom/react-utilities';
import Settings from '../../dependencies/custom/settings';
import useAdd from '../../hooks/add';
import ValuesStore from '../../store/values-store';
import { Offline, Online } from "react-detect-offline";
// import SideNav from '../../layout/Sidenav';
const { Header, Sider, Content, Footer } = Layout;

const AdminHome = () => {
    const valuesStore = ValuesStore();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState('1');
    const [tokenValid, setTokenValid] = useState(false);
    const [pages, setPages] = useState([]);
    const [avatar, setAvatar] = useState(undefined);
    const [schoolDetails, setSchoolDetails] = useState();
    const qh = utils.getHString();
    // const siderWidth = 215;
    const siderWidth = 250;
    // const siderWidth = 200;    
    const siderColor = '#006064';
    // const siderColor = '#00695c';
    // const siderColor = Settings.primaryColorHex;
    // 
    const add = useAdd('tables_metadata', 'table_name');
    const {
        token: { colorBgContainer },
    } = theme.useToken();


    function changePage(page, key) {
        setSelectedMenuItem(key);
        navigate(page);
    }

    function changePassword() {
        add.setTblName('admin');
        add.setShowModal(true);
        add.setSaveCompleted(false);
    }

    async function addOnOk() {
        const data = { ...add.record, token: utils.getCookie('token') };
        const res = await utils.requestWithReauth('post', `${Settings.backend}/change_admin_password`, null, data);
        message.success(res.msg);
        if (res.status === 'Ok') {
            add.setShowModal(false);
            utils.logout(navigate);
        }
    }


    useMemo(() => {
        const institution = valuesStore.getArrayObjectsValue('settings', 'prop', 'INSTITUTION_DETAILS')?.value;
        if (institution) {
            setSchoolDetails(JSON.parse(institution));
        }


        if (qh['page']) {
            setSelectedMenuItem(qh['page']);
        }
        getAssignedPages();
        getAssignedPemissions();
        // utils.verifyToken(navigate, setTokenValid, undefined, undefined);

    }, [window.location.hash, add.saveCompleted, valuesStore['settings']]);


    async function getAssignedPages() {
        const token = utils.getCookie('token');
        let res = await utils.requestWithReauth('post', `${Settings.backend}/get_assigned_pages`, null, { token });
        valuesStore.setValue('permitted_routes', res);
        if (Array.isArray(res)) {
            const pages = res?.map(r => {
                return {
                    key: r?.id,
                    icon: <i className={`${r?.icon}`} />,
                    label: <label onClick={e => changePage(r?.path, r?.id.toString())}>{r?.description}</label>,
                }
            });
            setPages(pages);
        } else {
            message.error(res.msg);
        }
    }

    async function getAssignedPemissions() {
        const token = utils.getCookie('token');
        let res = await utils.requestWithReauth('post', `${Settings.backend}/get_assigned_permissions`, null, { token });
        valuesStore.setValue('permissions', res);
    }





    function menu() {
        return <Menu
            className='h-scrolling-item'
            theme="dark"
            mode="inline"
            style={{ background: siderColor,/*color:'black'/*fontSize:'12pt'*/ }}
            // selectedKeys={[selectedMenuItem]}
            items={pages}
        />
    }


    return (
        <Layout className='' style={{ overflowX: 'hidden' }}>
            <Sider
                width={siderWidth}
                breakpoint="lg"
                onBreakpoint={(broken) => {

                }}
                onCollapse={(collapsed, type) => {                    
                }}
                collapsedWidth="0"
                style={{
                    background: siderColor,
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
                className='h-scrolling-wrapper'
                trigger={null}
                collapsible
                collapsed={collapsed}
            >
              
                <div className='d-flex flex-wrap'>
                    {/* <div className='mx-auto mb-3 mt-1x w-100 border-bottomx'>
                        <center className="demo-logo bg-white" >{schoolDetails?.logo && <img src={`${Settings.backend}/${schoolDetails?.logo}`} width={75} />}</center>
                    </div> */}
                    <div className='mx-auto mb-3 mt-1'>
                        <center className="demo-logo" >{schoolDetails?.logo && <Image src={`${Settings.backend}/${schoolDetails?.logo}`} width={130} preview={false}/>}</center>
                    </div>
                    {menu()}
                </div>

            </Sider>
            <Layout
                style={{
                    marginLeft: siderWidth,
                }}
                className="w-100"
            >
                <Header
                    className='border-bottom'
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                    }}
                >
                    {/* <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    /> */}
                    <div className='container-fluid border-bottomx greyx lighten-3x'>
                        <div className='d-flex justify-content-between'>
                            <div>
                                {/* <div className="demo-logo" >{schoolDetails?.logo && <img src={`${Settings.backend}/${schoolDetails?.logo}`} width={50} height={40} />}</div> */}
                                <label style={{ color: 'rgb(160 106 1)', fontSize: '18px' }} className='fw-bold text-uppercase'>{valuesStore.getArrayObjectsValue('settings', 'prop', 'APP_NAME')?.value}</label>
                                <label className='fw-boldx'> {valuesStore.getArrayObjectsValue('settings', 'prop', 'APP_VERSION')?.value}</label>
                            </div>
                            <div className='d-flex'>
                                <Dropdown menu={{
                                    items: [
                                        {
                                            key: '1',
                                            label: (
                                                <a onClick={e => navigate('./change_password')}>
                                                    <i className='fas fa-sign-out-alt' /> Change Password
                                                </a>
                                            ),
                                        },
                                        {
                                            key: '2',
                                            label: (
                                                <a onClick={e => utils.logout(navigate)}>
                                                    <i className='fas fa-sign-out-alt' /> Sign out
                                                </a>
                                            ),
                                        }
                                    ]
                                }} arrow>
                                    <a onClick={(e) => e.preventDefault()}>
                                        <Space>
                                            <Avatar size='large' icon={<UserOutlined />} src={avatar} />
                                        </Space>
                                    </a>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </Header>

                <Content
                    className="w-100"
                    style={{
                        // margin: '24px 16px',
                        paddingTop: 30,
                        paddingLeft: 14,
                        paddingRight: 14,
                        minHeight: 280,
                    }}
                >
                    <div className='bg-whitex p-3x'>
                        {/* <Online>
                            <p>You are online.</p>
                        </Online> */}
                        {/* <Offline>
                            <Alert
                                message="Internet Connection Offline"
                                description="OOPs! You are offline. Please check your internet connection."
                                type="error"
                                closable
                                className='mb-3'
                            />
                        </Offline> */}

                        {/*tokenValid &&*/ <Outlet />}
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center', background: '#fafafa', marginTop: "1rem" }}>AAMUSTED © {new Date().getFullYear()}</Footer>
            </Layout>
        </Layout>
    );
};
export default AdminHome;