

import { useState, useMemo, createElement, memo } from 'react';
import $ from 'jquery';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import ValuesStore from '../store/values-store';
import { Drawer, Collapse } from 'antd';
import LoadingOverlay from 'react-loading-overlay';
import Loader from "react-spinners/ScaleLoader";
import { Link, useSearchParams } from 'react-router-dom';
import IndexedDB from '../dependencies/custom/indexeddb';
import { MinusOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const { Panel } = Collapse;

LoadingOverlay.propTypes = undefined;//fixing  a bug in LoadingOverlay

export default function usePhoneFilter(filterHook, applyFilters, setLoaderActive, setLocationModal) {
    const valuesStore = ValuesStore();
    const [phoneFilterDrawer, setPhoneFilterDrawer] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    useMemo(() => {
    }, []);

    const clearPhoneFilters = () => {        
        setSearchParams({});
        $('.phone-filters').find('input').each((i, el) => {
            $(el).val('');
            $(el).prop('checked', false);
        });
        setLoaderActive(true);
        setTimeout(async e => {
            await applyFilters();
        }, 1000);
        setPhoneFilterDrawer(false);
    }

    function getPhoneAppliedFilters() {
        const filters = window.location.search.replace('?', '').split('&');
        const exmpt = ['location', 'price'];
        const btns = filters.map((f) => {
            const ft = f.split('=');
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            });
            if (!exmpt.includes(ft[0].toLowerCase()) && ft[0].trim() !== '' && ft[1].trim() !== '')
                return <Button key={`${ft[0]}_${ft[1]}`} className='h-scrolling-item me-2' data-filter={ft[0]} size='large'><i className='fas fa-times text-danger' onClick={removePhoneButtonFilter} />&nbsp;{params[ft[0]]}</Button>
        });
        return btns;
    }

    async function removePhoneButtonFilter(e) {
        const filter = $(e.target).closest('button').data('filter');        
        const sp = { ...utils.getQString() }
        delete sp[filter];
        setSearchParams(sp);
        $('.phone-filters').find('input').each((i, el) => {
            if ($(el).prop('name') === filter) {
                $(el).val('');
                $(el).prop('checked', false);
            }
        });
        setLoaderActive(true);
        await applyFilters();
    }

    const phoneFilter = () => {
        return <Drawer
            headerStyle={{ background: `${Settings.primaryColorHex}` }}
            bodyStyle={{ padding: '5px' }}
            width={'100%'}
            zIndex={1200}
            title={<label className='text-white h5'>Apply Filters</label>}
            placement='right'
            closable={false}
            onClose={e => setPhoneFilterDrawer(false)}
            open={phoneFilterDrawer}
        // extra={
        //     <i onClick={clearPhoneFilters} className='text-white fas fa-times fa-2x' />
        // }
        >
            <LoadingOverlay
                styles={{
                    wrapper: (base) => ({
                        ...base,
                    }),
                    overlay: (base) => ({
                        ...base,
                        backgroundColor: 'rgba(255,255,255,.7)',
                    }),
                    content: (base) => ({
                        ...base,
                        margin: `0px auto`
                    }),
                    spinner: (base) => ({
                        ...base
                    })
                }}
            // active={loaderActive}
            // spinner={<Loader id='feedbackLoader' color='#1565c0' loading={loaderActive} cssOverride={{ display: "block", margin: '0 auto' }} size={50} />}
            >
                <div className='container mt-3'>
                    <div className='row'>
                        <div className='col-12 h-100'>
                            <Collapse className='border-0 bg-white phone-filters' expandIcon={({ isActive }) => isActive ? <MinusOutlined className={`${Settings.textColor}`} /> : <PlusOutlined className={`${Settings.textColor}`} />} expandIconPosition={'end'} accordion>
                                {/* <Panel header={<label className='text-bold-mediumx fw-bolder'>Location</label>} key={`phone_filter_location`}>
                                    <Button className='' onClick={e=>setLocationModal(true)}>Set Location</Button>
                                </Panel> */}
                                {
                                    filterHook.mountedFilters && filterHook.mountedFilters
                                        .map((item, i) => {
                                            return <Panel header={<label className='text-bold-mediumx fw-bolder'>{filterHook.filterNames[i]}</label>} key={`phone_filter_${i}`}>
                                                {item}
                                            </Panel>
                                        })
                                }
                            </Collapse>
                            <div className='mt-5 row w-100 g-0' style={{ position: 'fixed', bottom: 0, left: 0, zIndex: 1002 }}>
                                <div className='col-8'>
                                    <Button size='large' onClick={e => setPhoneFilterDrawer(false)} className={`w-100 text-white ${Settings.secondaryColor}`}>Apply</Button>
                                </div>
                                <div className='col-4'>
                                    <Button size='large' onClick={clearPhoneFilters} className='w-100 bg-danger text-white'><i className='fas fa-trash' />&nbsp;Clear</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LoadingOverlay>
        </Drawer>
    }

    return { setPhoneFilterDrawer, phoneFilter, getPhoneAppliedFilters };
};

