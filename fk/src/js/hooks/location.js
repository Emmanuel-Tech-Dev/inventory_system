
import React, { memo, useRef, useMemo, forwardRef, useState, useEffect } from 'react';
import SettingsStore from '../store/settings-store';
import ValuesStore from '../store/values-store';
import Datatable from '../components/datatable';
import { SearchOutlined } from '@ant-design/icons';
import { Input, Tree, TreeSelect, Modal, Alert } from 'antd';
import Settings from '../dependencies/custom/settings'
import utils from '../dependencies/custom/react-utilities';

const useLocation = (onLocationCancel, open) => {
    // const { open, onCancel, setFilteredLocation } = props;
    // const [showLeafIcon, setShowLeafIcon] = useState(true);
    const [showIcon, setShowIcon] = useState(false);
    const [treeLine, setTreeLine] = useState(true);
    const valuesStore = ValuesStore();
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [filteredLocation, setFilteredLocation] = useState('Ghana');    
    const [stats, setStats] = useState({});
    let data = JSON.parse(JSON.stringify(valuesStore.getValue('regDistTreeSelectDataNoDisabled')));
    useMemo(() => {
        appendStats(data);
    }, [expandedKeys, data, valuesStore['reg_dist'], valuesStore['regDistTreeSelectDataNoDisabled'], stats]);


    function appendStats(data) {//a depth-first recursive function
        if (!stats) return;
        data.forEach((d) => {
            let children = d.children;
            let val = d.value;
            let stat = 0;
            if (children.length > 0) {
                appendStats(children);
                children.forEach(child => {
                    if (child['stat']) {
                        stat += parseInt(child['stat']);
                    }
                });
                d['stat'] = stat;
                d['title'] = `${d['title']} ~ ${utils.abbreviateNumber(stat)} ads`;

            } else if (stats[val]) {
                //some stats have the count from the backend while others do not                
                //stats that do not have the count prop are arrays and so their length are used for the stats
                if (Array.isArray(stats[val])) {
                    d['stat'] = stats[val].length;
                    d['title'] = `${d['title']} ~ ${utils.abbreviateNumber(stats[val].length)} ads`;
                } else {
                    //stats that have the count prop are object and so the count value is accessed for the stats
                    if (stats[val]['count']) {//the count prop is set at the backend
                        d['stat'] = stats[val]['count'];
                        d['title'] = `${d['title']} ~ ${utils.abbreviateNumber(stats[val]['count'])} ads`;
                    }
                }
            }
        });
    }


    function onLocationSearchChange(e) {
        setShowErrorAlert(false);
        const value = e.target.value.toLowerCase();
        const rd = valuesStore.getValue('reg_dist');
        const reg_dist = rd.map((rd) => {
            if (rd.name.toLowerCase().includes(value)) {
                const alias = valuesStore.getArrayObjectsValue('reg_dist', 'name', rd.name);
                return alias.alias;
            }
            return null;
        }).filter((val, index) => {
            if (val) return val;
        });
        setExpandedKeys(reg_dist);
        setSelectedKeys(reg_dist);
        if (e.keyCode === 13) {//if enter key is pressed     
            if (reg_dist[0]) {
                setSelectedKeys([reg_dist[0]]);
                valuesStore.setValue('selected_location', reg_dist[0]); 
                onLocationCancel();               
            } else {
                setShowErrorAlert(true);
            }
        }
    }

    function onSimpleLocationSearchChange(e) {
        setShowErrorAlert(false);
        const value = e.target.value.toLowerCase();
        const rd = valuesStore.getValue('reg_dist');
        const reg_dist = rd.map((rd) => {
            if (rd.name.toLowerCase().includes(value)) {
                const alias = valuesStore.getArrayObjectsValue('reg_dist', 'name', rd.name);
                return alias.alias;
            }
            return null;
        }).filter((val, index) => {
            if (val) return val;
        });
        setExpandedKeys(reg_dist);
        setSelectedKeys(reg_dist);
        if (e.keyCode === 13) {//if enter key is pressed     
            if (reg_dist[0]) {
                setSelectedKeys([reg_dist[0]]);                
                const l = utils.getLocation(reg_dist[0], valuesStore);                
                onLocationCancel(l);                
            } else {
                setShowErrorAlert(true);
            }
        }
    }

    function onSelect(keys, info) {
        const node = info.node;
        const value = node.value;
        const title = node.title;
        setFilteredLocation(title);
        setSelectedKeys([value]);
        valuesStore.setValue('selected_location', value);
    }

    function simpleOnSelect(keys, info) {
        const node = info.node;
        const value = node.value;
        // const title = node.title;
        const l = utils.getLocation(value,valuesStore);
        setFilteredLocation(l);
        setSelectedKeys([value]);        
    }

    const onExpand = (newExpandedKeys) => {
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(true);
    }


    function location() {
        return <Modal open={open} title={null} footer={null} onCancel={onLocationCancel}>
            <label className='fw-bolder mb-3 h5'>Get Ads From</label>
            {showErrorAlert && <Alert message="Location not found!" className="mb-2" type="error" closable />}
            <Input
                style={{}}
                className='mb-2'
                placeholder="Search Location"
                onKeyUp={onLocationSearchChange} />
            <Tree
                className={`fw-bolder ${Settings.textColor}`}
                style={{ fontSize: '13pt' }}
                showLine={treeLine}
                showIcon={showIcon}
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                selectedKeys={selectedKeys}
                onSelect={onSelect}
                treeData={data}
            />
        </Modal>
    }

    function simpleLocation() {
        return <Modal open={open} title={null} footer={null} onCancel={onLocationCancel}>
            <label className='fw-bolder mb-3 h5'>Your Location</label>
            {showErrorAlert && <Alert message="Location not found!" className="mb-2" type="error" closable />}
            <Input
                style={{}}
                className='mb-2'
                placeholder="Search Location"
                onKeyUp={onSimpleLocationSearchChange} />
            <Tree
                className={`fw-bolder ${Settings.textColor}`}
                style={{ fontSize: '13pt' }}
                showLine={treeLine}
                showIcon={showIcon}
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                selectedKeys={selectedKeys}
                onSelect={simpleOnSelect}
                treeData={valuesStore.regDistTreeSelectDataNoDisabled}
            />
        </Modal>
    }

    return { location, simpleLocation, filteredLocation, setStats }
}

export default useLocation;