
import React, { useState, useMemo } from 'react';
// import ValuesStore from '../store/values-store';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import { Carousel, message } from 'antd';
import { Link } from 'react-router-dom';
//this hook is based on zustand
const useCarousel = () => {
    // const valuesStore = ValuesStore();        
    const [easing, setEasing] = useState('linear');
    const [effect, setEffect] = useState('scrollx');//scrollx | fade
    // const [style, setStyle] = useState({ marginTop: '3.5rem' });
    // const [contentStyle, setContentStyle] = useState({ height: '20rem' });
    const [style, setStyle] = useState({});
    const [contentStyle, setContentStyle] = useState({});
    const [showDots, setShowDots] = useState(true);
    const [dotPosition, setDotPosition] = useState('bottom');
    const [autoplay, setAutoplay] = useState(true);
    const [customBeforeChange, setCustomBeforeChange] = useState(undefined);
    const [customAfterChange, setCustomAfterChange] = useState(undefined);
    const [carouselItems, setCarouselItems] = useState(undefined);
    const [urlKey, setUrlKey] = useState(undefined);

    useMemo(() => {
        getCarouselItems(undefined, undefined, undefined, undefined, undefined);
    }, [urlKey]);

    function carouselItem(v) {
        return <div key={v.picture}>
            <div style={contentStyle}><img className='img-fluidx w-100' src={`${Settings.backend}/${v.picture}`} /></div>
        </div>
    }

    async function getCarouselItems(url = `${Settings.backend}/get_carousel_items`, data = undefined, endpoint = undefined, customPath = undefined, customPathKey = undefined) {
        let res = await utils.requestWithReauth('post', url, endpoint, data);
        if (res.status === 'Ok') {
            const r = res.items;
            const items = r?.sort((a, b) => (a.rank - b.rank))?.map(v => {                               
                return urlKey && v[urlKey]?.trim() !== '' ?
                    <a key={v.picture + '_link'} href={`${v[urlKey]}`} target='_blank'>
                        {carouselItem(v)}
                    </a> :
                    customPath && customPathKey ?
                        <Link key={v.picture + '_link'} to={`${customPath}/${v[customPathKey]}`}>
                            {carouselItem(v)}
                        </Link> :
                        customPathKey ?
                            <a key={v.picture + '_link'} href={`${v[customPathKey]}`} target='_blank'>
                                {carouselItem(v)}
                            </a> :
                            carouselItem(v)
            });
            setCarouselItems(items);
        } else {
            message.error(res.msg);
        }
    };

    function afterChange(current) {
        if (!customAfterChange?.afterChange) {
            // message.error('afterChange prop or function is required for this action');
            return false;
        }
        customAfterChange?.afterChange(current);
    }

    function beforeChange(from, to) {
        if (!customBeforeChange?.beforeChange) {
            // message.error('beforeChange prop or function is required for this action');
            return false;
        }
        customBeforeChange?.beforeChange(from, to);
    }

    function carousel() {
        return <Carousel
            easing={easing}
            effect={effect}
            dots={showDots}
            autoplay={autoplay}
            dotPosition={dotPosition}
            style={style}
            beforeChange={(from, to) => beforeChange(from, to)}
            afterChange={current => afterChange(current)}>
            {carouselItems}
        </Carousel>
    }

    return { setUrlKey, getCarouselItems, setCustomBeforeChange, setCustomAfterChange, carousel, setEasing, setAutoplay, setContentStyle, setDotPosition, setEffect, setShowDots, setStyle };
}

export default useCarousel;