import React, { useEffect, useMemo, useState } from 'react';
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
// import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import './css/mdb.min.css';
import './font/fontawesome/css/all.min.css'
import './css/custom/animations.css';
import './css/custom/tweeks.css';
// import './css/bootstrap5.min.css';
import "./css/styles/main.css";
import "./css/styles/responsive.css";

import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import useWindowDimensions from './js/hooks/screensize';

import SettingsStore from './js/store/settings-store';
import ValuesStore from './js/store/values-store';
import utils from './js/dependencies/custom/react-utilities'
// import IndexedDB from './js/dependencies/custom/indexeddb'
// import Settings from './js/dependencies/custom/settings';

//admin paths
import Admin from './js/pages/admin/admin';
import AdminFiles from './js/pages/admin/admin_files';
import AdminRoles from './js/pages/admin/admin_roles';
import AdminPerms from './js/pages/admin/admin_perms';
import AdminRoleFilesLink from './js/pages/admin/admin_role_files_link';
import AdminRoleLink from './js/pages/admin/admin_role_link';
import AdminRolePerm from './js/pages/admin/admin_role_perm';
import AdminHome from './js/pages/admin/home';


import Page404 from './js/pages/admin/404';
import Landing from './js/pages/admin/landing';


import Login from './js/pages/admin/login';

import ChangePassword from './js/pages/admin/change_password';
import InitRecoverPassword from './js/pages/admin/init_recover_password';
import CompleterecoverPassword from './js/pages/admin/complete_recover_password';
import Record from './js/pages/admin/record';
import Cards from './js/pages/admin/cards';
import Dashboard from './js/pages/admin/dashboard';
import Inventory from './js/pages/admin/inventory';
import AllCategories from './js/pages/admin/all_categories';
import Supplier from './js/pages/admin/supplier';
import Product from './js/pages/admin/product';
import Store from './js/pages/admin/store';

import Report from './js/pages/admin/report';
import StoreDetails from './js/pages/admin/storeDetails';



function App() {
  const settingsStore = SettingsStore();
  const valuesStore = ValuesStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { vpWidth } = useWindowDimensions();
  

  const newLocation = useLocation();
  const urlFileName = utils.getUrlFileName();

  function hasRoute() {
    const timer = setInterval(() => {
      const routesAvailable = valuesStore.getValue('permitted_routes');
      if (routesAvailable.length > 0) {
        clearInterval(timer);
        const routes = valuesStore.getArrayObjectsValue('permitted_routes', 'path', urlFileName);
        if (Object.keys(routes).length <= 0) {
          navigate(-1);//go back to the previous page if the requested routes is not found in what the use can access
        }
      }
    }, 1000);
  }

  useMemo(() => {
    if (!(['/login', '/init_psd_recovery', '/complete_recover_password'].includes(location.pathname))) {
      utils.bootstrap(valuesStore, settingsStore);
    }
  
    // hasRoute();

    return () => {
      //clean up here
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/init_psd_recovery" element={<InitRecoverPassword />} />
        <Route
          path="/complete_recover_password"
          element={<CompleterecoverPassword />}
        />

        <Route path="/admin" element={<AdminHome />}>
          <Route path="admin" element={<Admin />} />
          <Route path="admin_files" element={<AdminFiles />} />
          <Route path="admin_roles" element={<AdminRoles />} />
          <Route path="admin_perms" element={<AdminPerms />} />
          <Route
            path="admin_role_files_link"
            element={<AdminRoleFilesLink />}
          />
          <Route path="admin_role_link" element={<AdminRoleLink />} />
          <Route path="admin_role_perm" element={<AdminRolePerm />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/product/:id" element={<Product />} />
          <Route path="all_categories" element={<AllCategories />} />
          <Route path="supplier" element={<Supplier />} />
          <Route path="store" element={<Store />} />
          <Route path="search" element={<Store />} />

          <Route path="store/storeDetails/:id" element={<StoreDetails />} />
          <Route path="report" element={<Report />} />
          <Route path="change_password" element={<ChangePassword />} />

          <Route index path="landing" element={<Landing />} />
          <Route path="*" element={<Page404 homepage="/admin/landing" />} />
        </Route>
        <Route path="*" element={<Page404 homepage="/admin/landing" />} />
      </Routes>
    </>
  );
}

//disable auto zoom in on iphone and ipad. iphone and ipad automatically zoom in when text size is less than 16px
if (utils.checkIsIOS()) {
  utils.addMaximumScaleToMetaViewport();
}

export default App;
