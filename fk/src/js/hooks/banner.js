

import React, { useState, useMemo } from 'react';
// import ValuesStore from '../store/values-store';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import { message } from 'antd';
import useWindowDimensions from '../components/screensize';
//this hook is based on zustand
const useBanner = () => {
    // const valuesStore = ValuesStore();        
    const [image, setImage] = useState('linear');
    const [page, setPage] = useState(undefined);
    const [text, setText] = useState('');
    const { vpHeight, vpWidth } = useWindowDimensions();
    const imgStyle = vpWidth < 700 ? { height: '4.6rem' } : {};
    useMemo(() => {
        getBannerPicture();
    }, [page]);


    async function getBannerPicture(url = `${Settings.backend}/get_banner_picture`) {
        const data = { page };
        let res = await utils.requestWithReauth('post', url, undefined, data);
        if (res.status === 'Ok') {
            const item = res.items[0];
            const picture = item?.picture;
            const text = item?.text;
            setImage(picture);
            setText(text);
        } else {
            // message.error(res.msg);
        }
    };

    function banner(style) {
        return <div style={style || { marginTop: '3.5rem' }}>
            <div style={imgStyle}><img className='img-fluid w-100' style={{ height: '100%' }} src={`${Settings.backend}/${image}`} /></div>
        </div>
    }

    return { setImage, setPage, banner, text, image };
}

export default useBanner;