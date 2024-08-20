import { Watermark } from 'antd';
import { useLocation } from 'react-router-dom';
import ValuesStore from '../../store/values-store';
import { useState, useMemo } from 'react';
import Settings from '../../dependencies/custom/settings';


const Landing = ({ homepage }) => {
    const valuesStore = ValuesStore();
    const { state } = useLocation();
    const [schoolDetails, setSchoolDetails] = useState();


    useMemo(() => {
        const institution = valuesStore.getArrayObjectsValue('settings', 'prop', 'INSTITUTION_DETAILS')?.value;
        if (institution) {
            setSchoolDetails(JSON.parse(institution));
        }



    }, [valuesStore['settings']]);

    return (
        <>
            <Watermark content={['AAMUSTED', 'ELECTORAL COMMISSION']}>
                <div
                    style={{
                        height: 600,
                        
                    }}
                    className=''
                >
                    <label className='h2 text-muted'>Welcome {state?.data?.name}</label>
                </div>
            </Watermark>
        </>

    )
}

export default Landing;

