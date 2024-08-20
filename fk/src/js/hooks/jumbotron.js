
import React, { memo, useRef, useMemo, forwardRef, useState, useEffect } from 'react';
import SettingsStore from '../store/settings-store';
import ValuesStore from '../store/values-store';
import Datatable from '../components/datatable';
import { SearchOutlined } from '@ant-design/icons';
import { Input, Tree, TreeSelect, Modal } from 'antd';
import useSearchHook from './searchHook';
import Settings from '../dependencies/custom/settings';


const Jumbotron = (prop) => {
    const { text, style, padding } = prop;
    const valuesStore = ValuesStore();
    // const useSearch = useSearchHook();   
    useMemo(() => {

    }, []);

    return (
        <>
            <div className={`${Settings.primaryColor} mt-5 text-white w-100 d-flex justify-content-center flex-wrap`} style={style || { padding: padding || '8rem' }}>
                {/* {useSearch.search()} */}
                <label className='h2'>{text}</label>
            </div>
        </>
    );
}

export default Jumbotron;