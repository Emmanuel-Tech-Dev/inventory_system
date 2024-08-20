
import { useState, useMemo } from 'react';
import $ from 'jquery';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import ValuesStore from '../store/values-store';

export default function useQuickMsg(setQMsg) {
    const valuesStore = ValuesStore();
    const [textareaRef, setTextareaRef] = useState(null);    
    const convoStarter = valuesStore.getValue('convo_starter');
    useMemo(() => {

    }, []);

    const msg = () => {
        return <div className='h-scrolling-wrapper'>
            {convoStarter.map((v) => (<span data-id={v.id} onClick={setQuickMsg} key={utils.generateUuid()} style={{ cursor: 'pointer' }} className={`h-scrolling-item badge rounded-pill me-1 ${Settings.secondaryColor}`}>{v.short_convo}</span>))}
        </div>
    }

    function setQuickMsg(e) {
        let { target } = e;
        let id = $(target).data('id');
        let m = valuesStore.getArrayObjectsValue('convo_starter', 'id', id);
        setQMsg(m.long_convo);        
    }
    return { msg };
}