import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createTrackedSelector } from 'react-tracked';
import Settings from '../dependencies/custom/settings';
const store = (set, get) => ({
    getStates: () => {//returns an array 
        const states = get();//zustand get callback function
        return states;
    },
    tables_metadata: {
        method: 'post',
        table: 'tables_metadata',
        url: `${Settings.backend}/bootstrap`,
        storeName: 'tables_metadata',
    },

   

    settings: {
        method: 'post',
        table: 'settings',
        url: `${Settings.backend}/bootstrap`,
        storeName: 'settings',
        critfdx: ['is_public'],
        critval: ['1'],
        fields: ['*']
    },


   
});

const useStore = create(devtools(store));

const useTrackedStore = createTrackedSelector(useStore);
export default useTrackedStore;

