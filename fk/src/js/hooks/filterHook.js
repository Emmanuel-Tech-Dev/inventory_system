import { useState, useMemo, createElement } from 'react';
import $ from 'jquery';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import ValuesStore from '../store/values-store';
import { Button, Drawer, notification, Comment, Avatar, Card, Input } from 'antd';
import LoadingOverlay from 'react-loading-overlay';
import Loader from "react-spinners/ScaleLoader";
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import IndexedDB from '../dependencies/custom/indexeddb';
import { UserOutlined, DislikeFilled, DislikeOutlined, LikeFilled, LikeOutlined, SearchOutlined } from '@ant-design/icons';
import useWindowDimensions from '../components/screensize';
LoadingOverlay.propTypes = undefined;//fixing  a bug in LoadingOverlay

export default function useFilters(dataToRender, applyFilters, setLoaderActive) {
    const valuesStore = ValuesStore();
    const [formModel, setFormModel] = useState(null);
    const [mountedFilters, setMountedFilters] = useState(null);
    const [filterIsBranch, setFilterIsBranch] = useState(true);
    const [editedModel, setEditedModel] = useState('');
    const [editedModelIndex, setEditedModelIndex] = useState(null);
    const c = window.location.pathname.split('/');
    const cat = c[c.length - 1];
    const categories = valuesStore.categories;
    const [categoryMenu, setCategoryMenu] = useState(null);
    const [locations, setLocations] = useState([]);
    const [stats, setStats] = useState([]);
    const [locationStat, setlocationStat] = useState({});
    const [categoryStat, setCategoryStat] = useState({});
    let filterTimer = null;
    const [searchParams, setSearchParams] = useSearchParams();
    const { vpHeight, vpWidth } = useWindowDimensions();
    const isDesktop = vpWidth >= valuesStore.getValue('phoneWidthBreakPoint');
    const [filterNames, setFilterName] = useState([]);
    const [popularFilters, setPopularFilters] = useState();
    // 
    useMemo(() => {
        generateCategories(false);
        //prevCat is set in parent component
        const prevCat = valuesStore.getValue('url_category');//compare previous category against current category.
        if (prevCat !== cat) {
            getCategoryFilters('category', cat);//this function sets formModel
        }
        if (formModel) {
            // if(filterIsBranch){                
            generateFilters(formModel);
            // }            
            generateFilterNames(formModel);
        }
    }, [formModel, cat, stats, locationStat, categoryStat]);

    function statsSetter(s) {
        if (s.stats) {
            // console.log(s.stats)
            setPopular(s.stats);
            setStats(s.stats);
        }
        if (s.otherStats.category) {
            setCategoryStat(s.otherStats.category);
        }
    }

    function setPopular(stats) {
        //sort the stats and go through to find filters that have been indexed to appear on top if its count 
        stats.sort((a, b) => parseInt(b.counter) - parseInt(a.counter));
        let numPopularObtained = 0;
        const popular = stats.map((filter) => {
            const f = valuesStore.getArrayObjectsValue('filters', 'name', filter.filter);
            if (f.appear_on_top) {
                const picture = valuesStore.getArrayObjectsValue('filter_opt', 'opt', filter.value).picture;
                if (numPopularObtained <= Settings.numPopularToAppearOnCategoryTop) {
                    numPopularObtained++;
                    return <div className='d-flex flex-column' key={`${filter.value}_popular`}>
                        <center>
                            <Link onClick={async e => await applyFilters()} className={`${Settings.textColor}`} to={`../${filter.category}?${filter.filter}=${filter.value}`}>
                                <Avatar size='large' src={`${Settings.backend}/${picture}`} icon={<i className={f.icon} />} /></Link>
                        </center>
                        <label>{utils.truncateText(filter.value)}</label>
                    </div>
                }
            }
        }).filter((item) => {
            return item && item;
        });
        setPopularFilters(popular);
    }

    function searchChanged(filter, value, extra) {
        let val = value.toLowerCase();
        $(`[data-name = '${filter}']`).find('.item').each((i, el) => {
            if ($(el).hasClass('searchable')) {
                $(el).hide();
                $(el).find('input').each((i, e) => {
                    const v = e.value.toLowerCase();
                    if (v.includes(val)) {
                        $(el).show();
                    }
                });
            }
        });
    }

    function getPriceFilter() {
        return isDesktop ? <div className='d-flex flex-wrap flex-md-nowrap mb-2' data-name='price'>
            <input className='form-control form-control-sm me-2' type='number' placeholder='Min' onChange={e => filterChanged('Price', e.target.value, 'min', 'minMax')} />
            <input className='form-control form-control-sm' type='number' placeholder='Max' onChange={e => filterChanged('Price', e.target.value, 'max', 'minMax')} />
        </div> : <div className='d-flex' data-name='price'>
            <input className='w-50 form-control form-control-sm me-2' type='number' placeholder='Min' onChange={e => filterChanged('Price', e.target.value, 'min', 'minMax')} />
            <input className='w-50 form-control form-control-sm' type='number' placeholder='Max' onChange={e => filterChanged('Price', e.target.value, 'max', 'minMax')} />
        </div>;
    }

    function generateCategories(showStats = true) {
        if (!valuesStore.getValue('categories')) {
            return;
        }
        let item = valuesStore.getArrayObjectsValue('categories', 'alias', cat);
        let parent = utils.getParentCat(item.super_type, categories, 'id');

        let parentName = '';
        let parentAlias = '';
        let others = [];
        if (parent) {
            //replace parent with the child if the child that has been clicked is also a parent
            if (item.branch) {
                parent = item;
            }
            //use parent id to fetch children
            const parentId = parent.id;
            others = getChildren(parentId);
            parentName = parent.category;
            parentAlias = parent.alias;
        } else {
            //this is the overall parent therefore get subparents or children under this parent
            const parentId = item.id;//get id of parent. use this id to get children
            others = getChildren(parentId);
            parentName = item.category;
            parentAlias = item.alias;
        }

        const html = <Card
            size="small"
            className='card border-0 rounded'
            title='Categories'
            headStyle={{ backgroundColor: `${Settings.secondaryColorHex}`, color: 'white' }}
        >
            <ul type='none' className='categories' onClick={highlightClickedCat}>
                <li>
                    <Link onClick={onCatClick} className='text-dark item' style={{ marginLeft: '-1rem' }} data-to={parentAlias} to={`../${parentAlias}`}>{parentName}</Link>
                </li>
                {
                    others.map((c, i) => {
                        let catCount = 0;
                        if (categoryStat[c.alias]) {
                            catCount = categoryStat[c.alias].length;
                        }
                        return <li className={`${c.alias.toLowerCase() === cat.toLowerCase() ? 'fw-bolder text-bold-medium' : ''} mb-1`} key={c.alias + '_' + i}>
                            <Avatar src={`${Settings.backend}/${c.picture}`} icon={<i className={`${c.icon}`}></i>} size='small' className='me-1' />
                            <Link onClick={onCatClick} data-to={c.alias} className='text-dark item' to={`../${c.alias}`}>
                                {utils.truncateText(c.category, 17)} {c.branch && <i className='float-end fas fa-angle-right'></i>}
                            </Link>
                            {showStats && <label>| {utils.abbreviateNumber(catCount)}</label>}
                        </li>
                    })
                }
            </ul>
        </Card>;
        setCategoryMenu(html);
    }

    function highlightClickedCat(e) {
        const p = window.location.pathname.split('/');
        const ls = p[p.length - 1].toLowerCase();
        $(e.target).closest('.categories').find('a').each(function (i, el) {
            if (ls === $(el).data('to')) {
                $(el).addClass('fw-bolder');
            } else {
                $(el).removeClass('fw-bolder');
            }
        });
    }

    function getCategoryFilters(searchKey, alias) {
        //polling to check the availability of category. 
        let timer = setInterval(function () {
            if (valuesStore.getValue('categories')) {
                const filterClone = valuesStore.getArrayObjectsValue('categories', 'alias', alias);
                if (Object.keys(filterClone).length > 0) {
                    clearInterval(timer);
                    const cloneAlias = filterClone.clone_filter_of;
                    const filters = valuesStore.getValuesBy('filter_to_category', searchKey, cloneAlias);
                    const filterModel = filters.map((f) => {
                        const filter = f.filter;
                        const rules = valuesStore.getArrayObjectsValue('filters', 'name', filter);
                        const options = valuesStore.getValuesBy('filter_opt', 'filter', filter);
                        return {
                            filter: rules,
                            options: options
                        }
                    });
                    setFormModel(filterModel);
                }
            }
        }, 1000);
    }

    function getLocation() {
        const loc = valuesStore.getValue('selected_location');
        const l = valuesStore.getArrayObjectsValue('reg_dist', 'alias', loc);
        const locations = getLocationBreadCrumb(l, []);
        setLocations(locations.reverse());
    }

    function getLocationBreadCrumb(c, locations) {
        const super_type = c.super_type;
        const name = c.name;
        const parent = valuesStore.getArrayObjectsValue('reg_dist', 'id', super_type);
        if (parent.type_alias) {
            locations.push(name);
            getLocationBreadCrumb(parent, locations);
        } else {
            locations.push('Ghana');
        }
        return locations;
    }

    function getChildren(parentId) {
        let children = [];
        categories.forEach(category => {
            if (category.super_type == parentId) {
                children.push(category);
            }
        });
        return children;
    }


    function generateFilterNames(filters) {
        let filnames = [];
        for (let i = 0; i < filters.length; i++) {
            const form = filters[i];
            if (!form) continue;//skip null values which are the unedited areas            
            const filter = form.filter;
            const visible = filter.visible;
            if (!visible) continue;
            const real_name = filter.real_name;
            filnames.push(real_name);
        }
        setFilterName(filnames);
    }


    function generateFilters(f) {
        if (!f) return;
        let filters = [...f];
        if (editedModel !== '') {
            filters = filters.map((fm) => {//filters has changed so replace all unedited areas with null using the name attr
                if (fm.filter.name !== editedModel) {
                    fm = null;//replace untouched/unedited areas with null
                }
                return fm;
            });
        }
        let html = [];
        for (let i = 0; i < filters.length; i++) {
            const form = filters[i];
            if (!form) continue;//skip null values which are the unedited areas
            const filter = form.filter;
            const options = form.options;

            const name = filter.name;//for db relationship
            const visible = filter.visible;
            const real_name = filter.real_name;
            const search = filter.search;
            const type = filter.type.trim();

            const searchable = search ?
                <div className='sticky-top mb-2'>
                    <Input allowClear className='rounded' onChange={e => searchChanged(name, e.target.value, name)} placeholder={`Search ${real_name}`} prefix={<SearchOutlined />} />
                </div> : '';

            if (!visible) continue;

            switch (type) {
                case 'minMax': {
                    const h = <Card
                        // size="small"
                        style={{ zIndex: '100' }}
                        className={`mb-2  border-0 rounded ${isDesktop && 'card'}`}
                        key={real_name}
                    >
                        {isDesktop && real_name}
                        {searchable}
                        {isDesktop ? <div className='d-flex flex-wrap flex-md-nowrap mb-2' data-name={name}>
                            <input className='form-control form-control-sm me-2' type='number' placeholder='Min' onChange={e => filterChanged(name, e.target.value, 'min', type)} />
                            <input className='form-control form-control-sm' type='number' placeholder='Max' onChange={e => filterChanged(name, e.target.value, 'max', type)} />
                        </div> : <div className='d-flex' data-name={name}>
                            <input className='w-50 form-control form-control-sm me-2' type='number' placeholder='Min' onChange={e => filterChanged(name, e.target.value, 'min', type)} />
                            <input className='w-50 form-control form-control-sm' type='number' placeholder='Max' onChange={e => filterChanged(name, e.target.value, 'max', type)} />
                        </div>}
                    </Card>
                    html.push(h);
                } break;
                case 'radio': {
                    const h = <Card
                        // size="small"
                        style={{
                            height: options.length > 3 ? '10rem' : 'auto',
                            overflowY: 'auto',
                            zIndex: '100'
                        }}
                        className={`mb-2  border-0 rounded ${isDesktop && 'card'}`}
                        key={real_name}>
                        {isDesktop && real_name}
                        {searchable}
                        <div data-name={name}>
                            <div className={`item form-check`}>
                                <input className='form-check-input' type="radio" name={name} id={name + '_showall'} value={'showAll'} onChange={async e => resetFilter(name, e.target.value)} />
                                <label className='form-check-label' htmlFor={name + '_showall'}>Show All</label>
                            </div>
                        </div>
                        <div data-name={name}>
                            {options.map((opt, i) => {
                                const id = real_name + '_' + i;
                                return <div key={id} className={`item form-check ${opt.filter_visible ? 'searchable' : 'd-none'}`}>
                                    <input className='form-check-input' type="radio" name={name} id={id} value={opt.opt} onChange={e => filterChanged(name, opt.opt, name, type)} />
                                    <label className='form-check-label' htmlFor={id}>
                                        {opt.opt}&nbsp;
                                        {
                                            stats && stats.map((s) => (s.value === opt.opt && s.filter === name) && <label key={id + '_stat'} className={`${Settings.textColor} fw-bolder`}> | {utils.abbreviateNumber(s.counter)} ads</label>)
                                        }
                                    </label>
                                </div>
                            })}
                            <div className={`item form-check}`}>
                                <input className='form-check-input' type="radio" name={name} id={`Other_${name}`} value='Other' onChange={e => filterChanged(name, 'Other', name, type)} />
                                <label className='form-check-label' htmlFor={`Other_${name}`}>&nbsp; Others</label>
                            </div>
                        </div>
                    </Card>
                    html.push(h);
                } break;
                case 'range_radio': {
                    const h = <Card
                        // size="small"
                        style={{
                            zIndex: '100',
                            height: options.length > 3 ? '10rem' : 'auto',
                            overflowY: 'auto',
                        }}
                        className={`mb-2  border-0 rounded ${isDesktop && 'card'}`}
                        key={real_name}
                    >
                        {isDesktop && real_name}
                        {searchable}
                        {isDesktop ? <div className='d-flex flex-wrap flex-md-nowrap mb-2' data-name={name}>
                            <input className='form-control form-control-sm me-2' type='number' placeholder='Min' onChange={e => filterChanged(name, e.target.value, 'min', type)} />
                            <input className='form-control form-control-sm' type='number' placeholder='Max' onChange={e => filterChanged(name, e.target.value, 'max', type)} />
                        </div> : <div className='d-flex mb-1' data-name={name}>
                            <input className='w-50 form-control form-control-sm me-2' type='number' placeholder='Min' onChange={e => filterChanged(name, e.target.value, 'min', type)} />
                            <input className='w-50 form-control form-control-sm' type='number' placeholder='Max' onChange={e => filterChanged(name, e.target.value, 'max', type)} />
                        </div>}
                        <div data-name={name}>
                            <div className={`item form-check`}>
                                <input className='form-check-input' type="radio" name={name} id={name + '_showall'} value={'showAll'} onChange={async e => resetFilter(name, e.target.value)} />
                                <label className='form-check-label' htmlFor={name + '_showall'}>Show All</label>
                            </div>
                        </div>
                        <div data-name={name}>
                            {options.map((opt) => {
                                const id = real_name + '_' + i;
                                return <div key={id} className={`item form-check ${opt.filter_visible ? 'searchable' : 'd-none'}`}>
                                    <input className='form-check-input' type="radio" name={name} id={id} value={opt.opt} onChange={e => filterChanged(name, opt.opt, name, type)} />
                                    <label className='form-check-label' htmlFor={id}>
                                        {opt.opt}
                                        &nbsp;
                                        {
                                            stats && stats.map((s) => (opt.opt.toLowerCase().includes(s.value.toLowerCase()) && s.filter === name) && <label key={id + '_stat'} className={`${Settings.textColor} fw-bolder`}> | {utils.abbreviateNumber(s.counter)} ads</label>)
                                        }
                                    </label>
                                </div>
                            })}
                            <div className={`item form-check}`}>
                                <input className='form-check-input' type="radio" name={name} id={`Other_${name}`} value='Other' onChange={e => filterChanged(name, 'Other', name, type)} />
                                <label className='form-check-label' htmlFor={`Other_${name}`}>&nbsp; Others</label>
                            </div>
                        </div>
                    </Card>
                    html.push(h);
                } break;
                case 'check': {
                    const h = <Card
                        // size="small"
                        style={{
                            height: options.length > 3 ? '10rem' : 'auto',
                            overflowY: 'auto',
                            zIndex: '100'
                        }}
                        className={`mb-2  border-0 rounded ${isDesktop && 'card'}`}
                        key={real_name}>
                        {isDesktop && real_name}
                        {searchable}
                        <div data-name={name}>
                            {options.map((opt, i) => {
                                const id = real_name + '_' + i;
                                return <div key={id} className={`item form-check ${opt.filter_visible ? 'searchable' : 'd-none'}`}>
                                    <input className='form-check-input' type="checkbox" name={`${name}_${i}`} id={id} value={opt.opt} onChange={e => filterChanged(`${name}_${i}`, opt.opt, e.target, type)} />
                                    <label className='form-check-label' htmlFor={id}>
                                        {opt.opt}
                                        &nbsp;
                                        {
                                            stats && stats.map((s) => (s.value === opt.opt && s.filter === name) && <label key={id + '_stat'} className={`${Settings.textColor} fw-bolder`}> | {utils.abbreviateNumber(s.counter)} ads</label>)
                                        }
                                    </label>
                                </div>
                            })
                            }
                        </div>
                    </Card>
                    html.push(h);
                } break;
            } //end switch           
        }
        if (html.length > 0) {
            //if one of the filters is clicked and that filter is a parent regenerate it children
            if (editedModelIndex) {
                let c = [...mountedFilters].map((mf, i) => {
                    if (i === editedModelIndex) {
                        mf = html[0];//replace the edited portion of the form
                    }
                    return mf;
                });
                setMountedFilters(c);
                return;
            }
            //if category is clicked
            setMountedFilters(html);
        } else {
            setMountedFilters([]);
        }
    }
    function onCatClick(e) {
        const category = $(e.target).data('to');
        setEditedModelIndex(null);
        setEditedModel('');
        getCategoryFilters('category', category);
        if (cat === category) {
            setTimeout(async () => {
                setLoaderActive(true);
                await applyFilters();
            }, 50)
        }
    }


    function renderDependents(value, filter) {
        const obj = valuesStore.getArrayObjectsValue('filters', 'name', filter);
        let dependent = obj.dependent;

        //GETTING DEPENDENT FROM FORMMODEL STATE. WILL BE A SINGLE OBJECT IN ARRAY
        const fm = formModel.filter((model) => {
            if (model.filter.name === dependent) {
                return model;
            }
        });

        // //EXIT IF FORMMODEL IS NIL
        if (!fm || !fm[0]) return;

        //GET OPTIONS OF DEPENDENT AND EDIT
        const options = fm[0].options;
        const newOpt = [...options].map((opt) => {
            if (opt.parent === value) {
                opt.filter_visible = 1;
            } else {
                opt.filter_visible = 0;
            }
            if (value === 'showAll') {
                opt.filter_visible = 1;
            }
            return opt;
        });

        // UPDATE MODEL WITH EDITED ELEMENT
        const formModelCopy = [...formModel].map((model, i) => {
            if (model.filter.name === newOpt[0].filter) {
                model.options = newOpt;
                setEditedModel(model.filter.name);
                setEditedModelIndex(i);
            }
            return model;
        });
        setFormModel(formModelCopy);
    }

    async function resetFilter(filter, value) {
        const child = valuesStore.getArrayObjectsValue('filters', 'name', filter);
        let dependent = child.dependent;//dependent of this filter can also be removed        
        const sp = { ...utils.getQString() };
        delete sp[filter];
        // delete sp[dependent];
        renderDependents(value, filter);
        setSearchParams(sp);
        setLoaderActive(true);
        setTimeout(async e => {
            await applyFilters();
        }, 1000);
    }

    function filterChanged(filter, value, extra, type) {
        const sp = { ...utils.getQString() };
        dataToRender.current = [];
        if (type === 'check') {//mutiple values                                    
            const el = extra;
            if (el.checked) {
                sp[filter] = value;
            } else {
                delete sp[filter];
            }
        } else if (type === 'minMax') {
            if (extra === 'min') {
                sessionStorage.setItem(`${filter}_min`, value);
            }
            if (extra === 'max') {
                sessionStorage.setItem(`${filter}_max`, value);
            }
            const min = sessionStorage.getItem(`${filter}_min`);
            const max = sessionStorage.getItem(`${filter}_max`);
            if (min && max) {
                if (min !== '' && max !== '') {
                    sp[filter] = `${min}-${max}`;
                } else {
                    delete sp[filter];
                }
            } else {
                delete sp[filter];
            }
        } else if (type === 'range_radio') {
            if (value.includes('-')) {
                const v = value.split('-');
                const min = v[0].trim();
                const max = v[1].trim();
                sp[filter] = `${min}-${max}`;
            } else {
                if (extra === 'min') {
                    sessionStorage.setItem(`${filter}_min`, value);
                }
                if (extra === 'max') {
                    sessionStorage.setItem(`${filter}_max`, value);
                }
                const min = sessionStorage.getItem(`${filter}_min`);
                const max = sessionStorage.getItem(`${filter}_max`);
                if (min && max) {
                    if (min !== '' && max !== '') {
                        sp[filter] = `${min}-${max}`;
                    } else {
                        delete sp[filter];
                    }
                } else {
                    delete sp[filter];
                }
            }
        } else {//single value                        
            sp[filter] = value;
        }
        //getting dependents
        if (type !== 'minMax') {
            if (filter.includes('_')) {
                filter = filter.split('_')[0];
            }
            renderDependents(value, filter);
        }

        //determine if the applied filter has dependants or not
        const obj = valuesStore.getArrayObjectsValue('filters', 'name', filter);
        let dependent = obj.dependent;
        if (dependent) {
            if (dependent.trim() === '') {//this is a filter that has no dependent
                setFilterIsBranch(false);
            } else {
                setFilterIsBranch(true);
            }
        } else {//to handle price and location
            setFilterIsBranch(false);
        }
        setLoaderActive(true);
        setSearchParams(sp);
        clearTimeout(filterTimer)
        filterTimer = setTimeout(async e => {
            await applyFilters();
        }, 1000);
    }//end of function
    return { mountedFilters, getLocation, locations, filterChanged, categoryMenu, filterNames, filterIsBranch, getPriceFilter, statsSetter, popularFilters };
}