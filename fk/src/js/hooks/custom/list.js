
import React, { useState, memo, useMemo, useRef } from 'react';
// import ValuesStore from '../store/values-store';
import utils from '../dependencies/custom/react-utilities';
import { List, Avatar } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import qs from 'qs';



const useList = (initTblParam, dataEndpoint, requestMethod = 'get', resultKey, totalCountKey, rowId, extraEndpoint = null) => {
  // const valuesStore = ValuesStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialParams, setInitialParams] = useState({ ...initTblParam });
  const [extraFetchParams, setExtraFetchParams] = useState(undefined);
  const [renderer, setRenderer] = useState(undefined);

  const getQueryParams = (params) => ({
    results: params.pagination?.pageSize,
    page: params.pagination?.current,
    ...params,
  });


  const fetchData = async () => {
    setLoading(true);
    let results = [];
    if (requestMethod === 'get') {
      results = await utils.requestWithReauth(requestMethod, `${dataEndpoint}?${qs.stringify(getQueryParams(initialParams))}`, null, undefined);
    } else if (requestMethod === 'post') {
      const data = getQueryParams(initialParams);
      results = await utils.requestWithReauth(requestMethod, `${dataEndpoint}`, extraEndpoint, { ...data, extraFetchParams });
    }
    // console.log(results);
    setData(results[resultKey] || []);
    setLoading(false);
    setInitialParams({//copy initial param and override pagination details
      ...initialParams,
      pagination: {
        ...initialParams.pagination,
        total: parseInt(results[totalCountKey]),
      },
    });
  };

  const handleChange = (current, pageSize) => {
    setInitialParams({ pagination: { current, pageSize } })
    // `dataSource` is useless since `pageSize` changed
    if (pageSize !== initialParams.pagination?.pageSize) {
      setData([]);
    }
  };

  useMemo(() => {
    if (dataEndpoint) {
      fetchData();
    }
  }, [JSON.stringify(initialParams)]);

  function list() {
    return <List
      itemLayout="vertical"
      // size="large"
      pagination={
        renderer ? {
          onChange: (current, pageSize) => {
            handleChange(current, pageSize);
          },
          pageSize: initialParams.pagination?.pageSize || 0,
          total: initialParams.pagination?.total || 0
        } : undefined
      }
      dataSource={data}
      // footer={
      //   <div>
      //     <b>ant design</b> footer part
      //   </div>
      // }
      renderItem={(item) => (
        <List.Item
          key={item[rowId]}
          actions={[
            // <IconText icon={StarOutlined} text="156" key="list-vertical-star-o" />,
            // <IconText icon={LikeOutlined} text="156" key="list-vertical-like-o" />,
            // <IconText icon={MessageOutlined} text="2" key="list-vertical-message" />,
          ]}
        // extra={
        //   <img
        //     width={272}
        //     alt="logo"
        //     src="https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
        //   />
        // }
        >
          {
            renderer && <List.Item.Meta
              avatar={
                typeof renderer?.avatar?.render !== "undefined" ?
                  renderer?.avatar?.render(item[renderer?.avatar?.key], item)
                  : item[renderer?.avatar?.key]
              }
              title={
                typeof renderer?.title?.render !== "undefined" ?
                  renderer?.title?.render(item[renderer?.title?.key], item)
                  : item[renderer?.title?.key]
              }
              description={
                typeof renderer?.description?.render !== "undefined" ?
                  renderer?.description?.render(item[renderer?.description?.key], item)
                  : item[renderer?.description?.key]
              }
            />
          }
          {
            renderer && (typeof renderer?.content?.render !== "undefined" ?
              renderer?.content?.render(item[renderer?.content?.key], item)
              : item[renderer?.content?.key])
          }
        </List.Item>
      )}
    />
  }

  return { setData, data, list, fetchData, setExtraFetchParams, extraFetchParams, setRenderer }
}

export default useList;