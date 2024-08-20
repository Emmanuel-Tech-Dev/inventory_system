

import { useState, useMemo } from 'react';
import $ from 'jquery';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import ValuesStore from '../store/values-store';
import { AutoComplete, Input } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import IndexedDB from '../dependencies/custom/indexeddb';
import { SearchOutlined, DatabaseOutlined, WalletOutlined, ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { levenshteinEditDistance } from 'levenshtein-edit-distance'
import useWindowDimensions from '../components/screensize';

export default function useSearch() {
    const valuesStore = ValuesStore();
    const [options, setOptions] = useState([]);
    const [searchSuffixIcon, setSearchSuffixIcon] = useState(suffixIcon());
    let navigate = useNavigate();
    let searchTimer = null;
    const { vpWidth } = useWindowDimensions();
    useMemo(() => {

    }, []);

    const renderTitle = (value, catRealName, filter, category) => (
        <div className='w-100' onClick={e => {
            navigate(`../${category}?${filter}=${value}`);
        }}
        >
            <a className={`${Settings.textColor}`}>
                {value} {catRealName && 'in'} {catRealName}
            </a>
        </div>
    );

    function suffixIcon() {
        return <i className='fas fa-bookmark' onClick={e => bookmark()} />;
    }

    const onSearch = (searchText) => {
        clearTimeout(searchTimer);
        let suggestions = [{ value: searchText, filter: 'q', distance: 0, category: 'search' }];
        searchTimer = setTimeout(() => {
            const searchables = valuesStore.getValuesBy('filter_opt', 'indexed_for_search', 1);
            searchables.forEach((s) => {
                const value = s.opt;
                const filter = s.filter;
                const category = valuesStore.getArrayObjectsValue('filter_to_category', 'filter', filter).category;
                const catRealName = valuesStore.getArrayObjectsValue('categories', 'alias', category).category;
                const distance = levenshteinEditDistance(value, searchText, true);
                suggestions.push({ value, filter, distance, category, catRealName: catRealName });
            });
            suggestions.sort((a, b) => a.distance - b.distance); // b - a for reverse sort. mutates array            
            let final = [];
            suggestions.forEach((s) => {
                if (s.distance <= 5 && s.category) {
                    final.push({
                        label: renderTitle(s.value, s.catRealName, s.filter, s.category),
                    });
                }
            });
            setOptions(
                !searchText ? [] : final
            );
        }, 1000);
    }

    function navigateBack() {
        navigate(-1);
    }

    async function bookmark() {
        if (!valuesStore.getValue('loggedIn')) {
            valuesStore.setValue('showLoginModal', true);
            return;
        }
        const type = 'search';
        const user = valuesStore.getValue('loggedInUser');
        const bookmarkUrl = window.location.href;
        if (window.location.search.trim() === '') return;        
        setSearchSuffixIcon(<LoadingOutlined />);
        let res = await utils.bookmark(`${Settings.backend}/add_to_bookmark`, bookmarkUrl, type, user, null);
        if(res.status ==='Ok'){
            setSearchSuffixIcon(suffixIcon());
        }        
    }

    function search() {
        let inputWidth = vpWidth < valuesStore.getValue('phoneWidthBreakPoint') ? '350px' : '400px';
        let ddWidth = vpWidth < valuesStore.getValue('phoneWidthBreakPoint') ? 350 : 500;
        let prefix = vpWidth < valuesStore.getValue('phoneWidthBreakPoint') ?
            window.location.pathname === '/' ? <SearchOutlined /> : <i onClick={e => navigateBack()} className='fas fa-angle-left fa-2x' /> //if phone and home show search outline else show angle icon
            : <SearchOutlined />;//if desktop, show search icon

        return <AutoComplete
            dropdownMatchSelectWidth={ddWidth}
            options={options}
            onSearch={onSearch}
        >
            <Input
                className='rounded'
                allowClear
                prefix={prefix}
                suffix={searchSuffixIcon}
                placeholder="Search for ..."
                style={{ width: inputWidth }}
                size="large" />

        </AutoComplete>
    }

    return { search };
};

